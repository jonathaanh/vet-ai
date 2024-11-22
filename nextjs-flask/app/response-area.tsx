interface ResponseAreaProps {
	response: string;
}

export default function ResponseArea({response}: ResponseAreaProps){
	return(
		<div className="h-[93vh] bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-[#2b2b2b]">Output</h2>
          <div className="h-[80vh] p-4 bg-gray-50 rounded-lg border">
            {/* Response will go here */}
            <p className="text-gray-500">
				{response || "Response will appear here..."}
				</p>
          </div>
        </div>
	)
}