FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose ports for FastAPI (8000) and Streamlit (8501)
EXPOSE 8000
EXPOSE 8501

CMD ["streamlit", "run", "dashboard/app.py", "--server.port=8501", "--server.address=0.0.0.0"]
