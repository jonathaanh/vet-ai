"use client";

import { useState } from "react";
import { ClipLoader } from "react-spinners";

interface ResponseAreaProps {
	response: string;
	loading: boolean;
}

export default function ResponseArea({response, loading}: ResponseAreaProps){
	return(
		<div className="h-[93vh] bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-[#2b2b2b]">Output</h2>
          <div className="h-[80vh] p-4 bg-gray-50 rounded-lg border">
            {/* Response will go here */}
            <p className="text-gray-500">
				{loading && (
                  <div className="items-center">
                      <ClipLoader size={18} color={"#5474AB"} loading={loading} />
                  </div>
                )}
				{response || "Response will appear here..."}
			</p>
          </div>
        </div>
	)
}