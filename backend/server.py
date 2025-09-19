from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

# Define Models
class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    position: str
    message: str
    cv_filename: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ApplicationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    position: str
    message: str

class Feedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    subject: str
    message: str
    rating: int = Field(ge=1, le=5)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    rating: int = Field(ge=1, le=5)

class NewsItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    priority: str = Field(default="normal")  # normal, high, urgent

class NewsItemCreate(BaseModel):
    title: str
    content: str
    priority: str = Field(default="normal")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Stadtwache API"}

# Application routes
@api_router.post("/applications", response_model=Application)
async def create_application(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    position: str = Form(...),
    message: str = Form(...),
    cv_file: UploadFile = File(None)
):
    try:
        cv_filename = None
        if cv_file and cv_file.filename:
            # Save uploaded file
            file_extension = cv_file.filename.split('.')[-1].lower()
            if file_extension not in ['pdf', 'doc', 'docx']:
                raise HTTPException(status_code=400, detail="Nur PDF, DOC und DOCX Dateien sind erlaubt")
            
            cv_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = UPLOAD_DIR / cv_filename
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(cv_file.file, buffer)
        
        application_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "position": position,
            "message": message,
            "cv_filename": cv_filename
        }
        
        application = Application(**application_data)
        application_dict = prepare_for_mongo(application.dict())
        await db.applications.insert_one(application_dict)
        
        return application
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/applications", response_model=List[Application])
async def get_applications():
    applications = await db.applications.find().to_list(1000)
    return [Application(**app) for app in applications]

# Feedback routes
@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(feedback: FeedbackCreate):
    feedback_obj = Feedback(**feedback.dict())
    feedback_dict = prepare_for_mongo(feedback_obj.dict())
    await db.feedback.insert_one(feedback_dict)
    return feedback_obj

@api_router.get("/feedback", response_model=List[Feedback])
async def get_feedback():
    feedback_list = await db.feedback.find().to_list(1000)
    return [Feedback(**fb) for fb in feedback_list]

# News routes
@api_router.post("/news", response_model=NewsItem)
async def create_news(news: NewsItemCreate):
    news_obj = NewsItem(**news.dict())
    news_dict = prepare_for_mongo(news_obj.dict())
    await db.news.insert_one(news_dict)
    return news_obj

@api_router.get("/news", response_model=List[NewsItem])
async def get_news():
    news_list = await db.news.find().sort("date", -1).to_list(100)
    return [NewsItem(**news) for news in news_list]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()