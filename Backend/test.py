import requests
import time
url = "http://localhost:5000/song"
params = {"prompt": "I will survive"}

response = requests.get(url, params=params)
print("Sent")
url = "http://localhost:5000/mp3"
response = requests.get(url)
print(response)