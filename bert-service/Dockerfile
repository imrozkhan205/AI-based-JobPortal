FROM python:3.10-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the FastEmbed model during build
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')"

# Copy application files
COPY . .

ENV PORT=5001
EXPOSE 5001

CMD ["python", "-m", "gunicorn", "-w", "1", "-b", "0.0.0.0:5001", "app:app", "--timeout", "120"]
