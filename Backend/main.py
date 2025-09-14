
from google import genai
from google.genai import types
from pydantic import BaseModel
import glob
import json
import yaml
import asyncio
import time
from ytapi import getYTqueries, getmp3,getYTurl
import os
from quart import Quart, request, jsonify, send_file
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
app = Quart(__name__)
class Transcript(BaseModel):
    minute:int
    second:int
    line:str
class Object(BaseModel):
    minute:int
    second:int
    objectDescription:str
class Number(BaseModel):
    index:int
class URL(BaseModel):
    url:str
async def chooseMP3file(prompt):
    try:
        files = glob.glob("*.mp3")
        print(files,prompt)
        response = await client.aio.models.generate_content(
            model='gemini-1.5-flash-8b',
            contents=f"List of songs {files} and inividual song {prompt}",
            config=types.GenerateContentConfig(
                temperature=0,
                system_instruction="""You are given a list of songs and an indvidual song. There exists one that matches best with the individual song. Return
                the index of that one in the list remember the first index is 0""",
                response_mime_type= 'application/json',
                response_schema= Number)      
        )
        index=json.loads(response.text)["index"]
        print(index)
        return files[index]
    except genai.errors.ServerError:
        print("Server Error")
        await asyncio.sleep(1)
        return await chooseMP3file(prompt)


async def processPrompt(prompt):
    try:
        file = await chooseMP3file(prompt)
        print(file)
        f = client.files.upload(file=file)
        x,y=await helper(f)
        client.files.delete(name=f.name) 
        dictionary={"transcript":x,"images":y}
        return dictionary
    except genai.errors.ServerError:
        print("Server Error")
        await asyncio.sleep(1)
        return await processPrompt(prompt)

with open("prompts.yaml", "r",encoding="utf-8") as file:
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
        print(response.text)
        return json.loads(response.text)

    except genai.errors.ServerError:
        print("Server Error")
        await asyncio.sleep(1)
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
        await asyncio.sleep(1)
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
async def endpoint():

    prompt = request.args.get("prompt")
    if not prompt:
        return jsonify({"error": "Missing 'prompt' query parameter"}), 400
    
    try:
        result = await processPrompt(prompt)
        return jsonify(result)
    except genai.errors.ServerError:
        print("Server Error, retrying...")
        await asyncio.sleep(1)
        result =await  processPrompt(prompt)
        return jsonify(result)
@app.route("/mp3", methods=["GET"])
async def getmp3file():
    prompt = request.args.get("prompt")
    if not prompt:
        return jsonify({"error": "Missing 'prompt' query parameter"}), 400
    file =await chooseMP3file(prompt)
    return await send_file(file, mimetype="audio/mpeg", as_attachment=True)

if __name__=="__main__":  # default to 8080 if PORT not set
    asyncio.run(app.run_task(host="0.0.0.0", port=8080))


if __name__=="__mai__":
    start=time.time()
    x=asyncio.run(processPrompt("Passionfruit"))
    print(x)
    end=time.time()
    print(f"It took {end-start}")
