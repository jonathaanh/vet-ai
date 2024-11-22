"use client";
import React, { useState } from "react";
import Image from 'next/image'
import Link from 'next/link'
import QueryBox from './query'
import FileUpload from './file-upload'
import ResponseArea from './response-area'

export default function Home() {
  const [response, setResponse] = useState("");
  return (
    <div className="h-screen overflow-hidden p-[1vh] bg-[#fcfaf5] flex flex-col">
      <h1 className="text-[#2b2b2b] text-2xl mb-2 font-bold h-[5vh]">Vet AI</h1>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <QueryBox onResponseReceived={setResponse}/>
          <FileUpload/>
        </div>
        <ResponseArea response={response}/>
      </div>
    </div>
  )
}
