from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage


def queryModel(text):
	load_dotenv()
	model = ChatOpenAI(model="gpt-4o-mini")

	message = HumanMessage(content=text)

	try:
		result = model.invoke([message])
		print("Full result:")
		print(result)
		return result.content
	except Exception as e:
		print(f"Error in model query: {str(e)}")
		raise e