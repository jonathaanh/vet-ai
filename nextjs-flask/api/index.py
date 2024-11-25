from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.utils import secure_filename
from supabase import create_client, Client
import tempfile
import logging
import os
from pinecone import Pinecone, ServerlessSpec
from langchain_community.document_loaders import TextLoader, PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
from langchain_community.document_loaders import FireCrawlLoader



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = Flask(__name__)
CORS(app)
APP_SECRETS = {}

def initialize_pinecone():
    pinecone = Pinecone(api_key=APP_SECRETS.get('Pinecone'))
    try:
        index = pinecone.Index("vetai-docs")
        logger.info("Successfully connected to existing index")
        return index
    except Exception as e:
        if "vetai-docs" not in pinecone.list_indexes():
            pinecone.create_index(
                name="vetai-docs",
                dimension=1536,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                ) 
            )
        return pinecone.Index("vetai-docs")

def initialize_secrets():
    try:
        conn = psycopg2.connect(
            user="postgres.hdknwxzhmxotruzjjxio",
            password="cwRPXu5mSQUL5XHz",
            host="aws-0-us-west-1.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            select *
            from vault.decrypted_secrets
            order by created_at desc
            limit 3
        """)
        
        secrets = cursor.fetchall()
        cursor.close()
        conn.close()

        global APP_SECRETS
        APP_SECRETS = {secret['name']: secret['decrypted_secret'] for secret in secrets}

    except Exception as e:
        logger.error(f"Error initializing secrets: {str(e)}")
        raise
    
@app.route("/api/search_documents", methods=['POST'])
def search_documents():
    try:
        data = request.get_json()
        query = data.get('text')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
            
        embeddings = OpenAIEmbeddings(
            api_key=APP_SECRETS.get('openai-api'),
            model="text-embedding-3-small"
        )
        vector_store = PineconeVectorStore(
            index_name="vetai-docs",
            embedding=embeddings
        )
        results = vector_store.similarity_search_with_score(
            query=query,
            k=3
        )
        docs = [result[0] for result in results]
        combined_input = (
            "Here are some documents that might help answer the question: "
            + query
            + "\n\nRelevant Documents:\n"
            + "\n\n".join([doc.page_content for doc in docs])
            + "\n\nPlease provide an answer based only on the provided documents. If the answer is not found in the documents, respond with 'I'm not sure'."
        )
        model = ChatOpenAI(
            api_key=APP_SECRETS.get('openai-api'),
            model="gpt-4"
        )
        messages = [
            SystemMessage(content="You are a helpful veterinarian assistant."),
            HumanMessage(content=combined_input),
        ]
        result = model.invoke(messages)
        
        return jsonify({
            'results': result.content,
            'sources': [{'content': doc.page_content, 'metadata': doc.metadata} for doc in docs]
        }), 200
        
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route("/api/get_files", methods=['GET'])
def get_files():
    try:
        url = "https://hdknwxzhmxotruzjjxio.supabase.co"
        key = APP_SECRETS.get('Supabase')
        if not url or not key:
            return jsonify({'error': 'Supabase URL or Key is missing'}), 500
        supabase = create_client(url, key)
        response = supabase.table("files").select("*").execute()
        return jsonify({'files': response.data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/delete_file", methods=['POST'])
def delete_files():
    try:
        data = request.get_json()
        if not data or 'file_name' not in data:
            return jsonify({'error': 'No file part'}), 400
        file_name = data['file_name']
        url = "https://hdknwxzhmxotruzjjxio.supabase.co"
        key = APP_SECRETS.get('Supabase')
        pc = Pinecone(api_key=APP_SECRETS.get('Pinecone'))
        index = pc.Index("vetai-docs")
        results = index.query(
            vector=[0] * 1536,
            filter={
                "filename": {"$eq": file_name}
            },
            top_k=10000,
            include_metadata=True
        )
        if hasattr(results, 'matches') and results.matches:
            ids_to_delete = [match.id for match in results.matches]
            try:
                index.delete(
                    ids=ids_to_delete
                )
            except Exception as e:
                logger.error(f'Error deleting vectors: {str(e)}')
                raise
        else:
            logger.info('No matching vectors found to delete')
        supabase = create_client(url, key)
        supabase.table("files").delete().eq("file_name", file_name).execute()

        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/upload_file", methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        file_size = int(request.form.get('file_size', 0))
        embeddings = OpenAIEmbeddings(
            api_key=APP_SECRETS.get('openai-api'),
            model="text-embedding-3-small"
        )
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            file.save(temp_file.name)
            
            if suffix == '.pdf':
                loader = PyPDFLoader(temp_file.name)
            elif suffix == '.docx':
                loader = Docx2txtLoader(temp_file.name)
            else:
                loader = TextLoader(temp_file.name)
            
        documents = loader.load()
        os.unlink(temp_file.name)

        text_splitter = CharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        texts = text_splitter.split_documents(documents)
        for text in texts:
            text.metadata["filename"] = filename
        PineconeVectorStore.from_documents(
            documents=texts,
            embedding=embeddings,
            index_name="vetai-docs",
        )

        sup_url = "https://hdknwxzhmxotruzjjxio.supabase.co"
        key = APP_SECRETS.get('Supabase')
        supabase: Client = create_client(sup_url, key)
        response = supabase.table("files").insert(
            {"file_name": filename, "file_size": file_size}).execute()

        return jsonify({'message': 'File processed and embeddings stored successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route("/api/upload_website", methods=['POST'])
def upload_website():
    try:
        api_key = APP_SECRETS.get('Firecrawl')
        url = request.get_json().get('url')
        loader = FireCrawlLoader(api_key=api_key, url=url, mode="scrape")
        docs = loader.load()

        text_splitter = CharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
            )
        texts = text_splitter.split_documents(docs)

        for text in texts:
            text.metadata["filename"] = url

        embeddings = OpenAIEmbeddings(
            api_key=APP_SECRETS.get('openai-api'),
            model="text-embedding-3-small"
        )

        PineconeVectorStore.from_documents(
            documents=texts,
            embedding=embeddings,
            index_name="vetai-docs",
        )
        total_bytes = sum(len(doc.page_content.encode('utf-8')) for doc in docs)
        sup_url = "https://hdknwxzhmxotruzjjxio.supabase.co"
        key = APP_SECRETS.get('Supabase')

        supabase: Client = create_client(sup_url, key)
        response = supabase.table("files").insert({"file_name": url, "file_size": total_bytes}).execute()
        return jsonify({'message': 'Website processed and embeddings stored successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/save_template", methods=['POST'])
def save_template():
    try:
        data = request.get_json()
        name = data.get('name')
        text = data.get('text')

        url = "https://hdknwxzhmxotruzjjxio.supabase.co"
        key = APP_SECRETS.get('Supabase')

        supabase: Client = create_client(url, key)
        response = (
            supabase.table("templates")
            .insert({"template_name": name, "content": text})
            .execute()
        )
        return jsonify({'message': 'Template saved successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route("/api/load_templates", methods=['GET'])
def load_templates():
    try:
        url = "https://hdknwxzhmxotruzjjxio.supabase.co"
        key = APP_SECRETS.get('Supabase')
        logger.info(f"Loading templates from {url}, {key}")

        supabase: Client = create_client(url, key)
        response = supabase.table("templates").select("*").execute()

        return jsonify({'templates': response.data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
initialize_secrets()
initialize_pinecone()
if __name__ == '__main__':
    app.run(port=5328, debug=True)