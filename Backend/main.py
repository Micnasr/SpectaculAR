
from google import genai
from google.genai import types
from GeminiApiKey import GeminiApiKey
from pydantic import BaseModel
import glob
import json
import yaml
import asyncio
import time

with open("prompts.yaml", "r") as file:
    prompts = yaml.safe_load(file)
async def getTranscript(file_path):
    try:
        client = genai.Client(api_key=GeminiApiKey())
        grounding_tool = types.Tool(
            google_search=types.GoogleSearch()
        )
        f = client.files.upload(file=file_path)
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=[f,f"SongName:{file_path}"],
            config=types.GenerateContentConfig(
                temperature=0,
                system_instruction="""give me a transcript of the song alongside
                    with the time as to when the line was said. Use the grounding tool 
                    to get the transcript if possible and then do the time mapping""",
                tools=[grounding_tool]),
                
        )
        client.files.delete(name=f.name) 
        return response.text
    except genai.errors.ServorError:
        print("Server Error")
        time.sleep(1)
        return await getTranscript(file_path)
class Transcript(BaseModel):
    Minute:int
    Second:int
    Line:str
class Image(BaseModel):
    Minute:int
    Second:int
    colour:str
    ImageDescription:str
async def getStructuredOutput(unstructuredResponse):
    try:
        client = genai.Client(api_key=GeminiApiKey())
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=unstructuredResponse,
            config=types.GenerateContentConfig(response_mime_type= 'application/json',
                response_schema= list[Transcript],
                temperature=0,
                system_instruction="""Just structure the response given to you in the formated format""",),)
        return json.loads(response.text)
    except genai.errors.ServorError:
        print("Server Error")
        time.sleep(1)
        return await getStructuredOutput(unstructuredResponse)
async def helperTranscript(file_path):
    response=await getTranscript(file_path)
    return await getStructuredOutput(response)
async def ImageGenerator(file_path):
    try:
        client = genai.Client(api_key=GeminiApiKey())
        f = client.files.upload(file=file_path)
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=[f],
            config=types.GenerateContentConfig(response_mime_type= 'application/json',
                response_schema= list[Image],
                temperature=1.4,
                system_instruction=prompts["ImageGenerator"],),)
        client.files.delete(name=f.name) 
        return json.loads(response.text)
    except genai.errors.ServerError:
        print("Server Error")
        time.sleep(1)
        return await ImageGenerator(file_path)

async def main(file):
    structured_output_coro = helperTranscript(file)
    image_gen_coro = ImageGenerator(file)
    transcript, image_response = await asyncio.gather(
        structured_output_coro, 
        image_gen_coro
    )
    return transcript,image_response

if __name__=="__main__":
    start=time.time()
    files = glob.glob("*.mp3")
    file=files[0]
    x,y=asyncio.run(main(file))
    print(x)
    print(y)
    end=time.time()
    print(f"It took {end-start}")


