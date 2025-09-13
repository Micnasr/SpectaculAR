import subprocess
import sys

url = "https://www.youtube.com/watch?v=YQHsXMglC9A&list=RDYQHsXMglC9A&start_radio=1"

# Extract audio as MP3
result=subprocess.run([sys.executable, "-m", "yt_dlp","-x","--audio-format", "mp3","--no-playlist","-o", r"%(title)s.%(ext)s",url])
print(result)

