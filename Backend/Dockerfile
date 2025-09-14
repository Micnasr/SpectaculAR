FROM python:3.11-slim

WORKDIR /app

# Upgrade pip, setuptools, wheel
RUN pip install --upgrade pip setuptools wheel

# Install system dependencies (ffmpeg and other build tools)
RUN apt-get update && apt-get install -y ffmpeg

COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port for Cloud Run
EXPOSE 8080

ENV PORT=8080

CMD ["hypercorn", "main:app", "--bind", "0.0.0.0:8080"]