import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import UserManagement from '../components/UserManagement';
import QuizBuilder from '../components/QuizBuilder';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import CloudinaryUpload from '../components/CloudinaryUpload';
import SiteSettings from '../components/SiteSettings';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalActiveLinks: 0, retentionRate: 0, regions: [] });
  const [modules, setModules] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quizModule, setQuizModule] = useState(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', media_platform: 'youtube', external_url: '', category: 'Materi Publik', topic: '', visibility: 'public', image_url: '', image_source: ''
  });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/modules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/modules/topics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setAllTopics(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchModules();
    fetchTopics();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editId ? `/api/modules/${editId}` : '/api/modules';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert(editId ? "Module updated successfully!" : "Module added successfully!");
        setShowForm(false);
        // Refresh modules, stats, and topics
        const token = localStorage.getItem('token');
        const resStats = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resStats.ok) setStats(await resStats.json());
        const resMods = await fetch('/api/modules', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resMods.ok) setModules(await resMods.json());
        const resTopics = await fetch('/api/modules/topics', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resTopics.ok) setAllTopics(await resTopics.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/modules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setModules(modules.filter(m => m.id !== id));
        const resStats = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resStats.ok) setStats(await resStats.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVisibility = async (mod) => {
    const newVisibility = mod.visibility === 'public' ? 'restricted' : 'public';
    try {
      const token = localStorage.getItem('token');
      const payload = { ...mod, visibility: newVisibility };
      
      const res = await fetch(`/api/modules/${mod.id}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setModules(modules.map(m => m.id === mod.id ? { ...m, visibility: newVisibility } : m));
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to update visibility");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating visibility");
    }
  };

  const openFormForAdd = () => {
    setEditId(null);
    setFormData({ title: '', description: '', media_platform: 'youtube', external_url: '', category: 'Materi Publik', topic: '', visibility: 'public', image_url: '', image_source: '' });
    setShowForm(true);
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowForm(false);
      }
    };
    if (showForm) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showForm]);

  const openFormForEdit = (mod) => {
    setEditId(mod.id);
    setFormData({
      title: mod.title,
      description: mod.description || '',
      media_platform: mod.media_platform,
      external_url: mod.external_url,
      category: mod.category || 'Materi Publik',
      topic: mod.topic || '',
      visibility: mod.visibility,
      image_url: mod.image_url || '',
      image_source: mod.image_source || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#f8f9fa] dark:bg-slate-800 text-slate-800 dark:text-slate-300 transition-colors duration-500 font-body-md min-h-screen relative overflow-x-hidden z-0">
      
      {/* Global Glassmorphism Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Light Mode Orbs */}
        <div className="dark:hidden absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(0,74,116,0.15) 0%, rgba(0,74,116,0) 100%)' }}></div>
        <div className="dark:hidden absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(244,199,36,0.15) 0%, rgba(244,199,36,0) 100%)' }}></div>
        <div className="dark:hidden absolute top-[30%] left-[50%] w-[50%] h-[50%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(96,165,250,0.08) 0%, rgba(96,165,250,0) 100%)' }}></div>
        {/* Dark Mode Orbs */}
        <div className="hidden dark:block absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(250,204,21,0.15) 0%, rgba(250,204,21,0) 100%)' }}></div>
        <div className="hidden dark:block absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }}></div>
        <div className="hidden dark:block absolute top-[30%] left-[50%] w-[50%] h-[50%] rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(250,204,21,0.05) 0%, rgba(250,204,21,0) 100%)' }}></div>
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/60 dark:border-slate-800/60 shadow-sm z-40 flex items-center justify-between px-4 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm font-bold text-primary dark:text-white">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-primary dark:text-white p-2">
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SideNavBar */}
      <nav className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-white/95 dark:bg-slate-900/95 lg:bg-white/60 lg:dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/50 dark:border-slate-800/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transition-all duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary dark:text-white transition-colors duration-500">Portal <span className="text-secondary dark:text-yellow-400">Belajar</span></h2>
            <p className="font-body-md text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400 mt-1 transition-colors duration-500">Admin Dashboard</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-on-surface-variant dark:text-slate-400 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1.5">
          <li>
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition-all ${
                activeTab === 'dashboard' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'dashboard' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>space_dashboard</span> Dashboard
            </button>
          </li>
          <li>
            <button 
              onClick={() => { setActiveTab('manage_modules'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition-all ${
                activeTab === 'manage_modules' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'manage_modules' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>view_kanban</span> Manajemen Modul
            </button>
          </li>
          <li>
            <button 
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition-all ${
                activeTab === 'users' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'users' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>groups</span> Manajemen User
            </button>
          </li>
          <li>
            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-label-lg text-label-lg transition-all ${
                activeTab === 'settings' ? 'bg-[#004A74]/10 dark:bg-blue-900/30 text-[#004A74] dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activeTab === 'settings' ? '[font-variation-settings:\\\'FILL\\\'_1]' : ''}`}>palette</span> Pengaturan Tampilan
            </button>
          </li>
        </ul>
        <div className="p-4 border-t border-outline-variant/30 dark:border-slate-700/50 flex flex-col gap-2">
          <div className="hidden lg:flex justify-end px-2 mb-2">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-2 mb-2">
             <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-[#004A74] shadow-sm flex items-center justify-center text-white font-bold text-lg">
               {user?.name?.charAt(0) || 'A'}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold text-primary dark:text-white truncate transition-colors duration-500">{user?.name || 'Administrator'}</p>
               <p className="text-xs text-on-surface-variant dark:text-slate-400 truncate transition-colors duration-500">Admin Panel</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-4 text-error dark:text-red-400 px-4 py-3.5 hover:bg-error-container/50 dark:hover:bg-red-900/30 transition-all font-label-lg text-label-lg font-medium rounded-xl w-full text-left">
            <span className="material-symbols-outlined text-[22px]">logout</span> Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-margin-mobile md:p-margin-desktop min-h-screen pt-24 md:pt-24 lg:pt-margin-desktop relative z-10">
        <div className="max-w-container-max mx-auto">
          <header className="mb-8 lg:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="font-headline-xl text-headline-xl text-primary dark:text-white mb-2 transition-colors duration-500">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'manage_modules' && 'Manajemen Modul'}
                {activeTab === 'users' && 'Manajemen User'}
                {activeTab === 'settings' && 'Pengaturan Tampilan'}
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-400 transition-colors duration-500">
                {activeTab === 'dashboard' && 'Ringkasan metrik dan performa LMS Ekspedisi Patriot.'}
                {activeTab === 'manage_modules' && 'Kelola materi publik, tautan eksternal, dan visibilitas.'}
                {activeTab === 'users' && 'Kelola Trainee, Co-Admin, dan penugasan topik belajar.'}
                {activeTab === 'settings' && 'Kelola tampilan halaman utama seperti Hero Image dan teks.'}
              </p>
            </div>
            {activeTab === 'manage_modules' && (
              <button 
                onClick={openFormForAdd}
                className="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-full font-bold hover-lift transition-all flex items-center justify-center gap-2 shadow-sm w-[200px]">
                <span className="material-symbols-outlined">add</span> New Link
              </button>
            )}
            {activeTab === 'users' && (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openAddUserModal'))}
                className="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-full font-bold hover-lift transition-all flex items-center justify-center gap-2 shadow-sm w-[200px]">
                <span className="material-symbols-outlined">person_add</span> Tambah User
              </button>
            )}
          </header>

          {quizModule && <QuizBuilder module={quizModule} onClose={() => { setQuizModule(null); fetchModules(); }} />}

          {showForm && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-md overflow-y-auto transition-colors duration-500">
              <section className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-white dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] rounded-2xl p-8 shadow-2xl relative w-full max-w-2xl my-auto transition-colors duration-500">
                <h2 className="font-headline-md text-primary dark:text-white mb-6 transition-colors duration-500">{editId ? 'Edit Module' : 'Add New Module'}</h2>
                <form onSubmit={handleAddModule} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Title</label>
                            <input required type="text" placeholder="Masukkan judul materi" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Topic / Mata Pelajaran</label>
                            <div className="flex gap-2">
                              <select
                                value={allTopics.includes(formData.topic) ? formData.topic : (formData.topic ? '__custom__' : '')}
                                onChange={e => {
                                  if (e.target.value === '__custom__') return;
                                  setFormData({...formData, topic: e.target.value});
                                }}
                                className="flex-1 px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-white/50 dark:border-slate-700/50 shadow-inner text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none"
                              >
                                <option value="" disabled hidden>Pilih Topik...</option>
                                {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
                                <option value="__custom__">+ Tambah Topik Baru...</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={formData.topic}
                              onChange={e => setFormData({...formData, topic: e.target.value})}
                              className="w-full mt-3 px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all"
                              placeholder="Ketik nama topik baru atau edit topik yang dipilih"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Category (Layout)</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none">
                                <option value="Materi Publik">Materi Publik</option>
                                <option value="Kisah Inspiratif">Kisah Inspiratif</option>
                                <option value="Pelatihan">Pelatihan (Modul)</option>
                                <option value="Jadwal">Jadwal</option>
                                <option value="Dokumen Resmi">Dokumen Resmi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">External URL</label>
                            <input required type="url" value={formData.external_url} onChange={e => setFormData({...formData, external_url: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" placeholder="https://..." />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Cover Image URL (Optional)</label>
                            <div className="flex gap-2 w-full">
                              <input type="url" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="flex-1 w-full min-w-0 px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" placeholder="https://..." />
                              <div className="shrink-0">
                                <CloudinaryUpload onUploadSuccess={(url) => setFormData({...formData, image_url: url})} buttonText="Unggah" />
                              </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Sumber Foto / Kredit</label>
                            <input type="text" value={formData.image_source || ''} onChange={e => setFormData({...formData, image_source: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all" placeholder="Misal: Pexels / Budi" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Media Platform</label>
                            <select value={formData.media_platform} onChange={e => setFormData({...formData, media_platform: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none">
                                <option value="youtube">YouTube</option>
                                <option value="tiktok">TikTok</option>
                                <option value="instagram">Instagram</option>
                                <option value="gdrive_pdf">Google Drive (PDF)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Visibility</label>
                            <select value={formData.visibility} onChange={e => setFormData({...formData, visibility: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all appearance-none">
                                <option value="public">Public</option>
                                <option value="restricted">Restricted (Trainees only)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-label-sm font-medium mb-1 dark:text-slate-300">Description</label>
                        <textarea rows={3} placeholder="Tuliskan deskripsi singkat..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-400 dark:focus:border-blue-400 outline-none transition-all"></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-outline-variant/50 dark:border-slate-700/50">
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-outline-variant dark:border-slate-600 rounded-full text-on-surface-variant dark:text-slate-300 font-bold hover:bg-surface-container-low dark:hover:bg-slate-700/50 transition-colors">Batal</button>
                      <button type="submit" className="bg-primary dark:bg-yellow-500 text-on-primary dark:text-slate-900 px-6 py-2.5 rounded-full font-bold hover:bg-primary/90 dark:hover:bg-yellow-400 transition-colors shadow-sm">
                        {editId ? 'Update Module' : 'Save Module'}
                      </button>
                    </div>
                </form>
              </section>
            </div>,
            document.body
          )}

          {activeTab === 'users' && (
            <UserManagement currentUserRole={user.role} />
          )}

          {activeTab === 'settings' && (
            <SiteSettings />
          )}

          {activeTab === 'dashboard' && (
          <div className="space-y-12">
            {/* Stats Overview */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* Total Active Links */}
              <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl p-6 hover:shadow-[0_10px_20px_-3px_rgba(0,33,71,0.08)] transition-all flex flex-col justify-between duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#004A74]/10 dark:bg-[#004A74]/30 flex items-center justify-center text-[#004A74] dark:text-blue-400 shadow-sm transition-colors duration-500">
                    <span className="material-symbols-outlined">link</span>
                  </div>
                  <p className="font-label-lg text-label-lg text-on-surface-variant dark:text-slate-400 font-medium transition-colors duration-500">Total Active Links</p>
                </div>
                <h3 className="text-5xl font-extrabold text-primary dark:text-white tracking-tight transition-colors duration-500">{stats.totalActiveLinks}</h3>
              </div>

              {/* Trainee Retention Rate */}
              <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl p-6 hover:shadow-[0_10px_20px_-3px_rgba(0,33,71,0.08)] transition-all flex flex-col justify-between duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 shadow-sm transition-colors duration-500">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <p className="font-label-lg text-label-lg text-on-surface-variant dark:text-slate-400 font-medium transition-colors duration-500">Trainee Retention Rate</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-extrabold text-secondary dark:text-yellow-400 tracking-tight transition-colors duration-500">{stats.retentionRate}</h3>
                  <span className="text-2xl font-bold text-secondary/70 dark:text-yellow-400/70 transition-colors duration-500">%</span>
                </div>
              </div>
            </section>

            {/* Regional Distribution */}
            <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl overflow-hidden hover:shadow-[0_10px_20px_-3px_rgba(0,33,71,0.08)] transition-all duration-500">
              <div className="flex flex-col md:flex-row min-h-[300px]">
                {/* Left Side (Content) */}
                <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm transition-colors duration-500">
                      <span className="material-symbols-outlined">map</span>
                    </div>
                    <p className="font-label-lg text-label-lg text-on-surface-variant dark:text-slate-400 font-medium transition-colors duration-500">Regional Trainee Distribution</p>
                  </div>
                  <div className="flex items-baseline gap-3 mb-8">
                    <span className="text-5xl font-extrabold text-slate-900 dark:text-white transition-colors duration-500">{stats.regions.length}</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-300 transition-colors duration-500">Provinces</span>
                  </div>
                  
                  <ul className="space-y-4 max-w-md">
                    {stats.regions.map((r, i) => {
                      const colors = ['bg-slate-900', 'bg-yellow-400', 'bg-slate-400', 'bg-blue-500', 'bg-green-500'];
                      const dotColor = colors[i % colors.length];
                      return (
                        <li key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
                            <span className="text-base text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{r.name}</span>
                          </div>
                          <span className="text-base font-bold text-slate-900 dark:text-white transition-colors">{r.count}</span>
                        </li>
                      );
                    })}
                    {stats.regions.length === 0 && <li className="text-slate-500">No data available</li>}
                  </ul>
                </div>

                {/* Right Side (Abstract Graphic) */}
                <div className="hidden md:block w-1/3 lg:w-2/5 bg-[#004A74]">
                </div>
              </div>
            </section>
          </div>
          )}

          {activeTab === 'manage_modules' && (
          <div className="space-y-12">
            {/* Manage Modules Section */}
            <section className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl overflow-hidden hover:shadow-[0_10px_15px_-3px_rgba(0,33,71,0.05)] transition-all duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/40 dark:bg-slate-900/40 border-b border-white/50 dark:border-slate-700/50 backdrop-blur-lg whitespace-nowrap transition-colors duration-500">
                    <tr>
                      <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400">Judul & Tautan</th>
                      <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 text-center hidden md:table-cell">Kategori</th>
                      <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 hidden md:table-cell">Topik</th>
                      <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 hidden md:table-cell">Platform</th>
                      <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 text-center">Visibilitas</th>
                      <th className="py-3 px-2 sm:px-4 font-label-lg text-on-surface-variant dark:text-slate-400 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(mod => (
                      <tr key={mod.id} className="border-b border-surface-container-high dark:border-slate-700/50 hover:bg-surface-container-low/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-2 sm:px-4">
                          <div className="font-medium text-primary dark:text-white mb-1 whitespace-normal break-words min-w-[100px] text-sm sm:text-base cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => openFormForEdit(mod)}>{mod.title}</div>
                          <div className="text-[10px] sm:text-xs text-on-surface-variant dark:text-slate-400 max-w-[120px] md:max-w-[200px] truncate hidden md:block" title={mod.external_url}>{mod.external_url}</div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 hidden md:table-cell text-center">
                          {(() => {
                            let bg = 'bg-green-100', text = 'text-green-700';
                            if (mod.category === 'Dokumen Resmi') { bg = 'bg-blue-100'; text = 'text-blue-700'; }
                            if (mod.category === 'Jadwal') { bg = 'bg-yellow-100'; text = 'text-yellow-700'; }
                            if (mod.category === 'Pelatihan') { bg = 'bg-purple-100'; text = 'text-purple-700'; }
                            if (mod.category === 'Kisah Inspiratif') { bg = 'bg-orange-100'; text = 'text-orange-700'; }
                            return <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap inline-block ${bg} ${text}`}>{mod.category}</span>;
                          })()}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-sm text-on-surface-variant dark:text-slate-300 hidden md:table-cell">{mod.topic || '-'}</td>
                        <td className="py-3 px-2 sm:px-4 uppercase text-sm font-medium text-on-surface-variant dark:text-slate-300 hidden md:table-cell">{mod.media_platform}</td>
                        <td className="py-3 px-2 sm:px-4">
                          <div 
                            className="flex items-center justify-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleToggleVisibility(mod)}
                          >
                            <div className={`shrink-0 w-9 h-5 rounded-full relative transition-colors ${mod.visibility === 'public' ? 'bg-[#0F172A] dark:bg-blue-500' : 'bg-outline-variant/30 dark:bg-slate-600'}`}>
                              <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all duration-300 ${mod.visibility === 'public' ? 'left-[18px]' : 'left-[4px]'}`}></div>
                            </div>
                            <span className="text-xs font-medium text-on-surface-variant dark:text-slate-300 select-none whitespace-nowrap hidden md:inline">
                              {mod.visibility === 'public' ? 'Public Dashboard' : 'LMS Dashboard'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-right align-middle">
                          <div className="flex justify-end gap-1 whitespace-nowrap">
                          <button onClick={() => setQuizModule(mod)} className="relative text-tertiary dark:text-blue-400 hover:bg-tertiary dark:hover:bg-blue-400/20 hover:text-on-tertiary p-1 sm:p-2 rounded-full transition-colors" title="Manage Quizzes">
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">fact_check</span>
                            {(mod.has_pre_test || mod.has_post_test) && (
                              <span className="absolute top-[2px] right-[2px] w-2 h-2 bg-green-500 rounded-full ring-[1.5px] ring-white dark:ring-slate-800"></span>
                            )}
                          </button>
                          <button onClick={() => openFormForEdit(mod)} className="text-secondary dark:text-yellow-400 hover:bg-secondary-container dark:hover:bg-yellow-400/20 p-1 sm:p-2 rounded-full transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">edit</span>
                          </button>
                          {user.role === 'admin' && (
                            <button onClick={() => handleDeleteModule(mod.id)} className="text-error dark:text-red-400 hover:bg-error-container dark:hover:bg-red-400/20 p-1 sm:p-2 rounded-full transition-colors" title="Delete">
                              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">delete</span>
                            </button>
                          )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {modules.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-on-surface-variant dark:text-slate-400">Belum ada Modul</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
