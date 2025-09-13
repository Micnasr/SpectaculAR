
from google import genai
from google.genai import types
from GeminiApiKey import GeminiApiKey
from pydantic import BaseModel
import glob
import json
import yaml
import asyncio
import time
from ytapi import getYTqueries, getmp3,getYTurl
import os
from flask import Flask, request, jsonify
client = genai.Client(api_key=GeminiApiKey())
app = Flask(__name__)
class Transcript(BaseModel):
    minute:int
    second:int
    line:str
class Object(BaseModel):
    minute:int
    second:int
    colour:str
    objectDescription:str
class URL(BaseModel):
    url:str
def processPrompt(prompt):
    try:
        url=getYTurl(prompt)
        getmp3(url)
        file = glob.glob("*.mp3")[0]
        f = client.files.upload(file=file)
        x,y=asyncio.run(helper(f))
        client.files.delete(name=f.name) 
        os.remove(file)
        dictionary={"transcript":x,"images":y}
        return dictionary
    except genai.errors.ServerError:
        print("Server Error")
        time.sleep(1)
        return processPrompt(prompt)

with open("prompts.yaml", "r") as file:
    prompts = yaml.safe_load(file)
async def getTranscript(f):
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.0-flash',
            contents=[f],
            config=types.GenerateContentConfig(
                temperature=0,
                system_instruction="""give me a transcript of the song alongside
                    with the time as to when the line was said. Use the grounding tool 
                    to get the transcript if possible and then do the time mapping.
                    You **MUST** continue until the end of the song""",
                response_mime_type= 'application/json',
                response_schema= list[Transcript],)
                
                
        )
        return json.loads(response.text)

    except genai.errors.ServerError:
        print("Server Error")
        time.sleep(1)
        return await getTranscript(f)
async def ImageGenerator(f):
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.0-flash',
            contents=[f],
            config=types.GenerateContentConfig(response_mime_type= 'application/json',
                response_schema= list[Object],
                temperature=1.4,
                system_instruction=prompts["ImageGenerator"],),)
        return json.loads(response.text)
    except genai.errors.ServerError:
        print("Server Error")
        time.sleep(1)
        return await ImageGenerator(f)

async def helper(f):
    structured_output_coro = getTranscript(f)
    image_gen_coro = ImageGenerator(f)
    transcript, image_response = await asyncio.gather(
        structured_output_coro, 
        image_gen_coro
    )
    return transcript,image_response

@app.route("/song", methods=["GET"])
def endpoint():
    prompt = request.args.get("prompt")
    if not prompt:
        return jsonify({"error": "Missing 'prompt' query parameter"}), 400
    
    try:
        result = processPrompt(prompt)
        return jsonify(result)
    except genai.errors.ServerError:
        print("Server Error, retrying...")
        time.sleep(1)
        result = processPrompt(prompt)
        return jsonify(result)

if __name__=="__main__":
    app.run(debug=True)


if __name__=="__mai__":
    start=time.time()
    x=processPrompt("Anxiety Freestyle SleepyHallow")
    print(x)
    end=time.time()
    print(f"It took {end-start}")
