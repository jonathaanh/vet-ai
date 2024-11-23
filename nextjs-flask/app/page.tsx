"use client";
import React, { useState } from "react";
import QueryBox from './query'
import FileUpload from './file-upload'
import ResponseArea from './response-area'

export default function Home() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <div className="h-screen overflow-hidden p-[1vh] bg-[#fcfaf5] flex flex-col">
      <h1 className="text-[#2b2b2b] text-2xl mb-2 font-bold h-[5vh]">Vet AI</h1>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <QueryBox onResponseReceived={setResponse} onLoading={setLoading}/>
          <FileUpload/>
        </div>
        <ResponseArea response={response} loading={loading} />
      </div>
    </div>
  )
}
