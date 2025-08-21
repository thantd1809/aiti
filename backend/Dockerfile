FROM python:3.10

WORKDIR /app

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y
RUN apt-get install -y libgl1-mesa-glx
# Install LibreOffice for document conversion
RUN apt-get update && apt-get install -y libreoffice

RUN apt-get update && apt-get install -y poppler-utils

RUN apt-get update && apt-get install -y tesseract-ocr

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY ./app .
COPY migrations ./migrations
COPY .env ./.env

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]