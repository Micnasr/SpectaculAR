import requests
import os
import subprocess
import sys
def getmp3(url):
    x=subprocess.run([sys.executable, "-m", "yt_dlp","-x","--audio-format", "mp3","--no-playlist","-o",r"%(title)s.%(ext)s",url])
    print(x)

def getYTqueries(searchQuery:str)->list[dict[str:str]]:
    """Allows you to run youtube search queries will
    return the author title and url
    """
    API_KEY = os.getenv("GEMINI_API_KEY") # replace with your key
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": searchQuery,
        "type": "video",
        "maxResults": 5,
        "key": API_KEY
    }

    resp = requests.get(url, params=params)
    lst=[]
    data = resp.json()
    for item in data.get("items", []):
        video_id = item["id"]["videoId"]
        title = item["snippet"]["title"]
        author = item["snippet"]["channelTitle"]
        lst.append({"Title":title,"Author":author,"url":f"https://www.youtube.com/watch?v={video_id}"})
    return lst
def getYTurl(searchQuery):
    """Allows you to run youtube search queries will
    return the author title and url
    """
    API_KEY = os.getenv("GEMINI_API_KEY") # replace with your key
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": searchQuery,
        "type": "video",
        "maxResults": 1,
        "key": API_KEY
    }

    resp = requests.get(url, params=params)
    print(resp)
    lst=[]
    data = resp.json()
    for item in data.get("items", []):
        video_id = item["id"]["videoId"]
        return f"https://www.youtube.com/watch?v={video_id}"

if __name__=="__main__":
    x=getYTurl("Don't Stop Believing")
    getmp3(x)
