import requests
import time
url = "https://hackthenorth-api-942206148236.us-central1.run.app/song"
params = {"prompt": "Yes"}

response = requests.get(url,params=params)
print(response.text)
url = "https://hackthenorth-api-942206148236.us-central1.run.app/mp3"
response = requests.get(url,params=params)
print(response)
