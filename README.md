# SpectaculAR
An AR experience built with Snap Spectacles that uses generative AI to transform any song into an immersive 3D performance you can see and feel.

<img src="https://github.com/user-attachments/assets/a10c4090-bfff-478c-9519-a5f2948d8d25" width="640" height="360" />

## Inspiration
We were inspired by synesthesia and classic music visualizers, and wanted to reimagine them through immersive AR art and generative AI. By combining Snap Spectacles with music-driven visuals, we set out to create a new way for people to see and feel their favorite songs as living, wearable art.

## What it does
The user simply tells the lens which song they want, and the experience begins. Our system fetches the lyrics, generates descriptions of 3D objects to appear at specific moments, and retrieves the audio file. We then use Snap’s 3D object generation AI to bring those objects to life. A beat-sensing algorithm synchronizes pulses, while a color-mapping algorithm assigns dynamic visuals to the music. All of these elements: lyrics, beats, colors, objects, and audio come together in one seamless AR performance.

## How we built it
We combined TypeScript and JavaScript in Lens Studio with a Quart backend powered by the Gemini API. The backend handles lyric extraction, audio processing, and generative prompts for 3D objects, while Lens Studio renders them in real time. Our workflow integrates audio analysis, AI generation, and Snap’s 3D object engine into an interactive AR pipeline.

<img src="https://github.com/user-attachments/assets/d2bd9c28-7431-40b2-9a02-c994018bfafc" width="800" height="450" />

## Challenges we ran into
We had to navigate sparse documentation in brand-new software with few external resources. Another challenge was reducing inference time for smooth playback while also synchronizing lyrics, beats, colors, and objects into one immersive experience.

## Accomplishments that we're proud of
We successfully built a first-of-its-kind AR music visualizer and optimized its runtime to make it truly interactive. We’re proud of creating a technically complex experience that blends music, AR, and generative AI in a way that hasn’t been done before by transforming music from something you hear into something you can step inside of.

## Pictures
<img src="https://github.com/user-attachments/assets/04c51a1e-37e0-4a69-9d4d-c6feea9669bf" width="640" />
<img src="https://github.com/user-attachments/assets/5b680154-703f-480a-b824-3ae1f970ac00" width="640" />
<img src="https://github.com/user-attachments/assets/8ec44d14-77ea-40a2-b356-827c4303011d" width="640" />
<img src="https://github.com/user-attachments/assets/fdd9edc8-4b11-4bff-8f56-6091d566437d" width="640" />
<img src="https://github.com/user-attachments/assets/908f1295-3027-460d-81e2-86a19a025cc2" width="640" />
