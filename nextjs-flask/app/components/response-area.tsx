"use client";

import { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners";
import { FiCopy, FiThumbsUp, FiThumbsDown } from "react-icons/fi";

interface ResponseAreaProps {
  response: string;
  loading: boolean;
}

export default function ResponseArea({ response, loading }: ResponseAreaProps) {
  const [responseStatus, setResponseStatus] = useState<"good" | "bad" | null>(
    null
  );

  useEffect(() => {
    if (loading) {
      setResponseStatus(null);
    }
  }, [loading]);

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      alert("Response copied to clipboard!");
    }
  };

  const handleGoodResponse = () => {
    setResponseStatus("good");
  };

  const handleBadResponse = () => {
    setResponseStatus("bad");
  };
  return (
    <div className="h-[93vh] bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-[#2b2b2b]">Output</h2>
      <div className="h-[75vh] p-4 bg-gray-50 rounded-lg border">
        <p className="text-gray-500">
          {loading && (
            <div className="items-center">
              <ClipLoader size={18} color={"#5474AB"} loading={loading} />
            </div>
          )}
          {response || "Response will appear here..."}
        </p>
      </div>
      <div className="py-5 flex space-x-3">
        <button
          onClick={handleCopy}
          className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 
                             text-gray-700 rounded-md transition-colors duration-200"
          title="Copy response"
        >
          <FiCopy className="mr-2" />
          Copy
        </button>

        <button
          onClick={handleGoodResponse}
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200
                              ${
                                responseStatus === "good"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
          title="Mark as good response"
        >
          <FiThumbsUp className="mr-2" />
          Good
        </button>

        <button
          onClick={handleBadResponse}
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200
                              ${
                                responseStatus === "bad"
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
          title="Mark as bad response"
        >
          <FiThumbsDown className="mr-2" />
          Bad
        </button>
      </div>
    </div>
  );
}
