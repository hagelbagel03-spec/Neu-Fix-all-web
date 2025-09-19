import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
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
  FileText,
  Settings,
  LogOut,
  Edit,
  Trash2,
  Eye,
  Reply,
  Plus,
  Save,
  MessageSquare,
  UserCheck,
  Home
} from "lucide-react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Admin Context
const AdminContext = React.createContext();

// Admin Login Component
const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      const token = response.data.access_token;
      
      localStorage.setItem('admin_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Erfolgreich angemeldet!');
      onLogin(token);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Anmeldung fehlgeschlagen. Überprüfen Sie Ihre Anmeldedaten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Stadtwache Verwaltung</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>
          <div className="mt-4 text-sm text-center text-slate-600">
            Standard Login: admin / admin123
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('news');
  const [news, setNews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [homepage, setHomepage] = useState({});
  const [loading, setLoading] = useState(false);

  // News Management
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    published: true
  });
  const [editingNews, setEditingNews] = useState(null);

  // Homepage Management
  const [homepageForm, setHomepageForm] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [newsRes, appsRes, feedbackRes, homepageRes] = await Promise.all([
        axios.get(`${API}/admin/news`),
        axios.get(`${API}/admin/applications`),
        axios.get(`${API}/admin/feedback`),
        axios.get(`${API}/admin/homepage`)
      ]);
      
      setNews(newsRes.data);
      setApplications(appsRes.data);
      setFeedback(feedbackRes.data);
      setHomepage(homepageRes.data);
      setHomepageForm(homepageRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    delete axios.defaults.headers.common['Authorization'];
    onLogout();
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNews) {
        await axios.put(`${API}/admin/news/${editingNews.id}`, newsForm);
        toast.success('Nachricht aktualisiert');
      } else {
        await axios.post(`${API}/admin/news`, newsForm);
        toast.success('Nachricht erstellt');
      }
      
      setNewsForm({ title: '', content: '', priority: 'normal', published: true });
      setEditingNews(null);
      loadData();
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (window.confirm('Möchten Sie diese Nachricht wirklich löschen?')) {
      try {
        await axios.delete(`${API}/admin/news/${newsId}`);
        toast.success('Nachricht gelöscht');
        loadData();
      } catch (error) {
        console.error('Error deleting news:', error);
        toast.error('Fehler beim Löschen');
      }
    }
  };

  const handleApplicationResponse = async (appId, status, response, adminEmail) => {
    try {
      await axios.put(`${API}/admin/applications/${appId}/respond`, {
        application_id: appId,
        status,
        admin_response: response,
        admin_email: adminEmail
      });
      toast.success('Antwort gesendet');
      loadData();
    } catch (error) {
      console.error('Error responding to application:', error);
      toast.error('Fehler beim Senden der Antwort');
    }
  };

  const handleHomepageUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(homepageForm).forEach(key => {
        if (homepageForm[key] !== null && homepageForm[key] !== undefined) {
          formData.append(key, homepageForm[key]);
        }
      });

      await axios.put(`${API}/admin/homepage`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Startseite aktualisiert');
      loadData();
    } catch (error) {
      console.error('Error updating homepage:', error);
      toast.error('Fehler beim Aktualisieren der Startseite');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="news">
              <FileText className="mr-2 h-4 w-4" />
              Meldungen
            </TabsTrigger>
            <TabsTrigger value="applications">
              <User className="mr-2 h-4 w-4" />
              Bewerbungen ({applications.filter(app => app.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback ({feedback.filter(fb => fb.status === 'new').length})
            </TabsTrigger>
            <TabsTrigger value="homepage">
              <Home className="mr-2 h-4 w-4" />
              Startseite
            </TabsTrigger>
          </TabsList>

          {/* News Management */}
          <TabsContent value="news" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingNews ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editingNews ? 'Nachricht bearbeiten' : 'Neue Nachricht erstellen'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNewsSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="news-title">Titel</Label>
                      <Input
                        id="news-title"
                        value={newsForm.title}
                        onChange={(e) => setNewsForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="news-priority">Priorität</Label>
                      <Select 
                        value={newsForm.priority}
                        onValueChange={(value) => setNewsForm(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Wichtig</SelectItem>
                          <SelectItem value="urgent">Dringend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="news-content">Inhalt</Label>
                    <Textarea
                      id="news-content"
                      value={newsForm.content}
                      onChange={(e) => setNewsForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      placeholder="Nachrichteninhalt eingeben..."
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="published"
                      checked={newsForm.published}
                      onChange={(e) => setNewsForm(prev => ({ ...prev, published: e.target.checked }))}
                    />
                    <Label htmlFor="published">Veröffentlicht</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      {editingNews ? 'Aktualisieren' : 'Erstellen'}
                    </Button>
                    {editingNews && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditingNews(null);
                          setNewsForm({ title: '', content: '', priority: 'normal', published: true });
                        }}
                      >
                        Abbrechen
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alle Meldungen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {news.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority === 'urgent' ? 'Dringend' : 
                             item.priority === 'high' ? 'Wichtig' : 'Normal'}
                          </Badge>
                          {!item.published && (
                            <Badge variant="outline">Unveröffentlicht</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNews(item);
                              setNewsForm({
                                title: item.title,
                                content: item.content,
                                priority: item.priority,
                                published: item.published
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteNews(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <div 
                        className="text-slate-600 mb-2"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                      <p className="text-sm text-slate-500">
                        {new Date(item.date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Management */}
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bewerbungen verwalten</CardTitle>
                <CardDescription>
                  Überprüfen und beantworten Sie eingegangene Bewerbungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>{app.position}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.status)}>
                            {app.status === 'pending' ? 'Ausstehend' :
                             app.status === 'reviewed' ? 'Geprüft' :
                             app.status === 'accepted' ? 'Angenommen' : 'Abgelehnt'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(app.created_at).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="mr-2 h-4 w-4" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Bewerbung von {app.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label>Name</Label>
                                    <p className="text-sm">{app.name}</p>
                                  </div>
                                  <div>
                                    <Label>E-Mail</Label>
                                    <p className="text-sm">{app.email}</p>
                                  </div>
                                  <div>
                                    <Label>Telefon</Label>
                                    <p className="text-sm">{app.phone}</p>
                                  </div>
                                  <div>
                                    <Label>Position</Label>
                                    <p className="text-sm">{app.position}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Nachricht</Label>
                                  <p className="text-sm">{app.message}</p>
                                </div>
                                {app.cv_filename && (
                                  <div>
                                    <Label>Lebenslauf</Label>
                                    <a 
                                      href={`${API}/uploads/${app.cv_filename}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-sm"
                                    >
                                      {app.cv_filename}
                                    </a>
                                  </div>
                                )}
                                
                                {app.status === 'pending' && (
                                  <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold">Antworten</h4>
                                    <div className="grid gap-2 md:grid-cols-3">
                                      <Button
                                        onClick={() => handleApplicationResponse(
                                          app.id, 
                                          'accepted', 
                                          'Herzlichen Glückwunsch! Ihre Bewerbung wurde angenommen.',
                                          'hr@stadtwache.de'
                                        )}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Annehmen
                                      </Button>
                                      <Button
                                        onClick={() => handleApplicationResponse(
                                          app.id,
                                          'rejected',
                                          'Vielen Dank für Ihr Interesse. Leider können wir Ihnen derzeit keine Stelle anbieten.',
                                          'hr@stadtwache.de'
                                        )}
                                        variant="destructive"
                                      >
                                        Ablehnen
                                      </Button>
                                      <Button
                                        onClick={() => handleApplicationResponse(
                                          app.id,
                                          'reviewed',
                                          'Ihre Bewerbung wurde geprüft. Wir melden uns bald bei Ihnen.',
                                          'hr@stadtwache.de'
                                        )}
                                        variant="outline"
                                      >
                                        Als geprüft markieren
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {app.admin_response && (
                                  <div className="space-y-2 pt-4 border-t">
                                    <Label>Admin-Antwort</Label>
                                    <p className="text-sm bg-slate-50 p-3 rounded">{app.admin_response}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Management */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feedback verwalten</CardTitle>
                <CardDescription>
                  Überprüfen Sie Bürger-Feedback und Bewertungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Betreff</TableHead>
                      <TableHead>Bewertung</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((fb) => (
                      <TableRow key={fb.id}>
                        <TableCell className="font-medium">{fb.name}</TableCell>
                        <TableCell>{fb.subject}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm">{fb.rating}/5</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(fb.status)}>
                            {fb.status === 'new' ? 'Neu' : 'Geprüft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(fb.created_at).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="mr-2 h-4 w-4" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Feedback von {fb.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label>Name</Label>
                                    <p className="text-sm">{fb.name}</p>
                                  </div>
                                  <div>
                                    <Label>E-Mail</Label>
                                    <p className="text-sm">{fb.email}</p>
                                  </div>
                                  <div>
                                    <Label>Betreff</Label>
                                    <p className="text-sm">{fb.subject}</p>
                                  </div>
                                  <div>
                                    <Label>Bewertung</Label>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < fb.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                      <span className="ml-2 text-sm">{fb.rating}/5</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <Label>Nachricht</Label>
                                  <p className="text-sm bg-slate-50 p-3 rounded">{fb.message}</p>
                                </div>
                                
                                {fb.status === 'new' && (
                                  <div className="space-y-2 pt-4 border-t">
                                    <Button
                                      onClick={async () => {
                                        try {
                                          const formData = new FormData();
                                          formData.append('admin_response', 'Vielen Dank für Ihr Feedback. Wir haben es zur Kenntnis genommen.');
                                          
                                          await axios.put(`${API}/admin/feedback/${fb.id}/respond`, formData);
                                          toast.success('Feedback als geprüft markiert');
                                          loadData();
                                        } catch (error) {
                                          console.error('Error:', error);
                                          toast.error('Fehler beim Aktualisieren');
                                        }
                                      }}
                                      variant="outline"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Als geprüft markieren
                                    </Button>
                                  </div>
                                )}
                                
                                {fb.admin_response && (
                                  <div className="space-y-2 pt-4 border-t">
                                    <Label>Admin-Antwort</Label>
                                    <p className="text-sm bg-slate-50 p-3 rounded">{fb.admin_response}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homepage Management */}
          <TabsContent value="homepage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Startseite bearbeiten</CardTitle>
                <CardDescription>
                  Bearbeiten Sie den Inhalt der Startseite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHomepageUpdate} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="hero_title">Haupttitel</Label>
                      <Input
                        id="hero_title"
                        value={homepageForm.hero_title || ''}
                        onChange={(e) => setHomepageForm(prev => ({ ...prev, hero_title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_number">Notrufnummer</Label>
                      <Input
                        id="emergency_number"
                        value={homepageForm.emergency_number || ''}
                        onChange={(e) => setHomepageForm(prev => ({ ...prev, emergency_number: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hero_subtitle">Untertitel</Label>
                    <ReactQuill
                      value={homepageForm.hero_subtitle || ''}
                      onChange={(content) => setHomepageForm(prev => ({ ...prev, hero_subtitle: content }))}
                      modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline'],
                          ['link'],
                          ['clean']
                        ],
                      }}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="phone_number">Telefonnummer</Label>
                      <Input
                        id="phone_number"
                        value={homepageForm.phone_number || ''}
                        onChange={(e) => setHomepageForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        value={homepageForm.email || ''}
                        onChange={(e) => setHomepageForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Textarea
                      id="address"
                      value={homepageForm.address || ''}
                      onChange={(e) => setHomepageForm(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="opening_hours">Öffnungszeiten</Label>
                    <Textarea
                      id="opening_hours"
                      value={homepageForm.opening_hours || ''}
                      onChange={(e) => setHomepageForm(prev => ({ ...prev, opening_hours: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hero_image">Hero-Bild</Label>
                    <input
                      id="hero_image"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => setHomepageForm(prev => ({ ...prev, hero_image: e.target.files[0] }))}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show_latest_news"
                      checked={homepageForm.show_latest_news || false}
                      onChange={(e) => setHomepageForm(prev => ({ ...prev, show_latest_news: e.target.checked }))}
                    />
                    <Label htmlFor="show_latest_news">Neueste Meldung auf Startseite anzeigen</Label>
                  </div>

                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Startseite aktualisieren
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Updated Main Website Components with Dynamic Content
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

// Updated Hero Section with Dynamic Content
const HeroSection = () => {
  const [homepage, setHomepage] = useState({});
  const [latestNews, setLatestNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomepageData = async () => {
      try {
        const [homepageRes, latestNewsRes] = await Promise.all([
          axios.get(`${API}/homepage`),
          axios.get(`${API}/news/latest`)
        ]);
        
        setHomepage(homepageRes.data);
        setLatestNews(latestNewsRes.data);
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomepageData();
  }, []);

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">Lädt...</div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      {homepage.hero_image && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url('${API}/uploads/${homepage.hero_image}')` }}
        ></div>
      )}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <Shield className="h-20 w-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            {homepage.hero_title || 'Stadtwache'}
          </h1>
          <div 
            className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ 
              __html: homepage.hero_subtitle || 'Sicherheit und Schutz für unsere Gemeinschaft. Moderne Polizeiarbeit im Dienste der Bürger.' 
            }}
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Phone className="mr-2 h-5 w-5" />
              Notruf: {homepage.emergency_number || '110'}
            </Button>
            <Button size="lg" variant="outline">
              <Users className="mr-2 h-5 w-5" />
              Mehr erfahren
            </Button>
          </div>
        </div>

        {/* Latest News Display */}
        {homepage.show_latest_news && latestNews && (
          <Card className="max-w-2xl mx-auto mt-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Aktuelle Meldung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={
                    latestNews.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    latestNews.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {latestNews.priority === 'urgent' ? 'Dringend' :
                     latestNews.priority === 'high' ? 'Wichtig' : 'Normal'}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    {new Date(latestNews.date).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{latestNews.title}</h3>
                <div 
                  className="text-slate-600"
                  dangerouslySetInnerHTML={{ __html: latestNews.content }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

// Rest of the components remain the same (NewsSection, ApplicationForm, FeedbackForm, ContactSection)
// I'll keep them unchanged for brevity but they're still needed

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
                  <div 
                    className="text-slate-600"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

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

const ContactSection = () => {
  const [homepage, setHomepage] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomepageData = async () => {
      try {
        const response = await axios.get(`${API}/homepage`);
        setHomepage(response.data);
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomepageData();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Lädt...</div>
        </div>
      </section>
    );
  }

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
              <p className="text-2xl font-bold text-red-600 mb-2">
                {homepage.emergency_number || '110'}
              </p>
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
              <p className="text-xl font-semibold mb-2">
                {homepage.phone_number || '+49 123 456-789'}
              </p>
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
              <p className="font-semibold mb-2">
                {homepage.email || 'info@stadtwache.de'}
              </p>
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
              <div className="whitespace-pre-line text-sm">
                {homepage.address || 'Stadtwache Hauptrevier\nHauptstraße 123\n12345 Musterstadt'}
              </div>
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
              <div className="whitespace-pre-line text-sm">
                {homepage.opening_hours || 'Mo-Fr: 8:00-20:00\nSa: 9:00-16:00\nSo: 10:00-14:00'}
                <p className="text-red-600 font-medium mt-2">Notfälle: 24/7</p>
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    // Check for admin token on app start
    const token = localStorage.getItem('admin_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token is still valid
      axios.get(`${API}/admin/me`)
        .then(() => {
          setIsLoggedIn(true);
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
          delete axios.defaults.headers.common['Authorization'];
        });
    }

    // Check if we're on admin route
    const path = window.location.pathname;
    if (path.includes('/admin')) {
      setIsAdmin(true);
    }
  }, []);

  const handleAdminLogin = (token) => {
    setIsLoggedIn(true);
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    window.location.href = '/';
  };

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

  // Admin Panel Route Check
  if (isAdmin || window.location.pathname.includes('/admin')) {
    if (!isLoggedIn) {
      return <AdminLogin onLogin={handleAdminLogin} />;
    }
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  // Public Website
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
                <h3 className="font-semibold mb-4">Verwaltung</h3>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <button onClick={() => {
                      setIsAdmin(true);
                      window.history.pushState({}, '', '/admin');
                    }} className="hover:text-white transition-colors">
                      <Settings className="inline mr-2 h-4 w-4" />
                      Admin Panel
                    </button>
                  </li>
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