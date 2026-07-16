import React, { useState, useEffect } from 'react';
import CloudinaryUpload from './CloudinaryUpload';

const SiteSettings = () => {
  const [settings, setSettings] = useState({
    hero_image_url: '',
    hero_title: '',
    hero_subtitle: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        alert("Pengaturan berhasil disimpan!");
      } else {
        alert("Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary dark:border-white/10 dark:border-t-white"></div>
    </div>
  );

  return (
    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-6 md:p-10">
      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Teks Konfigurasi */}
            <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold tracking-wide uppercase text-primary/80 dark:text-slate-400 mb-3">Judul Utama Halaman</label>
                  <input 
                    type="text" 
                    value={settings.hero_title || ''} 
                    onChange={e => setSettings({...settings, hero_title: e.target.value})} 
                    className="w-full px-5 py-4 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 shadow-inner text-slate-800 dark:text-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-500 transition-all font-medium text-lg placeholder-slate-400"
                    placeholder="Contoh: Membangun Masa Depan..."
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 font-medium">Mendukung penggunaan enter untuk baris baru (newline).</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold tracking-wide uppercase text-primary/80 dark:text-slate-400 mb-3">Subjudul Paragraf</label>
                  <textarea 
                    rows={5}
                    value={settings.hero_subtitle || ''} 
                    onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} 
                    className="w-full px-5 py-4 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 shadow-inner text-slate-800 dark:text-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-500 transition-all resize-none font-medium placeholder-slate-400 leading-relaxed"
                    placeholder="Contoh: Ekspedisi Patriot bertujuan untuk..."
                  />
                </div>
            </div>
            
            {/* Media Konfigurasi */}
            <div className="space-y-4">
                <label className="block text-sm font-bold tracking-wide uppercase text-primary/80 dark:text-slate-400 mb-1">Gambar Utama (Hero Image)</label>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <input 
                    type="url" 
                    value={settings.hero_image_url || ''} 
                    onChange={e => setSettings({...settings, hero_image_url: e.target.value})} 
                    className="flex-1 w-full min-w-0 px-4 py-3.5 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 shadow-inner text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium placeholder-slate-400"
                    placeholder="Tautan URL gambar..."
                  />
                  <div className="shrink-0 flex sm:block">
                    <CloudinaryUpload 
                      onUploadSuccess={(url) => setSettings({...settings, hero_image_url: url})} 
                      buttonText="Upload Gambar"
                    />
                  </div>
                </div>

                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-center mt-4 group">
                  {settings.hero_image_url ? (
                    <>
                      <img src={settings.hero_image_url} alt="Hero Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">visibility</span> Preview
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-600 transition-colors">
                      <span className="material-symbols-outlined text-6xl drop-shadow-sm">add_photo_alternate</span>
                      <span className="text-sm font-bold tracking-wide">Belum Ada Gambar</span>
                    </div>
                  )}
                </div>
            </div>
        </div>

        <div className="pt-8 mt-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-green-500">cloud_done</span> Perubahan akan langsung tampil di publik.
          </p>
          <button type="submit" className="bg-primary dark:bg-yellow-400 text-white dark:text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-primary/90 dark:hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 w-full md:w-auto flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[22px] filled">save</span>
            Terapkan Konfigurasi
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiteSettings;
