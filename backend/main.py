from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os
import json

load_dotenv()

app = FastAPI()
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class MeetingRequest(BaseModel):
    transcript: str

@app.get("/")
def home():
    return {"message": "Meeting Follow-Up AI backend is running"}

@app.post("/analyze-meeting")
def analyze_meeting(data: MeetingRequest):
    prompt = f"""
You are an assistant that analyzes meeting transcripts.

Read the transcript and return only valid JSON in this exact format:
{{
  "meeting_title": "Short meeting title",
  "summary": "A short summary",
  "decisions": ["decision 1", "decision 2"],
  "action_items": [
    {{
      "owner": "person name",
      "task": "task description",
      "deadline": "deadline if mentioned, otherwise Not specified",
      "priority": "High | Medium | Low"
    }}
  ],
  "risks": ["risk 1", "risk 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "follow_up_email": "A professional follow-up email draft"
}}

For every action item, ALWAYS include a "priority" field.
Priority must be exactly one of: "High", "Medium", or "Low".
Determine priority from urgency and deadline mentioned in the transcript.
If urgency is immediate or deadline is near, use "High".
If urgency is moderate or deadline is within a reasonable near-term window, use "Medium".
If no urgency/deadline is specified or urgency is low, use "Low".

ALWAYS include a "risks" array of strings.
"risks" should identify potential problems, blockers, dependencies, or unclear responsibilities mentioned in the meeting.

ALWAYS include a "recommendations" array of strings.
"recommendations" should provide practical suggestions to improve the plan, reduce risk, and prevent issues.

Return only valid JSON.

Transcript:
{data.transcript}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "You extract structured meeting follow-up details."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    content = response.choices[0].message.content
    return json.loads(content)