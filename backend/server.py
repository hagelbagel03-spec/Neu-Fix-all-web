from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, Cookie
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import shutil
import jwt
import bcrypt
from jose import JWTError, jwt as jose_jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
admin_router = APIRouter(prefix="/api/admin")

security = HTTPBearer()

# Helper functions
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jose_jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jose_jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = {"username": username}
    except JWTError:
        raise credentials_exception
    
    admin = await db.admins.find_one({"username": token_data["username"]})
    if admin is None:
        raise credentials_exception
    return admin

# Define Models
class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    position: str
    message: str
    cv_filename: Optional[str] = None
    status: str = Field(default="pending")  # pending, reviewed, accepted, rejected
    admin_response: Optional[str] = None
    admin_email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class ApplicationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    position: str
    message: str

class ApplicationResponse(BaseModel):
    application_id: str
    status: str
    admin_response: str
    admin_email: str

class Feedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    subject: str
    message: str
    rating: int = Field(ge=1, le=5)
    status: str = Field(default="new")  # new, reviewed
    admin_response: Optional[str] = None
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
    published: bool = Field(default=True)

class NewsItemCreate(BaseModel):
    title: str
    content: str
    priority: str = Field(default="normal")
    published: bool = Field(default=True)

class NewsItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    published: Optional[bool] = None

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HomepageContent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hero_title: str = Field(default="Stadtwache")
    hero_subtitle: str = Field(default="Sicherheit und Schutz für unsere Gemeinschaft. Moderne Polizeiarbeit im Dienste der Bürger.")
    hero_image: Optional[str] = None
    emergency_number: str = Field(default="110")
    phone_number: str = Field(default="+49 123 456-789")
    email: str = Field(default="info@stadtwache.de")
    address: str = Field(default="Stadtwache Hauptrevier\nHauptstraße 123\n12345 Musterstadt")
    opening_hours: str = Field(default="Mo-Fr: 8:00-20:00\nSa: 9:00-16:00\nSo: 10:00-14:00")
    show_latest_news: bool = Field(default=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HomepageUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_image: Optional[str] = None
    emergency_number: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    show_latest_news: Optional[bool] = None

# Public Routes
@api_router.get("/")
async def root():
    return {"message": "Stadtwache API"}

# Homepage content
@api_router.get("/homepage")
async def get_homepage_content():
    content = await db.homepage.find_one()
    if not content:
        # Create default content
        default_content = HomepageContent()
        content_dict = prepare_for_mongo(default_content.dict())
        await db.homepage.insert_one(content_dict)
        return default_content
    return HomepageContent(**content)

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

# Feedback routes
@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(feedback: FeedbackCreate):
    feedback_obj = Feedback(**feedback.dict())
    feedback_dict = prepare_for_mongo(feedback_obj.dict())
    await db.feedback.insert_one(feedback_dict)
    return feedback_obj

# News routes - Public
@api_router.get("/news", response_model=List[NewsItem])
async def get_news():
    news_list = await db.news.find({"published": True}).sort("date", -1).to_list(100)
    return [NewsItem(**news) for news in news_list]

@api_router.get("/news/latest")
async def get_latest_news():
    latest_news = await db.news.find_one({"published": True}, sort=[("date", -1)])
    if latest_news:
        return NewsItem(**latest_news)
    return None

# Admin Authentication
@admin_router.post("/login")
async def admin_login(admin_data: AdminLogin):
    admin = await db.admins.find_one({"username": admin_data.username})
    if not admin or not verify_password(admin_data.password, admin["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@admin_router.get("/me")
async def get_admin_me(current_admin = Depends(get_current_admin)):
    return {"username": current_admin["username"], "email": current_admin["email"]}

# Admin News Management
@admin_router.get("/news", response_model=List[NewsItem])
async def admin_get_all_news(current_admin = Depends(get_current_admin)):
    news_list = await db.news.find().sort("date", -1).to_list(100)
    return [NewsItem(**news) for news in news_list]

@admin_router.post("/news", response_model=NewsItem)
async def admin_create_news(news: NewsItemCreate, current_admin = Depends(get_current_admin)):
    news_obj = NewsItem(**news.dict())
    news_dict = prepare_for_mongo(news_obj.dict())
    await db.news.insert_one(news_dict)
    return news_obj

@admin_router.put("/news/{news_id}", response_model=NewsItem)
async def admin_update_news(news_id: str, news_update: NewsItemUpdate, current_admin = Depends(get_current_admin)):
    update_data = {k: v for k, v in news_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.news.update_one({"id": news_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    
    updated_news = await db.news.find_one({"id": news_id})
    return NewsItem(**updated_news)

@admin_router.delete("/news/{news_id}")
async def admin_delete_news(news_id: str, current_admin = Depends(get_current_admin)):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted successfully"}

# Admin Applications Management
@admin_router.get("/applications", response_model=List[Application])
async def admin_get_applications(current_admin = Depends(get_current_admin)):
    applications = await db.applications.find().sort("created_at", -1).to_list(1000)
    return [Application(**app) for app in applications]

@admin_router.put("/applications/{application_id}/respond")
async def admin_respond_to_application(
    application_id: str, 
    response: ApplicationResponse, 
    current_admin = Depends(get_current_admin)
):
    update_data = {
        "status": response.status,
        "admin_response": response.admin_response,
        "admin_email": response.admin_email,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.applications.update_one({"id": application_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    
    updated_app = await db.applications.find_one({"id": application_id})
    return Application(**updated_app)

# Admin Feedback Management
@admin_router.get("/feedback", response_model=List[Feedback])
async def admin_get_feedback(current_admin = Depends(get_current_admin)):
    feedback_list = await db.feedback.find().sort("created_at", -1).to_list(1000)
    return [Feedback(**fb) for fb in feedback_list]

@admin_router.put("/feedback/{feedback_id}/respond")
async def admin_respond_to_feedback(
    feedback_id: str,
    admin_response: str = Form(...),
    current_admin = Depends(get_current_admin)
):
    update_data = {
        "status": "reviewed",
        "admin_response": admin_response,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.feedback.update_one({"id": feedback_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    updated_feedback = await db.feedback.find_one({"id": feedback_id})
    return Feedback(**updated_feedback)

# Admin Homepage Management
@admin_router.get("/homepage")
async def admin_get_homepage(current_admin = Depends(get_current_admin)):
    content = await db.homepage.find_one()
    if not content:
        default_content = HomepageContent()
        content_dict = prepare_for_mongo(default_content.dict())
        await db.homepage.insert_one(content_dict)
        return default_content
    return HomepageContent(**content)

@admin_router.put("/homepage")
async def admin_update_homepage(
    homepage_update: HomepageUpdate = None,
    hero_title: str = Form(None),
    hero_subtitle: str = Form(None),
    emergency_number: str = Form(None),
    phone_number: str = Form(None),
    email: str = Form(None),
    address: str = Form(None),
    opening_hours: str = Form(None),
    show_latest_news: bool = Form(None),
    hero_image: UploadFile = File(None),
    current_admin = Depends(get_current_admin)
):
    update_data = {}
    
    # Handle form data
    if hero_title: update_data["hero_title"] = hero_title
    if hero_subtitle: update_data["hero_subtitle"] = hero_subtitle
    if emergency_number: update_data["emergency_number"] = emergency_number
    if phone_number: update_data["phone_number"] = phone_number
    if email: update_data["email"] = email
    if address: update_data["address"] = address
    if opening_hours: update_data["opening_hours"] = opening_hours
    if show_latest_news is not None: update_data["show_latest_news"] = show_latest_news
    
    # Handle image upload
    if hero_image and hero_image.filename:
        file_extension = hero_image.filename.split('.')[-1].lower()
        if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
            raise HTTPException(status_code=400, detail="Nur JPG, PNG und WEBP Bilder sind erlaubt")
        
        image_filename = f"hero_{uuid.uuid4()}.{file_extension}"
        image_path = UPLOAD_DIR / image_filename
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(hero_image.file, buffer)
        
        update_data["hero_image"] = image_filename
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Check if homepage exists
    existing = await db.homepage.find_one()
    if existing:
        await db.homepage.update_one({}, {"$set": update_data})
    else:
        default_content = HomepageContent(**update_data)
        content_dict = prepare_for_mongo(default_content.dict())
        await db.homepage.insert_one(content_dict)
    
    updated_content = await db.homepage.find_one()
    return HomepageContent(**updated_content)

# Serve uploaded files
@api_router.get("/uploads/{filename}")
async def serve_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

# Include routers in the main app
app.include_router(api_router)
app.include_router(admin_router)

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

@app.on_event("startup")
async def startup_event():
    # Create default admin user if not exists
    admin_exists = await db.admins.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = AdminUser(
            username="admin",
            email="admin@stadtwache.de",
            hashed_password=get_password_hash("admin123")
        )
        admin_dict = prepare_for_mongo(admin_user.dict())
        await db.admins.insert_one(admin_dict)
        logger.info("Default admin user created: admin/admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()