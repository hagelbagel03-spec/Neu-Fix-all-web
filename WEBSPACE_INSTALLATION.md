# 🌐 Stadtwache Website - Webspace Installation

## 📋 **Voraussetzungen**

### **Webspace-Anforderungen:**
- **Node.js 18+** (für React Frontend)
- **Python 3.9+** (für FastAPI Backend)  
- **MongoDB** oder MongoDB Atlas (Cloud-Datenbank)
- **SSL-Zertifikat** (für HTTPS)
- **Domain** (z.B. stadtwache-musterstadt.de)

### **Empfohlene Hosting-Provider:**
- ✅ **Hetzner** (VPS mit Docker-Support)
- ✅ **DigitalOcean** (Droplet mit Node.js/Python)
- ✅ **AWS EC2** (mit MongoDB Atlas)
- ✅ **Vercel** (Frontend) + **Railway** (Backend)

---

## 🚀 **Installation auf VPS/Root-Server**

### **Schritt 1: Server vorbereiten**
```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Docker installieren
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.9+ installieren
sudo apt install python3 python3-pip python3-venv -y
```

### **Schritt 2: Repository klonen**
```bash
# Repository herunterladen
git clone https://github.com/IHR-USERNAME/stadtwache-website.git
cd stadtwache-website

# Oder ZIP-Datei hochladen und entpacken
unzip stadtwache-website.zip
cd stadtwache-website
```

### **Schritt 3: MongoDB einrichten**
```bash
# Option A: MongoDB lokal installieren
sudo apt install mongodb -y
sudo systemctl start mongodb

# Option B: MongoDB Atlas (Cloud) - Empfohlen!
# 1. Registrieren auf https://www.mongodb.com/atlas
# 2. Cluster erstellen (kostenlos bis 512MB)
# 3. Connection String kopieren
```

### **Schritt 4: Environment-Variablen konfigurieren**
```bash
# Backend .env bearbeiten
nano backend/.env
```

```env
# MongoDB Verbindung
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/stadtwache?retryWrites=true&w=majority
DB_NAME=stadtwache

# CORS Settings (Ihre Domain eintragen!)
CORS_ORIGINS=https://ihre-domain.de,https://www.ihre-domain.de

# JWT Secret (sicheren Schlüssel generieren!)
SECRET_KEY=ihr-super-sicherer-secret-key-hier-eintragen
```

```bash
# Frontend .env bearbeiten
nano frontend/.env
```

```env
# Backend URL (Ihre Domain eintragen!)
REACT_APP_BACKEND_URL=https://api.ihre-domain.de

# WebSocket Ports
WDS_SOCKET_HOST=ihre-domain.de
WDS_SOCKET_PORT=443
```

### **Schritt 5: Backend starten**
```bash
cd backend

# Virtual Environment erstellen
python3 -m venv venv
source venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt

# Server starten (im Hintergrund)
nohup uvicorn server:app --host 0.0.0.0 --port 8001 > backend.log 2>&1 &
```

### **Schritt 6: Frontend starten**
```bash
cd ../frontend

# Dependencies installieren
npm install

# Production Build erstellen
npm run build

# Serve mit nginx oder Apache
sudo apt install nginx -y
sudo cp -r build/* /var/www/html/
```

### **Schritt 7: Nginx konfigurieren**
```bash
sudo nano /etc/nginx/sites-available/stadtwache
```

```nginx
server {
    listen 80;
    server_name ihre-domain.de www.ihre-domain.de;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name ihre-domain.de www.ihre-domain.de;

    ssl_certificate /etc/letsencrypt/live/ihre-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ihre-domain.de/privkey.pem;

    # Frontend (React)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Nginx aktivieren
sudo ln -s /etc/nginx/sites-available/stadtwache /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **Schritt 8: SSL-Zertifikat (Let's Encrypt)**
```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx -y

# SSL-Zertifikat erstellen
sudo certbot --nginx -d ihre-domain.de -d www.ihre-domain.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

---

## 🐳 **Docker-Installation (Einfacher)**

### **docker-compose.yml erstellen**
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:5
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: securepassword
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    restart: always
    environment:
      MONGO_URL: mongodb://admin:securepassword@mongodb:27017/stadtwache?authSource=admin
      CORS_ORIGINS: https://ihre-domain.de
    ports:
      - "8001:8001"
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### **Docker starten**
```bash
# Alle Services starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Services neustarten
docker-compose restart
```

---

## ⚙️ **Shared Hosting (cPanel/Plesk)**

### **Schritt 1: Files hochladen**
1. **Frontend Build** in `public_html/` hochladen
2. **Backend** in `private/` oder `app/` Ordner hochladen

### **Schritt 2: Node.js App einrichten**
```bash
# In cPanel: Node.js App erstellen
# Startup File: server.js
# Application Root: /app/backend
# Application URL: api.ihre-domain.de
```

### **Schritt 3: .htaccess für Frontend**
```apache
# public_html/.htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# API Weiterleitung
RewriteRule ^api/(.*)$ https://api.ihre-domain.de/$1 [P,L]
```

---

## 🛡️ **Sicherheit & Wartung**

### **Sicherheits-Checkliste:**
- ✅ **HTTPS** aktiviert (SSL-Zertifikat)
- ✅ **MongoDB** mit Authentifizierung
- ✅ **Firewall** konfiguriert (nur Ports 80, 443, 22)
- ✅ **Admin-Passwort** geändert (Standard: admin/admin123)
- ✅ **Backup** einrichten (automatisch)
- ✅ **Updates** regelmäßig installieren

### **Admin-Zugang ändern:**
```bash
# Neuen Admin-User in MongoDB erstellen
# Alten admin-User löschen
# JWT_SECRET regelmäßig ändern
```

### **Backup-Script:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --host localhost --port 27017 --out /backups/mongo_$DATE
tar -czf /backups/files_$DATE.tar.gz /var/www/html
```

---

## 🔧 **Troubleshooting**

### **Häufige Probleme:**

**Problem: "CORS Error"**
```bash
# Backend .env prüfen
CORS_ORIGINS=https://ihre-domain.de,https://www.ihre-domain.de
```

**Problem: "MongoDB Connection Failed"**
```bash
# MongoDB Status prüfen
sudo systemctl status mongodb

# Connection String prüfen
MONGO_URL=mongodb://localhost:27017/stadtwache
```

**Problem: "API nicht erreichbar"**
```bash
# Backend-Prozess prüfen
ps aux | grep uvicorn

# Nginx-Config prüfen  
sudo nginx -t
```

**Problem: "Build Fehler"**
```bash
# Node.js Version prüfen
node --version  # Sollte 18+ sein

# Cache leeren
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 **Support & Updates**

### **Logs anzeigen:**
```bash
# Backend Logs
tail -f backend.log

# Nginx Logs
sudo tail -f /var/log/nginx/error.log

# System Logs
sudo journalctl -f
```

### **Updates installieren:**
```bash
# Git Pull (wenn Repository)
git pull origin main

# Dependencies aktualisieren
pip install -r requirements.txt --upgrade
npm update

# Services neustarten
sudo systemctl restart nginx
pkill -f uvicorn
nohup uvicorn server:app --host 0.0.0.0 --port 8001 > backend.log 2>&1 &
```

---

## 📋 **Checkliste nach Installation**

- [ ] Website über HTTPS erreichbar
- [ ] Admin-Panel funktioniert (admin/admin123)
- [ ] Online-Meldungen funktionieren
- [ ] Chat-Widget erscheint
- [ ] E-Mail-Versand funktioniert
- [ ] Backup läuft automatisch
- [ ] SSL-Zertifikat auto-renew aktiv
- [ ] Monitoring eingerichtet
- [ ] Admin-Passwort geändert
- [ ] Domain DNS korrekt konfiguriert

**🎉 Fertig! Ihre Stadtwache-Website ist online! 🎉**

**URLs:**
- **Website:** https://ihre-domain.de
- **Admin:** https://ihre-domain.de (Footer: "Admin Panel")
- **API:** https://ihre-domain.de/api

**Support:** Für weitere Hilfe Screenshots der Fehler senden!