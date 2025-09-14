Run main.py to get both the transcript and the scenes
In order to try a different song run youtube.py with the correct link and delete the old m3p file
Completed in 25 seconds
Runs to local host Port:5000
Example: resp = requests.get("http://127.0.0.1:5000/song", params={"prompt": "Play me Drake-Lose You"})

resp is a dict of two keys transcript and images. transcript maps to a list of dicts with keys: minute, second and line.

Images map to a list of dicts with keys: minute second,color(Maps to a hexadecimal format starting with #), and objectDescription which
maps to the text representing the object to be generated

minute and second represent the starting point of when the image should be displayed. They will end when a new image comes in or the song is over

