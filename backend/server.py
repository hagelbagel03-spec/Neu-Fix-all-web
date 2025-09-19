from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, Cookie, Query
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
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
    excerpt: Optional[str] = None
    image: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    priority: str = Field(default="normal")  # normal, high, urgent
    published: bool = Field(default=True)

class NewsItemCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    priority: str = Field(default="normal")
    published: bool = Field(default=True)

class NewsItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    priority: Optional[str] = None
    published: Optional[bool] = None

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    icon: str = Field(default="Shield")
    image: Optional[str] = None
    order: int = Field(default=0)
    active: bool = Field(default=True)

class ServiceCreate(BaseModel):
    title: str
    description: str
    icon: str = Field(default="Shield")
    order: int = Field(default=0)
    active: bool = Field(default=True)

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None

class TeamMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    position: str
    description: Optional[str] = None
    image: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    order: int = Field(default=0)
    active: bool = Field(default=True)

class TeamMemberCreate(BaseModel):
    name: str
    position: str
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    order: int = Field(default=0)
    active: bool = Field(default=True)

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None

class Statistic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    value: str
    description: Optional[str] = None
    icon: str = Field(default="TrendingUp")
    color: str = Field(default="blue")
    order: int = Field(default=0)
    active: bool = Field(default=True)

class StatisticCreate(BaseModel):
    title: str
    value: str
    description: Optional[str] = None
    icon: str = Field(default="TrendingUp")
    color: str = Field(default="blue")
    order: int = Field(default=0)
    active: bool = Field(default=True)

class StatisticUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None

class NavigationItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    section: str
    order: int = Field(default=0)
    active: bool = Field(default=True)

class NavigationUpdate(BaseModel):
    items: List[NavigationItem]

class AdminLogin(BaseModel):
    username: str
    password: str

class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # Incident Details
    incident_type: str  # "Diebstahl", "Vandalismus", "Verkehrsunfall", "Andere"
    description: str
    location: str
    incident_date: str
    incident_time: str
    
    # Reporter Information
    reporter_name: str
    reporter_email: EmailStr
    reporter_phone: str
    is_witness: bool = Field(default=False)
    
    # Additional Details
    witnesses_present: bool = Field(default=False)
    witness_details: Optional[str] = None
    evidence_available: bool = Field(default=False)
    evidence_description: Optional[str] = None
    additional_info: Optional[str] = None
    
    # Administrative
    status: str = Field(default="new")  # new, under_review, completed, closed
    priority: str = Field(default="normal")  # low, normal, high, urgent
    assigned_officer: Optional[str] = None
    admin_notes: Optional[str] = None
    admin_response: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class ReportCreate(BaseModel):
    incident_type: str
    description: str
    location: str
    incident_date: str
    incident_time: str
    reporter_name: str
    reporter_email: EmailStr
    reporter_phone: str
    is_witness: bool = Field(default=False)
    witnesses_present: bool = Field(default=False)
    witness_details: Optional[str] = None
    evidence_available: bool = Field(default=False)
    evidence_description: Optional[str] = None
    additional_info: Optional[str] = None

class AboutPage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(default="Über uns")
    subtitle: str = Field(default="Erfahren Sie mehr über die Stadtwache")
    content: str = Field(default="Hier steht der Inhalt über das Unternehmen...")
    mission: Optional[str] = None
    vision: Optional[str] = None
    values: Optional[str] = None
    history: Optional[str] = None
    image: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AboutPageUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[str] = None
    mission: Optional[str] = None
    vision: Optional[str] = None
    values: Optional[str] = None
    history: Optional[str] = None

class ChatWidget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enabled: bool = Field(default=True)
    title: str = Field(default="Hilfe & Support")
    welcome_message: str = Field(default="Hallo! Wie können wir Ihnen helfen?")
    offline_message: str = Field(default="Wir sind derzeit nicht verfügbar. Hinterlassen Sie uns eine Nachricht.")
    position: str = Field(default="bottom-left")  # bottom-left, bottom-right
    color: str = Field(default="blue")
    contact_email: str = Field(default="support@stadtwache.de")
    phone_number: Optional[str] = None
    operating_hours: str = Field(default="Mo-Fr: 8:00-18:00")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatWidgetUpdate(BaseModel):
    enabled: Optional[bool] = None
    title: Optional[str] = None
    welcome_message: Optional[str] = None
    offline_message: Optional[str] = None
    position: Optional[str] = None
    color: Optional[str] = None
    contact_email: Optional[str] = None
    phone_number: Optional[str] = None
    operating_hours: Optional[str] = None

class ReportUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_officer: Optional[str] = None
    admin_notes: Optional[str] = None
    admin_response: Optional[str] = None

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
    show_services: bool = Field(default=True)
    show_team: bool = Field(default=True)
    show_statistics: bool = Field(default=True)
    footer_text: str = Field(default="© 2024 Stadtwache. Alle Rechte vorbehalten.")
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
    show_services: Optional[bool] = None
    show_team: Optional[bool] = None
    show_statistics: Optional[bool] = None
    footer_text: Optional[str] = None

class DatabaseQuery(BaseModel):
    collection: str
    query: Optional[Dict[str, Any]] = {}
    limit: Optional[int] = 100

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

# Services
@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find({"active": True}).sort("order", 1).to_list(100)
    return [Service(**service) for service in services]

# Team
@api_router.get("/team", response_model=List[TeamMember])
async def get_team():
    team = await db.team.find({"active": True}).sort("order", 1).to_list(100)
    return [TeamMember(**member) for member in team]

# Statistics
@api_router.get("/statistics", response_model=List[Statistic])
async def get_statistics():
    stats = await db.statistics.find({"active": True}).sort("order", 1).to_list(100)
    return [Statistic(**stat) for stat in stats]

# Navigation
@api_router.get("/navigation", response_model=List[NavigationItem])
async def get_navigation():
    nav_items = await db.navigation.find({"active": True}).sort("order", 1).to_list(100)
    return [NavigationItem(**item) for item in nav_items]

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

# Report routes - Public
@api_router.post("/reports", response_model=Report)
async def create_report(report: ReportCreate):
    report_obj = Report(**report.dict())
    report_dict = prepare_for_mongo(report_obj.dict())
    await db.reports.insert_one(report_dict)
    return report_obj

@api_router.get("/reports/types")
async def get_report_types():
    return {
        "incident_types": [
            "Diebstahl",
            "Einbruch", 
            "Vandalismus",
            "Verkehrsunfall",
            "Ruhestörung",
            "Betrug",
            "Körperverletzung",
            "Sachbeschädigung",
            "Verdächtige Aktivität",
            "Andere"
        ]
    }

# About Page
@api_router.get("/about")
async def get_about_page():
    about = await db.about.find_one()
    if not about:
        # Create default content
        default_about = AboutPage()
        about_dict = prepare_for_mongo(default_about.dict())
        await db.about.insert_one(about_dict)
        return default_about
    return AboutPage(**about)

# Chat Widget
@api_router.get("/chat-widget")
async def get_chat_widget():
    chat = await db.chat_widget.find_one()
    if not chat:
        # Create default content
        default_chat = ChatWidget()
        chat_dict = prepare_for_mongo(default_chat.dict())
        await db.chat_widget.insert_one(chat_dict)
        return default_chat
    return ChatWidget(**chat)

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

@api_router.get("/news/featured")
async def get_featured_news():
    """Get top 6 news for homepage"""
    featured_news = await db.news.find({"published": True}).sort("date", -1).to_list(6)
    return [NewsItem(**news) for news in featured_news]

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
async def admin_create_news(
    title: str = Form(...),
    content: str = Form(...),
    excerpt: str = Form(None),
    priority: str = Form("normal"),
    published: bool = Form(True),
    news_image: UploadFile = File(None),
    current_admin = Depends(get_current_admin)
):
    try:
        image_filename = None
        if news_image and news_image.filename:
            file_extension = news_image.filename.split('.')[-1].lower()
            if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
                raise HTTPException(status_code=400, detail="Nur JPG, PNG und WEBP Bilder sind erlaubt")
            
            image_filename = f"news_{uuid.uuid4()}.{file_extension}"
            image_path = UPLOAD_DIR / image_filename
            
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(news_image.file, buffer)
        
        news_data = {
            "title": title,
            "content": content,
            "excerpt": excerpt,
            "priority": priority,
            "published": published,
            "image": image_filename
        }
        
        news_obj = NewsItem(**news_data)
        news_dict = prepare_for_mongo(news_obj.dict())
        await db.news.insert_one(news_dict)
        return news_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

# Admin Reports Management
@admin_router.get("/reports", response_model=List[Report])
async def admin_get_reports(current_admin = Depends(get_current_admin)):
    reports = await db.reports.find().sort("created_at", -1).to_list(1000)
    return [Report(**report) for report in reports]

@admin_router.put("/reports/{report_id}")
async def admin_update_report(
    report_id: str, 
    report_update: ReportUpdate, 
    current_admin = Depends(get_current_admin)
):
    update_data = {k: v for k, v in report_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.reports.update_one({"id": report_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    updated_report = await db.reports.find_one({"id": report_id})
    return Report(**updated_report)

@admin_router.put("/reports/{report_id}/status")
async def admin_update_report_status(
    report_id: str,
    status: str = Form(...),
    current_admin = Depends(get_current_admin)
):
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.reports.update_one({"id": report_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    updated_report = await db.reports.find_one({"id": report_id})
    return Report(**updated_report)

@admin_router.delete("/reports/{report_id}")
async def admin_delete_report(report_id: str, current_admin = Depends(get_current_admin)):
    result = await db.reports.delete_one({"id": report_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted successfully"}

@admin_router.get("/reports/stats")
async def admin_get_report_stats(current_admin = Depends(get_current_admin)):
    total_reports = await db.reports.count_documents({})
    new_reports = await db.reports.count_documents({"status": "new"})
    urgent_reports = await db.reports.count_documents({"priority": "urgent"})
    
    return {
        "total_reports": total_reports,
        "new_reports": new_reports,
        "urgent_reports": urgent_reports
    }

# Admin About Page Management
@admin_router.get("/about")
async def admin_get_about(current_admin = Depends(get_current_admin)):
    about = await db.about.find_one()
    if not about:
        # Create default content
        default_about = AboutPage()
        about_dict = prepare_for_mongo(default_about.dict())
        await db.about.insert_one(about_dict)
        return default_about
    return AboutPage(**about)

@admin_router.put("/about")
async def admin_update_about(
    title: str = Form(None),
    subtitle: str = Form(None),
    content: str = Form(None),
    mission: str = Form(None),
    vision: str = Form(None),
    values: str = Form(None),
    history: str = Form(None),
    about_image: UploadFile = File(None),
    current_admin = Depends(get_current_admin)
):
    update_data = {}
    
    # Handle form data
    if title: update_data["title"] = title
    if subtitle: update_data["subtitle"] = subtitle
    if content: update_data["content"] = content
    if mission: update_data["mission"] = mission
    if vision: update_data["vision"] = vision
    if values: update_data["values"] = values
    if history: update_data["history"] = history
    
    # Handle image upload
    if about_image and about_image.filename:
        file_extension = about_image.filename.split('.')[-1].lower()
        if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
            raise HTTPException(status_code=400, detail="Nur JPG, PNG und WEBP Bilder sind erlaubt")
        
        image_filename = f"about_{uuid.uuid4()}.{file_extension}"
        image_path = UPLOAD_DIR / image_filename
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(about_image.file, buffer)
        
        update_data["image"] = image_filename
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Check if about page exists
    existing = await db.about.find_one()
    if existing:
        await db.about.update_one({}, {"$set": update_data})
    else:
        default_about = AboutPage(**update_data)
        about_dict = prepare_for_mongo(default_about.dict())
        await db.about.insert_one(about_dict)
    
    updated_about = await db.about.find_one()
    return AboutPage(**updated_about)

# Admin Chat Widget Management
@admin_router.get("/chat-widget")
async def admin_get_chat_widget(current_admin = Depends(get_current_admin)):
    chat = await db.chat_widget.find_one()
    if not chat:
        # Create default content
        default_chat = ChatWidget()
        chat_dict = prepare_for_mongo(default_chat.dict())
        await db.chat_widget.insert_one(chat_dict)
        return default_chat
    return ChatWidget(**chat)

@admin_router.put("/chat-widget")
async def admin_update_chat_widget(
    chat_update: ChatWidgetUpdate, 
    current_admin = Depends(get_current_admin)
):
    update_data = {k: v for k, v in chat_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Check if chat widget exists
    existing = await db.chat_widget.find_one()
    if existing:
        await db.chat_widget.update_one({}, {"$set": update_data})
    else:
        default_chat = ChatWidget(**update_data)
        chat_dict = prepare_for_mongo(default_chat.dict())
        await db.chat_widget.insert_one(chat_dict)
    
    updated_chat = await db.chat_widget.find_one()
    return ChatWidget(**updated_chat)

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
    show_services: bool = Form(None),
    show_team: bool = Form(None),
    show_statistics: bool = Form(None),
    footer_text: str = Form(None),
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
    if show_services is not None: update_data["show_services"] = show_services
    if show_team is not None: update_data["show_team"] = show_team
    if show_statistics is not None: update_data["show_statistics"] = show_statistics
    if footer_text: update_data["footer_text"] = footer_text
    
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

# Admin Services Management
@admin_router.get("/services", response_model=List[Service])
async def admin_get_services(current_admin = Depends(get_current_admin)):
    services = await db.services.find().sort("order", 1).to_list(100)
    return [Service(**service) for service in services]

@admin_router.post("/services", response_model=Service)
async def admin_create_service(
    title: str = Form(...),
    description: str = Form(...),
    icon: str = Form("Shield"),
    order: int = Form(0),
    active: bool = Form(True),
    service_image: UploadFile = File(None),
    current_admin = Depends(get_current_admin)
):
    try:
        image_filename = None
        if service_image and service_image.filename:
            file_extension = service_image.filename.split('.')[-1].lower()
            if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
                raise HTTPException(status_code=400, detail="Nur JPG, PNG und WEBP Bilder sind erlaubt")
            
            image_filename = f"service_{uuid.uuid4()}.{file_extension}"
            image_path = UPLOAD_DIR / image_filename
            
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(service_image.file, buffer)
        
        service_data = {
            "title": title,
            "description": description,
            "icon": icon,
            "order": order,
            "active": active,
            "image": image_filename
        }
        
        service_obj = Service(**service_data)
        service_dict = prepare_for_mongo(service_obj.dict())
        await db.services.insert_one(service_dict)
        return service_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.put("/services/{service_id}", response_model=Service)
async def admin_update_service(service_id: str, service_update: ServiceUpdate, current_admin = Depends(get_current_admin)):
    update_data = {k: v for k, v in service_update.dict().items() if v is not None}
    
    result = await db.services.update_one({"id": service_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    updated_service = await db.services.find_one({"id": service_id})
    return Service(**updated_service)

@admin_router.delete("/services/{service_id}")
async def admin_delete_service(service_id: str, current_admin = Depends(get_current_admin)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}

# Admin Team Management
@admin_router.get("/team", response_model=List[TeamMember])
async def admin_get_team(current_admin = Depends(get_current_admin)):
    team = await db.team.find().sort("order", 1).to_list(100)
    return [TeamMember(**member) for member in team]

@admin_router.post("/team", response_model=TeamMember)
async def admin_create_team_member(
    name: str = Form(...),
    position: str = Form(...),
    description: str = Form(None),
    email: str = Form(None),
    phone: str = Form(None),
    order: int = Form(0),
    active: bool = Form(True),
    member_image: UploadFile = File(None),
    current_admin = Depends(get_current_admin)
):
    try:
        image_filename = None
        if member_image and member_image.filename:
            file_extension = member_image.filename.split('.')[-1].lower()
            if file_extension not in ['jpg', 'jpeg', 'png', 'webp']:
                raise HTTPException(status_code=400, detail="Nur JPG, PNG und WEBP Bilder sind erlaubt")
            
            image_filename = f"team_{uuid.uuid4()}.{file_extension}"
            image_path = UPLOAD_DIR / image_filename
            
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(member_image.file, buffer)
        
        member_data = {
            "name": name,
            "position": position,
            "description": description,
            "email": email,
            "phone": phone,
            "order": order,
            "active": active,
            "image": image_filename
        }
        
        member_obj = TeamMember(**member_data)
        member_dict = prepare_for_mongo(member_obj.dict())
        await db.team.insert_one(member_dict)
        return member_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.put("/team/{member_id}", response_model=TeamMember)
async def admin_update_team_member(member_id: str, member_update: TeamMemberUpdate, current_admin = Depends(get_current_admin)):
    update_data = {k: v for k, v in member_update.dict().items() if v is not None}
    
    result = await db.team.update_one({"id": member_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    updated_member = await db.team.find_one({"id": member_id})
    return TeamMember(**updated_member)

@admin_router.delete("/team/{member_id}")
async def admin_delete_team_member(member_id: str, current_admin = Depends(get_current_admin)):
    result = await db.team.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member deleted successfully"}

# Admin Statistics Management
@admin_router.get("/statistics", response_model=List[Statistic])
async def admin_get_statistics(current_admin = Depends(get_current_admin)):
    stats = await db.statistics.find().sort("order", 1).to_list(100)
    return [Statistic(**stat) for stat in stats]

@admin_router.post("/statistics", response_model=Statistic)
async def admin_create_statistic(stat: StatisticCreate, current_admin = Depends(get_current_admin)):
    stat_obj = Statistic(**stat.dict())
    stat_dict = prepare_for_mongo(stat_obj.dict())
    await db.statistics.insert_one(stat_dict)
    return stat_obj

@admin_router.put("/statistics/{stat_id}", response_model=Statistic)
async def admin_update_statistic(stat_id: str, stat_update: StatisticUpdate, current_admin = Depends(get_current_admin)):
    update_data = {k: v for k, v in stat_update.dict().items() if v is not None}
    
    result = await db.statistics.update_one({"id": stat_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Statistic not found")
    
    updated_stat = await db.statistics.find_one({"id": stat_id})
    return Statistic(**updated_stat)

@admin_router.delete("/statistics/{stat_id}")
async def admin_delete_statistic(stat_id: str, current_admin = Depends(get_current_admin)):
    result = await db.statistics.delete_one({"id": stat_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Statistic not found")
    return {"message": "Statistic deleted successfully"}

# Admin Navigation Management
@admin_router.get("/navigation", response_model=List[NavigationItem])
async def admin_get_navigation(current_admin = Depends(get_current_admin)):
    nav_items = await db.navigation.find().sort("order", 1).to_list(100)
    return [NavigationItem(**item) for item in nav_items]

@admin_router.put("/navigation")
async def admin_update_navigation(nav_update: NavigationUpdate, current_admin = Depends(get_current_admin)):
    # Clear existing navigation
    await db.navigation.delete_many({})
    
    # Insert new navigation items
    for item in nav_update.items:
        item_dict = prepare_for_mongo(item.dict())
        await db.navigation.insert_one(item_dict)
    
    return {"message": "Navigation updated successfully"}

# Admin Database Management
@admin_router.get("/database/collections")
async def get_database_collections(current_admin = Depends(get_current_admin)):
    collections = await db.list_collection_names()
    return {"collections": collections}

@admin_router.post("/database/query")
async def query_database(query: DatabaseQuery, current_admin = Depends(get_current_admin)):
    try:
        collection = db[query.collection]
        cursor = collection.find(query.query).limit(query.limit)
        documents = await cursor.to_list(length=query.limit)
        
        # Convert ObjectId to string for JSON serialization
        for doc in documents:
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
        
        return {
            "collection": query.collection,
            "count": len(documents),
            "documents": documents
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.get("/database/stats")
async def get_database_stats(current_admin = Depends(get_current_admin)):
    try:
        stats = {}
        collections = await db.list_collection_names()
        
        for collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            stats[collection_name] = count
        
        return {"database_stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    
    # Create default navigation if not exists
    nav_exists = await db.navigation.find_one()
    if not nav_exists:
        default_nav = [
            NavigationItem(label="Startseite", section="home", order=0),
            NavigationItem(label="Aktuelles", section="news", order=1),
            NavigationItem(label="Bewerbung", section="apply", order=2),
            NavigationItem(label="Feedback", section="feedback", order=3),
            NavigationItem(label="Kontakt", section="contact", order=4)
        ]
        for item in default_nav:
            item_dict = prepare_for_mongo(item.dict())
            await db.navigation.insert_one(item_dict)
        logger.info("Default navigation created")
    
    # Create default services if not exists
    services_exist = await db.services.find_one()
    if not services_exist:
        default_services = [
            Service(title="Streifendienst", description="24/7 Patrouillen für Ihre Sicherheit", icon="Shield", order=0),
            Service(title="Ermittlungen", description="Professionelle Aufklärung von Straftaten", icon="Search", order=1),
            Service(title="Verkehrskontrolle", description="Sicherheit im Straßenverkehr", icon="Car", order=2),
            Service(title="Bürgerdienste", description="Beratung und Unterstützung für Bürger", icon="Users", order=3)
        ]
        for service in default_services:
            service_dict = prepare_for_mongo(service.dict())
            await db.services.insert_one(service_dict)
        logger.info("Default services created")
    
    # Create default statistics if not exists
    stats_exist = await db.statistics.find_one()
    if not stats_exist:
        default_stats = [
            Statistic(title="Einsätze pro Jahr", value="2.500+", icon="Activity", color="blue", order=0),
            Statistic(title="Aufklärungsrate", value="89%", icon="Target", color="green", order=1),
            Statistic(title="Ansprechzeiten", value="< 8 Min", icon="Clock", color="orange", order=2),
            Statistic(title="Mitarbeiter", value="45", icon="Users", color="purple", order=3)
        ]
        for stat in default_stats:
            stat_dict = prepare_for_mongo(stat.dict())
            await db.statistics.insert_one(stat_dict)
        logger.info("Default statistics created")
    
    # Create default team if not exists
    team_exists = await db.team.find_one()
    if not team_exists:
        default_team = [
            TeamMember(name="Klaus Weber", position="Polizeidirektor", description="Leitung der Stadtwache seit 2018", email="k.weber@stadtwache.de", order=0),
            TeamMember(name="Maria Schmidt", position="Hauptkommissarin", description="Zuständig für Ermittlungen", email="m.schmidt@stadtwache.de", order=1),
            TeamMember(name="Thomas Müller", position="Polizeihauptmeister", description="Leiter Verkehrspolizei", email="t.mueller@stadtwache.de", order=2)
        ]
        for member in default_team:
            member_dict = prepare_for_mongo(member.dict())
            await db.team.insert_one(member_dict)
        logger.info("Default team created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()