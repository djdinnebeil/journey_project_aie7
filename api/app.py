import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
from openai._exceptions import AuthenticationError
import uuid
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
import numpy as np
from aimakerspace.openai_utils.chatmodel import ChatOpenAI
from aimakerspace.openai_utils.embedding import EmbeddingModel

from typing import Optional

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication
    document_id: Optional[str] = None  # New: document/session ID for RAG

# In-memory store for vector DBs, keyed by document/session ID
vector_db_store = {}

# Define the main chat endpoint that handles POST requests
@app.post("/api/upload_pdf")
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form(...)):
    try:
        # Save uploaded PDF to a temp file
        temp_path = f"/tmp/{uuid.uuid4()}.pdf"
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        # Load and split PDF
        loader = PDFLoader(temp_path)
        documents = loader.load_documents()
        splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.split_texts(documents)
        # Build vector DB with user-provided api_key
        vector_db = await VectorDatabase(embedding_model=EmbeddingModel(api_key=api_key)).abuild_from_list(chunks)
        # Store in memory with a new document_id
        document_id = str(uuid.uuid4())
        vector_db_store[document_id] = {
            "vector_db": vector_db,
            "chunks": chunks
        }
        # Remove temp file
        os.remove(temp_path)
        return {"status": "ok", "document_id": document_id}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Use ChatOpenAI with per-request api_key
        chat_client = ChatOpenAI(model_name=request.model, api_key=request.api_key)
        chat_client.client = OpenAI(api_key=request.api_key)
        context_chunks = []
        # If document_id is provided, use RAG
        if request.document_id and request.document_id in vector_db_store:
            vector_db = vector_db_store[request.document_id]["vector_db"]
            chunks = vector_db_store[request.document_id]["chunks"]
            # Retrieve top-3 relevant chunks
            results = vector_db.search_by_text(request.user_message, k=3, return_as_text=True)
            context_chunks = results
        # Compose messages for LLM
        messages = []
        if context_chunks:
            context_text = "\n---\n".join(context_chunks)
            messages.append({"role": "system", "content": f"Relevant PDF context:\n{context_text}"})
        messages.append({"role": "developer", "content": request.developer_message})
        messages.append({"role": "user", "content": request.user_message})
        async def generate():
            try:
                stream = chat_client.client.chat.completions.create(
                    model=request.model,
                    messages=messages,
                    stream=True
                )
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        yield chunk.choices[0].delta.content
            except AuthenticationError:
                yield "\n[ERROR] Invalid OpenAI API key. Please check your credentials.\n"
            except Exception as e:
                yield f"\n[ERROR] {str(e)}\n"
        return StreamingResponse(generate(), media_type="text/markdown")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
