
export default function FileUpload(){
	return (
		<div className="h-[46vh] bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-[#2b2b2b]">Documents</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                className="hidden"
                id="file-upload"
                multiple
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer text-[#5474AB] hover:text-[#5474AB]"
              >
                Click to upload files
              </label>
              <p className="text-sm text-gray-500 mt-2">
                or drag and drop files here
              </p>
            </div>
            {/* File List will go here */}
            <div className="mt-4 space-y-2">
              {/* We'll add uploaded files here later */}
            </div>
          </div>
	)
}