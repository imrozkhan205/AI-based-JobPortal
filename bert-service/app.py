# Python BERT / FastEmbed Microservice (app.py)
# Lightweight ONNX Runtime (< 100MB RAM, optimized for low-memory cloud hosts)

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from fastembed import TextEmbedding
from sklearn.metrics.pairwise import cosine_similarity
import PyPDF2
import docx
from io import BytesIO
import numpy as np

app = Flask(__name__)
CORS(app)

# Initialize lightweight embedding model (uses ONNX, < 100MB RAM)
print("Loading FastEmbed model (sentence-transformers/all-MiniLM-L6-v2)...")
model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
print("FastEmbed model loaded successfully!")

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_bytes):
        try:
            pdf_file = BytesIO(file_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += (page.extract_text() or "") + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting PDF: {str(e)}")
    
    @staticmethod
    def extract_text_from_docx(file_bytes):
        try:
            doc_file = BytesIO(file_bytes)
            doc = docx.Document(doc_file)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting DOCX: {str(e)}")
    
    @staticmethod
    def extract_text(file_bytes, filename):
        lower_name = (filename or "").lower()
        if lower_name.endswith('.pdf'):
            return ResumeParser.extract_text_from_pdf(file_bytes)
        elif lower_name.endswith('.docx') or lower_name.endswith('.doc'):
            return ResumeParser.extract_text_from_docx(file_bytes)
        else:
            raise Exception(f"Unsupported file format: {filename}. Please upload a .pdf or .docx file")

def calculate_similarity(text1, text2):
    """Calculate semantic similarity between two texts using FastEmbed"""
    embeddings = list(model.embed([text1, text2]))
    similarity = cosine_similarity(
        embeddings[0].reshape(1, -1),
        embeddings[1].reshape(1, -1)
    )
    return float(similarity[0][0]) * 100

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': 'all-MiniLM-L6-v2',
        'engine': 'fastembed-onnx'
    }), 200

@app.route('/extract-resume', methods=['POST'])
def extract_resume():
    """Extract text from resume file"""
    try:
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400
        
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file bytes
        file_bytes = file.read()
        
        # Extract text
        resume_text = ResumeParser.extract_text(file_bytes, file.filename)
        
        if not resume_text or len(resume_text) < 50:
            return jsonify({'error': 'Resume appears to be empty or too short'}), 400
        
        return jsonify({
            'success': True,
            'resumeText': resume_text,
            'length': len(resume_text)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/match-jobs', methods=['POST'])
def match_jobs():
    """
    Match resume text with job descriptions using FastEmbed
    
    Expected JSON body:
    {
        "resumeText": "...",
        "jobs": [
            {
                "id": 1,
                "title": "...",
                "description": "...",
                "requirements": "...",
                ...
            }
        ]
    }
    """
    try:
        data = request.json
        
        if not data or 'resumeText' not in data or 'jobs' not in data:
            return jsonify({'error': 'Missing resumeText or jobs in request'}), 400
        
        resume_text = data['resumeText']
        jobs = data['jobs']
        
        if not resume_text:
            return jsonify({'error': 'Resume text is empty'}), 400
        
        if not jobs or len(jobs) == 0:
            return jsonify({'error': 'No jobs provided'}), 400
        
        # Get resume embedding once
        resume_embedding = np.array(list(model.embed([resume_text]))[0])
        
        # Prepare job texts and get embeddings in batch
        job_texts = []
        for job in jobs:
            job_text = f"{job.get('title', '')} {job.get('description', '')}"
            if job.get('requirements'):
                job_text += f" {job['requirements']}"
            job_texts.append(job_text)
        
        # Batch encode all job descriptions
        job_embeddings = np.array(list(model.embed(job_texts)))
        
        # Calculate similarities
        similarities = cosine_similarity(
            resume_embedding.reshape(1, -1),
            job_embeddings
        )[0]
        
        # Add match scores to jobs
        matched_jobs = []
        for i, job in enumerate(jobs):
            job_with_score = {**job, 'matchScore': float(similarities[i]) * 100}
            matched_jobs.append(job_with_score)
        
        # Filter jobs with match score >= threshold
        MIN_MATCH_THRESHOLD = 40.0
        high_match_jobs = [job for job in matched_jobs if job['matchScore'] >= MIN_MATCH_THRESHOLD]
        
        # Sort by match score (highest first)
        high_match_jobs.sort(key=lambda x: x['matchScore'], reverse=True)
        
        return jsonify({
            'success': True,
            'matchedJobs': high_match_jobs,
            'totalMatched': len(high_match_jobs),
            'totalAnalyzed': len(matched_jobs),
            'threshold': MIN_MATCH_THRESHOLD
        }), 200
        
    except Exception as e:
        print(f"Error in match_jobs: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/calculate-similarity', methods=['POST'])
def calculate_text_similarity():
    """
    Calculate similarity between two texts
    """
    try:
        data = request.json
        
        if not data or 'text1' not in data or 'text2' not in data:
            return jsonify({'error': 'Missing text1 or text2'}), 400
        
        text1 = data['text1']
        text2 = data['text2']
        
        similarity_score = calculate_similarity(text1, text2)
        
        return jsonify({
            'success': True,
            'similarity': similarity_score
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    default_port = 7860 if os.environ.get("SPACE_ID") else 5001
    port = int(os.environ.get("PORT", default_port))
    debug = os.environ.get("FLASK_ENV") == "development"
    print("\n" + "="*50)
    print(f"🤖 FastEmbed Microservice Starting on port {port}...")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=port, debug=debug)
