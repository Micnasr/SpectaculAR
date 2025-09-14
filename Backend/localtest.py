import requests
import time
url = "http://localhost:8080/song"
params = {"prompt": "Summer"}

response = requests.get(url,params=params)
print(response.text)
# url = "http://localhost:8080/mp3"
# response = requests.get(url,params=params)
# print(response)
