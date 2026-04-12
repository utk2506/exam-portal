FROM python:3.13-slim

WORKDIR /app

COPY services/ai-proctor/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ai-proctor/app.py ./app.py

EXPOSE 8090

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8090"]
