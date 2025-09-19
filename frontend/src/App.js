import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { 
  Shield, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Star,
  Upload,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  FileText
} from "lucide-react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Navigation Component
const Navigation = ({ activeSection, setActiveSection }) => {
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Stadtwache</span>
          </div>
          <div className="hidden md:flex space-x-8">
            {[
              { id: 'home', label: 'Startseite' },
              { id: 'news', label: 'Aktuelles' },
              { id: 'apply', label: 'Bewerbung' },
              { id: 'feedback', label: 'Feedback' },
              { id: 'contact', label: 'Kontakt' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === item.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1688055536554-2716ab46aaaf')] bg-cover bg-center opacity-10"></div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <Shield className="h-20 w-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Stadtwache
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Sicherheit und Schutz für unsere Gemeinschaft. 
            Moderne Polizeiarbeit im Dienste der Bürger.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Phone className="mr-2 h-5 w-5" />
              Notruf: 110
            </Button>
            <Button size="lg" variant="outline">
              <Users className="mr-2 h-5 w-5" />
              Mehr erfahren
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// News Section
const NewsSection = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const response = await axios.get(`${API}/news`);
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'urgent': return 'Dringend';
      case 'high': return 'Wichtig';
      default: return 'Normal';
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Nachrichten werden geladen...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Aktuelle Meldungen</h2>
          <p className="text-xl text-slate-600">Wichtige Informationen und Updates</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {news.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Derzeit keine aktuellen Meldungen verfügbar.</p>
            </div>
          ) : (
            news.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={getPriorityColor(item.priority)}>
                      {getPriorityLabel(item.priority)}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {new Date(item.date).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{item.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

// Application Form
const ApplicationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    message: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
      });
      if (file) {
        formDataObj.append('cv_file', file);
      }

      await axios.post(`${API}/applications`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Bewerbung erfolgreich eingereicht!');
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        message: ''
      });
      setFile(null);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Fehler beim Einreichen der Bewerbung');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Bewerbung</h2>
          <p className="text-xl text-slate-600">Werden Sie Teil unseres Teams</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Bewerbungsformular
            </CardTitle>
            <CardDescription>
              Füllen Sie das Formular aus und laden Sie Ihren Lebenslauf hoch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Select onValueChange={(value) => handleInputChange('position', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Position auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polizist">Polizist/in</SelectItem>
                      <SelectItem value="verwaltung">Verwaltung</SelectItem>
                      <SelectItem value="technik">Technik</SelectItem>
                      <SelectItem value="sicherheit">Sicherheitsdienst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="cv">Lebenslauf (PDF, DOC, DOCX)</Label>
                <div className="mt-2">
                  <input
                    id="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Nachricht *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                  placeholder="Erzählen Sie uns, warum Sie sich bewerben möchten..."
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Bewerbung wird eingereicht...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Bewerbung einreichen
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

// Feedback Form
const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    rating: 5
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/feedback`, formData);
      toast.success('Feedback erfolgreich eingereicht!');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        rating: 5
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Fehler beim Einreichen des Feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Feedback</h2>
          <p className="text-xl text-slate-600">Ihre Meinung ist uns wichtig</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Feedback-Formular
            </CardTitle>
            <CardDescription>
              Teilen Sie uns Ihre Erfahrungen und Verbesserungsvorschläge mit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="feedback-name">Name *</Label>
                  <Input
                    id="feedback-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="feedback-email">E-Mail *</Label>
                  <Input
                    id="feedback-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Betreff *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rating">Bewertung</Label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleInputChange('rating', star)}
                      className={`p-1 ${
                        star <= formData.rating 
                          ? 'text-yellow-400' 
                          : 'text-slate-300'
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate-600">
                    {formData.rating} von 5 Sternen
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="feedback-message">Nachricht *</Label>
                <Textarea
                  id="feedback-message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                  placeholder="Ihr Feedback..."
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                    Feedback wird gesendet...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Feedback senden
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Kontakt</h2>
          <p className="text-xl text-slate-600">Wir sind für Sie da</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-red-600" />
                Notruf
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 mb-2">110</p>
              <p className="text-slate-600">24/7 Notfall-Hotline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Allgemeine Anfragen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold mb-2">+49 123 456-789</p>
              <p className="text-slate-600">Mo-Fr: 8:00-18:00</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                E-Mail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold mb-2">info@stadtwache.de</p>
              <p className="text-slate-600">Antwort innerhalb 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Adresse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">
                Stadtwache Hauptrevier<br />
                Hauptstraße 123<br />
                12345 Musterstadt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Öffnungszeiten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p><strong>Mo-Fr:</strong> 8:00-20:00</p>
                <p><strong>Sa:</strong> 9:00-16:00</p>
                <p><strong>So:</strong> 10:00-14:00</p>
                <p className="text-red-600 font-medium">Notfälle: 24/7</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Online-Anzeige
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-3">
                Erstatten Sie eine Anzeige online
              </p>
              <Button variant="outline" className="w-full">
                Zur Online-Anzeige
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// Main App Component
function App() {
  const [activeSection, setActiveSection] = useState('home');

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <HeroSection />;
      case 'news':
        return <NewsSection />;
      case 'apply':
        return <ApplicationForm />;
      case 'feedback':
        return <FeedbackForm />;
      case 'contact':
        return <ContactSection />;
      default:
        return <HeroSection />;
    }
  };

  return (
    <div className="App min-h-screen bg-white">
      <BrowserRouter>
        <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="pt-16">
          {renderSection()}
        </main>
        <footer className="bg-slate-900 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="h-8 w-8 text-blue-400" />
                  <span className="text-xl font-bold">Stadtwache</span>
                </div>
                <p className="text-slate-400">
                  Sicherheit und Schutz für unsere Gemeinschaft.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Schnellzugriff</h3>
                <ul className="space-y-2 text-slate-400">
                  <li><button onClick={() => setActiveSection('home')}>Startseite</button></li>
                  <li><button onClick={() => setActiveSection('news')}>Aktuelles</button></li>
                  <li><button onClick={() => setActiveSection('apply')}>Bewerbung</button></li>
                  <li><button onClick={() => setActiveSection('feedback')}>Feedback</button></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Kontakt</h3>
                <ul className="space-y-2 text-slate-400">
                  <li>Notruf: 110</li>
                  <li>Tel: +49 123 456-789</li>
                  <li>info@stadtwache.de</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Öffnungszeiten</h3>
                <ul className="space-y-2 text-slate-400">
                  <li>Mo-Fr: 8:00-20:00</li>
                  <li>Sa: 9:00-16:00</li>
                  <li>So: 10:00-14:00</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
              <p>&copy; 2024 Stadtwache. Alle Rechte vorbehalten.</p>
            </div>
          </div>
        </footer>
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;