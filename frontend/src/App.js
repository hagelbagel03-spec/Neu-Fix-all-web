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
  Home,
  Search,
  Car,
  Activity,
  Target,
  TrendingUp,
  Database
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
  const [activeTab, setActiveTab] = useState('reports');
  const [news, setNews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reports, setReports] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatButtons, setChatButtons] = useState([]);
  const [homepage, setHomepage] = useState({});
  const [about, setAbout] = useState({});
  const [chatWidget, setChatWidget] = useState({});
  const [loading, setLoading] = useState(false);

  // News Management
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    published: true
  });
  const [editingNews, setEditingNews] = useState(null);

  // About page management
  const [aboutForm, setAboutForm] = useState({});

  // Chat widget management
  const [chatWidgetForm, setChatWidgetForm] = useState({});
  const [buttonForm, setButtonForm] = useState({
    label: '',
    action: 'email',
    value: '',
    order: 0,
    active: true
  });
  const [editingButton, setEditingButton] = useState(null);

  // Homepage Management
  const [homepageForm, setHomepageForm] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const requests = [
        axios.get(`${API}/admin/reports`),
        axios.get(`${API}/admin/news`),
        axios.get(`${API}/admin/applications`),
        axios.get(`${API}/admin/feedback`),
        axios.get(`${API}/admin/chat/messages`),
        axios.get(`${API}/admin/chat/buttons`),
        axios.get(`${API}/admin/homepage`),
        axios.get(`${API}/admin/about`),
        axios.get(`${API}/admin/chat-widget`)
      ];
      
      const [reportsRes, newsRes, appsRes, feedbackRes, chatMsgRes, chatBtnRes, homepageRes, aboutRes, chatWidgetRes] = await Promise.all(requests);
      
      setReports(reportsRes.data);
      setNews(newsRes.data);
      setApplications(appsRes.data);
      setFeedback(feedbackRes.data);
      setChatMessages(chatMsgRes.data);
      setChatButtons(chatBtnRes.data);
      setHomepage(homepageRes.data);
      setAbout(aboutRes.data);
      setChatWidget(chatWidgetRes.data);
      setHomepageForm(homepageRes.data);
      setAboutForm(aboutRes.data);
      setChatWidgetForm(chatWidgetRes.data);
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

  const handleAboutUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(aboutForm).forEach(key => {
        if (aboutForm[key] !== null && aboutForm[key] !== undefined) {
          formData.append(key, aboutForm[key]);
        }
      });

      await axios.put(`${API}/admin/about`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Über uns Seite aktualisiert');
      loadData();
    } catch (error) {
      console.error('Error updating about page:', error);
      toast.error('Fehler beim Aktualisieren der Über uns Seite');
    }
  };

  const handleChatWidgetUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/chat-widget`, chatWidgetForm);
      toast.success('Chat-Widget aktualisiert');
      loadData();
    } catch (error) {
      console.error('Error updating chat widget:', error);
      toast.error('Fehler beim Aktualisieren des Chat-Widgets');
    }
  };

  const handleButtonSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingButton) {
        await axios.put(`${API}/admin/chat/buttons/${editingButton.id}`, buttonForm);
        toast.success('Button aktualisiert');
      } else {
        await axios.post(`${API}/admin/chat/buttons`, buttonForm);
        toast.success('Button erstellt');
      }
      
      setButtonForm({ label: '', action: 'email', value: '', order: 0, active: true });
      setEditingButton(null);
      loadData();
    } catch (error) {
      console.error('Error saving button:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDeleteButton = async (buttonId) => {
    if (window.confirm('Möchten Sie diesen Button wirklich löschen?')) {
      try {
        await axios.delete(`${API}/admin/chat/buttons/${buttonId}`);
        toast.success('Button gelöscht');
        loadData();
      } catch (error) {
        console.error('Error deleting button:', error);
        toast.error('Fehler beim Löschen');
      }
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              Online-Meldungen ({reports.filter(r => r.status === 'new').length})
            </TabsTrigger>
            <TabsTrigger value="news">
              <FileText className="mr-2 h-4 w-4" />
              News
            </TabsTrigger>
            <TabsTrigger value="applications">
              <User className="mr-2 h-4 w-4" />
              Bewerbungen ({applications.filter(app => app.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback ({feedback.filter(fb => fb.status === 'new').length})
            </TabsTrigger>
            <TabsTrigger value="about">
              <Users className="mr-2 h-4 w-4" />
              Über uns
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat-Widget
            </TabsTrigger>
            <TabsTrigger value="homepage">
              <Home className="mr-2 h-4 w-4" />
              Startseite
            </TabsTrigger>
          </TabsList>

          {/* Reports Management */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Online-Meldungen verwalten</CardTitle>
                <CardDescription>
                  Überprüfen und bearbeiten Sie eingegangene Online-Meldungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vorfall</TableHead>
                      <TableHead>Melder</TableHead>
                      <TableHead>Ort</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.incident_type}</TableCell>
                        <TableCell>{report.reporter_name}</TableCell>
                        <TableCell>{report.location}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status === 'new' ? 'Neu' : 
                             report.status === 'in_progress' ? 'In Bearbeitung' :
                             report.status === 'resolved' ? 'Erledigt' : 'Geschlossen'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.created_at).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="mr-2 h-4 w-4" />
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Online-Meldung Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label>Vorfall</Label>
                                    <p className="text-sm">{report.incident_type}</p>
                                  </div>
                                  <div>
                                    <Label>Ort</Label>
                                    <p className="text-sm">{report.location}</p>
                                  </div>
                                  <div>
                                    <Label>Datum/Zeit</Label>
                                    <p className="text-sm">
                                      {report.incident_date} um {report.incident_time}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Melder</Label>
                                    <p className="text-sm">{report.reporter_name}</p>
                                  </div>
                                  <div>
                                    <Label>E-Mail</Label>
                                    <p className="text-sm">{report.reporter_email}</p>
                                  </div>
                                  <div>
                                    <Label>Telefon</Label>
                                    <p className="text-sm">{report.reporter_phone}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label>Beschreibung</Label>
                                  <p className="text-sm bg-slate-50 p-3 rounded">{report.description}</p>
                                </div>
                                {report.additional_info && (
                                  <div>
                                    <Label>Zusätzliche Informationen</Label>
                                    <p className="text-sm bg-slate-50 p-3 rounded">{report.additional_info}</p>
                                  </div>
                                )}
                                
                                {report.status === 'new' && (
                                  <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold">Status ändern</h4>
                                    <div className="grid gap-2 md:grid-cols-3">
                                      <Button
                                        onClick={async () => {
                                          try {
                                            await axios.put(`${API}/admin/reports/${report.id}`, {
                                              status: 'under_review'
                                            });
                                            toast.success('Status aktualisiert');
                                            loadData();
                                          } catch (error) {
                                            console.error('Error:', error);
                                            toast.error('Fehler beim Aktualisieren');
                                          }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        In Bearbeitung
                                      </Button>
                                      <Button
                                        onClick={async () => {
                                          try {
                                            await axios.put(`${API}/admin/reports/${report.id}`, {
                                              status: 'completed'
                                            });
                                            toast.success('Status aktualisiert');
                                            loadData();
                                          } catch (error) {
                                            console.error('Error:', error);
                                            toast.error('Fehler beim Aktualisieren');
                                          }
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Erledigt
                                      </Button>
                                      <Button
                                        onClick={async () => {
                                          try {
                                            await axios.put(`${API}/admin/reports/${report.id}/status`, {
                                              status: 'closed'
                                            });
                                            toast.success('Status aktualisiert');
                                            loadData();
                                          } catch (error) {
                                            console.error('Error:', error);
                                            toast.error('Fehler beim Aktualisieren');
                                          }
                                        }}
                                        variant="outline"
                                      >
                                        Schließen
                                      </Button>
                                    </div>
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
                      <p className="text-slate-600 mb-2">{item.content}</p>
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

          {/* About Us Management */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Über uns Seite bearbeiten</CardTitle>
                <CardDescription>
                  Bearbeiten Sie den Inhalt der Über uns Seite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAboutUpdate} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="about_title">Titel</Label>
                      <Input
                        id="about_title"
                        value={aboutForm.title || ''}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Über uns"
                      />
                    </div>
                    <div>
                      <Label htmlFor="about_subtitle">Untertitel</Label>
                      <Input
                        id="about_subtitle"
                        value={aboutForm.subtitle || ''}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Erfahren Sie mehr über die Stadtwache"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="about_content">Hauptinhalt</Label>
                    <Textarea
                      id="about_content"
                      value={aboutForm.content || ''}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      placeholder="Hier steht der Inhalt über das Unternehmen..."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="about_mission">Unsere Mission</Label>
                      <Textarea
                        id="about_mission"
                        value={aboutForm.mission || ''}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, mission: e.target.value }))}
                        rows={3}
                        placeholder="Mission der Stadtwache..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="about_vision">Unsere Vision</Label>
                      <Textarea
                        id="about_vision"
                        value={aboutForm.vision || ''}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, vision: e.target.value }))}
                        rows={3}
                        placeholder="Vision der Stadtwache..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="about_values">Unsere Werte</Label>
                      <Textarea
                        id="about_values"
                        value={aboutForm.values || ''}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, values: e.target.value }))}
                        rows={3}
                        placeholder="Werte der Stadtwache..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="about_history">Geschichte</Label>
                    <Textarea
                      id="about_history"
                      value={aboutForm.history || ''}
                      onChange={(e) => setAboutForm(prev => ({ ...prev, history: e.target.value }))}
                      rows={4}
                      placeholder="Die Geschichte der Stadtwache..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="about_image">Über uns Bild</Label>
                    <input
                      id="about_image"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => setAboutForm(prev => ({ ...prev, about_image: e.target.files[0] }))}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Über uns Seite aktualisieren
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Widget Management */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chat-Widget Einstellungen</CardTitle>
                <CardDescription>
                  Konfigurieren Sie das Chat-Widget für Ihre Website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChatWidgetUpdate} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="chat_title">Widget-Titel</Label>
                      <Input
                        id="chat_title"
                        value={chatWidgetForm.title || ''}
                        onChange={(e) => setChatWidgetForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Hilfe & Support"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chat_position">Position</Label>
                      <Select 
                        value={chatWidgetForm.position || 'bottom-left'}
                        onValueChange={(value) => setChatWidgetForm(prev => ({ ...prev, position: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-left">Unten Links</SelectItem>
                          <SelectItem value="bottom-right">Unten Rechts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="chat_welcome">Willkommensnachricht</Label>
                    <Textarea
                      id="chat_welcome"
                      value={chatWidgetForm.welcome_message || ''}
                      onChange={(e) => setChatWidgetForm(prev => ({ ...prev, welcome_message: e.target.value }))}
                      rows={2}
                      placeholder="Hallo! Wie können wir Ihnen helfen?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="chat_offline">Offline-Nachricht</Label>
                    <Textarea
                      id="chat_offline"
                      value={chatWidgetForm.offline_message || ''}
                      onChange={(e) => setChatWidgetForm(prev => ({ ...prev, offline_message: e.target.value }))}
                      rows={2}
                      placeholder="Wir sind derzeit nicht verfügbar..."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="chat_color">Farbe</Label>
                      <Select 
                        value={chatWidgetForm.color || 'blue'}
                        onValueChange={(value) => setChatWidgetForm(prev => ({ ...prev, color: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blue">Blau</SelectItem>
                          <SelectItem value="green">Grün</SelectItem>
                          <SelectItem value="gray">Grau</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="chat_email">Support E-Mail</Label>
                      <Input
                        id="chat_email"
                        type="email"
                        value={chatWidgetForm.contact_email || ''}
                        onChange={(e) => setChatWidgetForm(prev => ({ ...prev, contact_email: e.target.value }))}
                        placeholder="support@stadtwache.de"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chat_phone">Telefonnummer</Label>
                      <Input
                        id="chat_phone"
                        value={chatWidgetForm.phone_number || ''}
                        onChange={(e) => setChatWidgetForm(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="+49 123 456-789"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="chat_hours">Öffnungszeiten</Label>
                    <Input
                      id="chat_hours"
                      value={chatWidgetForm.operating_hours || ''}
                      onChange={(e) => setChatWidgetForm(prev => ({ ...prev, operating_hours: e.target.value }))}
                      placeholder="Mo-Fr: 8:00-18:00"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="chat_enabled"
                      checked={chatWidgetForm.enabled || false}
                      onChange={(e) => setChatWidgetForm(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <Label htmlFor="chat_enabled">Chat-Widget aktivieren</Label>
                  </div>

                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Chat-Widget aktualisieren
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Chat Buttons Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingButton ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {editingButton ? 'Button bearbeiten' : 'Neuen Chat-Button erstellen'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleButtonSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="button_label">Button-Text</Label>
                      <Input
                        id="button_label"
                        value={buttonForm.label}
                        onChange={(e) => setButtonForm(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="E-Mail senden"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="button_action">Aktion</Label>
                      <Select 
                        value={buttonForm.action}
                        onValueChange={(value) => setButtonForm(prev => ({ ...prev, action: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">E-Mail senden</SelectItem>
                          <SelectItem value="phone">Anrufen</SelectItem>
                          <SelectItem value="link">Link öffnen</SelectItem>
                          <SelectItem value="message">Vordefinierte Nachricht</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="button_value">
                      {buttonForm.action === 'email' ? 'E-Mail-Adresse' :
                       buttonForm.action === 'phone' ? 'Telefonnummer' :
                       buttonForm.action === 'link' ? 'URL' : 'Nachrichtentext'}
                    </Label>
                    <Input
                      id="button_value"
                      value={buttonForm.value}
                      onChange={(e) => setButtonForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={
                        buttonForm.action === 'email' ? 'support@stadtwache.de' :
                        buttonForm.action === 'phone' ? '+49 123 456-789' :
                        buttonForm.action === 'link' ? 'https://example.com' :
                        'Ich habe eine Frage zu...'
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="button_order">Reihenfolge</Label>
                      <Input
                        id="button_order"
                        type="number"
                        value={buttonForm.order}
                        onChange={(e) => setButtonForm(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="button_active"
                        checked={buttonForm.active}
                        onChange={(e) => setButtonForm(prev => ({ ...prev, active: e.target.checked }))}
                      />
                      <Label htmlFor="button_active">Aktiv</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      {editingButton ? 'Aktualisieren' : 'Erstellen'}
                    </Button>
                    {editingButton && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditingButton(null);
                          setButtonForm({ label: '', action: 'email', value: '', order: 0, active: true });
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
                <CardTitle>Alle Chat-Buttons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chatButtons.map((button) => (
                    <div key={button.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{button.label}</h3>
                          <p className="text-slate-600">
                            {button.action === 'email' ? '📧 E-Mail' :
                             button.action === 'phone' ? '📞 Telefon' :
                             button.action === 'link' ? '🔗 Link' : '💬 Nachricht'}: {button.value}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingButton(button);
                              setButtonForm({
                                label: button.label,
                                action: button.action,
                                value: button.value,
                                order: button.order,
                                active: button.active
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteButton(button.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Reihenfolge: {button.order}</span>
                        <span>•</span>
                        <span>{button.active ? 'Aktiv' : 'Inaktiv'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Eingegangene Chat-Nachrichten</CardTitle>
                <CardDescription>
                  Nachrichten von Website-Besuchern ({chatMessages.filter(msg => msg.status === 'new').length} neue)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Noch keine Chat-Nachrichten eingegangen.</p>
                  ) : (
                    chatMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{message.visitor_name}</h4>
                            <p className="text-sm text-slate-500">{message.visitor_email}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={message.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                              {message.status === 'new' ? 'Neu' : 'Beantwortet'}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(message.created_at).toLocaleDateString('de-DE')} {new Date(message.created_at).toLocaleTimeString('de-DE')}
                            </p>
                          </div>
                        </div>
                        <p className="text-slate-700 mb-3">{message.message}</p>
                        
                        {message.admin_response && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Admin-Antwort:</strong> {message.admin_response}
                            </p>
                          </div>
                        )}
                        
                        {message.status === 'new' && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await axios.put(`${API}/admin/chat/messages/${message.id}/respond`, {
                                    message_id: message.id,
                                    admin_response: 'Vielen Dank für Ihre Nachricht. Wir haben sie erhalten und werden uns per E-Mail bei Ihnen melden.'
                                  });
                                  toast.success('Nachricht als beantwortet markiert');
                                  loadData();
                                } catch (error) {
                                  console.error('Error:', error);
                                  toast.error('Fehler beim Aktualisieren');
                                }
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Als beantwortet markieren
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
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
                    <Textarea
                      id="hero_subtitle"
                      value={homepageForm.hero_subtitle || ''}
                      onChange={(e) => setHomepageForm(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                      rows={4}
                      placeholder="Untertitel für die Startseite..."
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
              { id: 'report', label: 'Online-Melden' },
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
const HeroSection = ({ setActiveSection }) => {
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
          >
            {homepage.hero_subtitle || 'Sicherheit und Schutz für unsere Gemeinschaft. Moderne Polizeiarbeit im Dienste der Bürger.'}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Phone className="mr-2 h-5 w-5" />
              Notruf: {homepage.emergency_number || '110'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setActiveSection('about')}>
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

// Online Report Form
// About Us Section
const AboutSection = () => {
  const [about, setAbout] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAboutData = async () => {
      try {
        const response = await axios.get(`${API}/about`);
        setAbout(response.data);
      } catch (error) {
        console.error('Error loading about data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAboutData();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Lädt...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            {about.title || 'Über uns'}
          </h2>
          <p className="text-xl text-slate-600">
            {about.subtitle || 'Erfahren Sie mehr über die Stadtwache'}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            {about.image && (
              <img 
                src={`${API}/uploads/${about.image}`} 
                alt="Über uns"
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            )}
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Unsere Geschichte</h3>
              <p className="text-slate-600 leading-relaxed">
                {about.content || 'Hier steht der Inhalt über das Unternehmen...'}
              </p>
            </div>
          </div>
        </div>

        {/* Mission, Vision, Values */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {about.mission && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Unsere Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{about.mission}</p>
              </CardContent>
            </Card>
          )}
          
          {about.vision && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Unsere Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{about.vision}</p>
              </CardContent>
            </Card>
          )}
          
          {about.values && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-600" />
                  Unsere Werte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{about.values}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {about.history && (
          <div className="mt-16">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6 text-center">Unsere Geschichte</h3>
            <div className="max-w-4xl mx-auto">
              <p className="text-slate-600 leading-relaxed text-lg">{about.history}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Enhanced Chat Widget Component
const ChatWidget = () => {
  const [chatConfig, setChatConfig] = useState({});
  const [chatButtons, setChatButtons] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageForm, setMessageForm] = useState({
    visitor_name: '',
    visitor_email: '',
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadChatData = async () => {
      try {
        const [configRes, buttonsRes] = await Promise.all([
          axios.get(`${API}/chat-widget`),
          axios.get(`${API}/chat/buttons`)
        ]);
        setChatConfig(configRes.data);
        setChatButtons(buttonsRes.data);
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await axios.post(`${API}/chat/messages`, messageForm);
      toast.success('Nachricht gesendet! Wir antworten Ihnen per E-Mail.');
      setMessageForm({
        visitor_name: '',
        visitor_email: '',
        message: ''
      });
      setShowMessageForm(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fehler beim Senden der Nachricht');
    } finally {
      setSending(false);
    }
  };

  const handleButtonAction = (button) => {
    switch (button.action) {
      case 'email':
        window.location.href = `mailto:${button.value}`;
        break;
      case 'phone':
        window.location.href = `tel:${button.value}`;
        break;
      case 'link':
        window.open(button.value, '_blank');
        break;
      case 'message':
        setMessageForm(prev => ({ ...prev, message: button.value }));
        setShowMessageForm(true);
        break;
      default:
        break;
    }
  };

  if (loading || !chatConfig.enabled) {
    return null;
  }

  const positionClasses = chatConfig.position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4';

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white
          ${chatConfig.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 
            chatConfig.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
            'bg-slate-600 hover:bg-slate-700'}
          transition-all duration-200 hover:scale-110
        `}
      >
        {isOpen ? (
          <User className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
          {/* Chat Header */}
          <div className={`
            p-4 text-white
            ${chatConfig.color === 'blue' ? 'bg-blue-600' : 
              chatConfig.color === 'green' ? 'bg-green-600' :
              'bg-slate-600'}
          `}>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{chatConfig.title || 'Hilfe & Support'}</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowMessageForm(false);
                }}
                className="text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {!showMessageForm ? (
              <>
                <div className="bg-slate-100 rounded-lg p-3">
                  <p className="text-sm text-slate-700">
                    {chatConfig.welcome_message || 'Hallo! Wie können wir Ihnen helfen?'}
                  </p>
                </div>

                {/* Dynamic Chat Buttons */}
                <div className="space-y-2">
                  {chatButtons.map((button) => (
                    <Button
                      key={button.id}
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleButtonAction(button)}
                    >
                      {button.action === 'email' && <Mail className="mr-2 h-4 w-4" />}
                      {button.action === 'phone' && <Phone className="mr-2 h-4 w-4" />}
                      {button.action === 'link' && <Eye className="mr-2 h-4 w-4" />}
                      {button.action === 'message' && <MessageSquare className="mr-2 h-4 w-4" />}
                      {button.label}
                    </Button>
                  ))}
                  
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setShowMessageForm(true)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Nachricht schreiben
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Kontakt</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span>{chatConfig.contact_email}</span>
                    </div>
                    
                    {chatConfig.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span>{chatConfig.phone_number}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>{chatConfig.operating_hours}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Message Form */
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <Label htmlFor="visitor_name">Ihr Name *</Label>
                  <Input
                    id="visitor_name"
                    value={messageForm.visitor_name}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, visitor_name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="visitor_email">Ihre E-Mail *</Label>
                  <Input
                    id="visitor_email"
                    type="email"
                    value={messageForm.visitor_email}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, visitor_email: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Nachricht *</Label>
                  <Textarea
                    id="message"
                    value={messageForm.message}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    placeholder="Ihre Nachricht..."
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={sending}
                    className="flex-1"
                  >
                    {sending ? 'Senden...' : 'Senden'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMessageForm(false)}
                  >
                    Zurück
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const OnlineReportForm = () => {
  const [formData, setFormData] = useState({
    incident_type: '',
    description: '',
    location: '',
    incident_date: '',
    incident_time: '',
    reporter_name: '',
    reporter_email: '',
    reporter_phone: '',
    is_witness: false,
    witnesses_present: false,
    witness_details: '',
    evidence_available: false,
    evidence_description: '',
    additional_info: ''
  });
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadIncidentTypes = async () => {
      try {
        const response = await axios.get(`${API}/reports/types`);
        setIncidentTypes(response.data.incident_types);
      } catch (error) {
        console.error('Error loading incident types:', error);
      }
    };
    loadIncidentTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/reports`, formData);
      toast.success('Online-Meldung erfolgreich eingereicht! Wir werden uns zeitnah bei Ihnen melden.');
      setFormData({
        incident_type: '',
        description: '',
        location: '',
        incident_date: '',
        incident_time: '',
        reporter_name: '',
        reporter_email: '',
        reporter_phone: '',
        is_witness: false,
        witnesses_present: false,
        witness_details: '',
        evidence_available: false,
        evidence_description: '',
        additional_info: ''
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Fehler beim Einreichen der Meldung');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Online-Meldung</h2>
          <p className="text-xl text-slate-600">Erstatten Sie eine Meldung online</p>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="flex items-center justify-center text-blue-800">
              <AlertCircle className="mr-2 h-5 w-5" />
              <strong>Bei Notfällen wählen Sie sofort die 110!</strong>
            </p>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Online-Meldung einreichen
            </CardTitle>
            <CardDescription>
              Bitte füllen Sie alle Felder sorgfältig aus. Ihre Angaben helfen uns bei der Bearbeitung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Incident Details */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Was ist passiert?
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="incident_type">Art des Vorfalls *</Label>
                    <Select 
                      value={formData.incident_type}
                      onValueChange={(value) => handleInputChange('incident_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vorfall auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Wo ist es passiert? *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Straße, Hausnummer, PLZ Ort"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div>
                    <Label htmlFor="incident_date">Wann ist es passiert? (Datum) *</Label>
                    <Input
                      id="incident_date"
                      type="date"
                      value={formData.incident_date}
                      onChange={(e) => handleInputChange('incident_date', e.target.value)}
                      max={today}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="incident_time">Uhrzeit (ca.) *</Label>
                    <Input
                      id="incident_time"
                      type="time"
                      value={formData.incident_time}
                      onChange={(e) => handleInputChange('incident_time', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="description">Beschreibung des Vorfalls *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    placeholder="Beschreiben Sie detailliert, was passiert ist..."
                    required
                  />
                </div>
              </div>

              {/* Reporter Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Ihre Kontaktdaten
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="reporter_name">Ihr Name *</Label>
                    <Input
                      id="reporter_name"
                      value={formData.reporter_name}
                      onChange={(e) => handleInputChange('reporter_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reporter_email">Ihre E-Mail-Adresse *</Label>
                    <Input
                      id="reporter_email"
                      type="email"
                      value={formData.reporter_email}
                      onChange={(e) => handleInputChange('reporter_email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div>
                    <Label htmlFor="reporter_phone">Ihre Telefonnummer *</Label>
                    <Input
                      id="reporter_phone"
                      value={formData.reporter_phone}
                      onChange={(e) => handleInputChange('reporter_phone', e.target.value)}
                      placeholder="+49 123 456789"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_witness"
                      checked={formData.is_witness}
                      onChange={(e) => handleInputChange('is_witness', e.target.checked)}
                    />
                    <Label htmlFor="is_witness">Ich war Zeuge des Vorfalls</Label>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Weitere Details
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="witnesses_present"
                      checked={formData.witnesses_present}
                      onChange={(e) => handleInputChange('witnesses_present', e.target.checked)}
                    />
                    <Label htmlFor="witnesses_present">Es waren weitere Zeugen anwesend</Label>
                  </div>

                  {formData.witnesses_present && (
                    <div>
                      <Label htmlFor="witness_details">Details zu den Zeugen</Label>
                      <Textarea
                        id="witness_details"
                        value={formData.witness_details}
                        onChange={(e) => handleInputChange('witness_details', e.target.value)}
                        rows={2}
                        placeholder="Namen, Kontaktdaten oder Beschreibung der Zeugen..."
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="evidence_available"
                      checked={formData.evidence_available}
                      onChange={(e) => handleInputChange('evidence_available', e.target.checked)}
                    />
                    <Label htmlFor="evidence_available">Ich habe Beweise (Fotos, Videos, Dokumente)</Label>
                  </div>

                  {formData.evidence_available && (
                    <div>
                      <Label htmlFor="evidence_description">Beschreibung der Beweise</Label>
                      <Textarea
                        id="evidence_description"
                        value={formData.evidence_description}
                        onChange={(e) => handleInputChange('evidence_description', e.target.value)}
                        rows={2}
                        placeholder="Beschreiben Sie Ihre Beweise. Diese können Sie später nachreichen."
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="additional_info">Zusätzliche Informationen</Label>
                    <Textarea
                      id="additional_info"
                      value={formData.additional_info}
                      onChange={(e) => handleInputChange('additional_info', e.target.value)}
                      rows={3}
                      placeholder="Weitere wichtige Informationen zum Vorfall..."
                    />
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Hinweis:</strong> Mit dem Absenden dieser Meldung bestätigen Sie, dass alle Angaben nach bestem Wissen und Gewissen gemacht wurden. 
                  Falsche Angaben können rechtliche Konsequenzen haben.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Meldung wird eingereicht...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Online-Meldung einreichen
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

const ContactSection = ({ setActiveSection }) => {
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
                <FileText className="h-5 w-5 text-blue-600" />
                Online-Meldung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-3">
                Erstatten Sie eine Meldung online
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setActiveSection('report')}
              >
                Online-Meldung erstatten
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
        return <HeroSection setActiveSection={setActiveSection} />;
      case 'news':
        return <NewsSection />;
      case 'about':
        return <AboutSection />;
      case 'report':
        return <OnlineReportForm />;
      case 'apply':
        return <ApplicationForm />;
      case 'feedback':
        return <FeedbackForm />;
      case 'contact':
        return <ContactSection setActiveSection={setActiveSection} />;
      default:
        return <HeroSection setActiveSection={setActiveSection} />;
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
        <ChatWidget />
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;