from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import os
import redis
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Connect to Redis
try:
    r = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, decode_responses=True)
    r.ping()
    redis_available = True
    print("Redis connected!")
except:
    redis_available = False
    print("Redis not available, running without long-term memory")

class ChatRequest(BaseModel):
    message: str
    history: list = []  # conversation history from frontend

@app.get("/")
def root():
    return {"status": "Backend is running!"}

@app.post("/chat")
def chat(request: ChatRequest):
    # Load long-term memory from Redis
    long_term = ""
    if redis_available:
        stored = r.get("user_memory")
        if stored:
            long_term = f"Here is some information about the user: {stored}\n\n"

    # Build system message
    system_message = f"""You are a helpful AI assistant with memory.
{long_term}
If the user tells you personal info (name, preferences, etc.), remember it.
If you learn something important about the user, say 'REMEMBER: <fact>' on a new line."""

    # Build messages with full history
    messages = [{"role": "system", "content": system_message}]
    messages += request.history
    messages.append({"role": "user", "content": request.message})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )

    reply = response.choices[0].message.content

    # Extract and store any REMEMBER facts into Redis
    if redis_available and "REMEMBER:" in reply:
        lines = reply.split("\n")
        for line in lines:
            if line.startswith("REMEMBER:"):
                fact = line.replace("REMEMBER:", "").strip()
                existing = r.get("user_memory") or ""
                updated = existing + " " + fact if existing else fact
                r.set("user_memory", updated)

    return {"reply": reply}

@app.get("/memory")
def get_memory():
    if not redis_available:
        return {"memory": "Redis not connected"}
    return {"memory": r.get("user_memory") or "No memory yet"}

@app.delete("/memory")
def clear_memory():
    if redis_available:
        r.delete("user_memory")
    return {"status": "Memory cleared"}