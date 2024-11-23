"use client";

import React, { useState } from "react";

interface QueryBoxProps {
	onResponseReceived: (response: string) => void;
	onLoading: (loading: boolean) => void;
}

export default function QueryBox({ onResponseReceived, onLoading }: QueryBoxProps) {
	const [query, setQuery] = useState("");

	const calculateCharCount = (text: string) => {
		return text.length;
	};
	
	const charCount = calculateCharCount(query);

	const askVetAI = async() => {
		onLoading(true);
		try {
			const response = await fetch('/api/ask_model', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: query
				})
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const data = await response.json();
			console.log('Response:', data);
			onResponseReceived(data.response);
			return data.response;
		} catch (error) {
			console.error('Error:', error);
			throw error;
		} finally {
			onLoading(false);
		}
	}

	return(
          <div className="h-[46vh] bg-[white] p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-[#2b2b2b]">Assistant</h2>
            <textarea 
              className="w-full h-[60%] p-3 border rounded-md text-[#2b2b2b] resize-none"
              placeholder="Enter your query here..."
			  value={query}
        	  onChange={(e) => setQuery(e.target.value)}
            />
			<div className="flex justify-between">
				<button 
				onClick={askVetAI}
				className="mt-3 px-4 py-2 bg-[#5474AB] text-white rounded hover:bg-[rgb(84, 116, 171)]">
					Ask VetAI
				</button>
				<div className="mt-2 text-sm text-gray-600">
					Chracter Count: {charCount}
				</div>
			</div>
          </div>
	)
}