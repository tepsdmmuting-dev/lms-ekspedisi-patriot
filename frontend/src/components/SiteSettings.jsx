import React, { useState, useEffect } from 'react';
import CloudinaryUpload from './CloudinaryUpload';
import { TOPICS_LIST } from '../constants/topics';

const SiteSettings = () => {
  const [settings, setSettings] = useState({
    hero_image_url: '',
    hero_title: '',
    hero_subtitle: ''
  });
  const [activeSubTab, setActiveSubTab] = useState('hero'); // 'hero' | 'topics'
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'success' | 'error' | null

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
    setSaveStatus('saving');
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
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus('error');
        alert("Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      alert("Terjadi kesalahan koneksi.");
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary dark:border-white/10 dark:border-t-white"></div>
    </div>
  );

  return (
    <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-6 md:p-10">
      {/* Sub-Navigasi Tab: Hero vs Foto Topik */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit mb-8 border border-slate-200/80 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveSubTab('hero')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'hero'
              ? 'bg-white dark:bg-slate-900 text-[#004A74] dark:text-[#D4B856] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">featured_play_list</span>
          <span>Hero Banner Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('topics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeSubTab === 'topics'
              ? 'bg-white dark:bg-slate-900 text-[#004A74] dark:text-[#D4B856] shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">photo_library</span>
          <span>Foto Kartu Topik Belajar</span>
          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-[#004A74]/10 dark:bg-yellow-400/10 text-[#004A74] dark:text-yellow-400">
            {TOPICS_LIST.length} Topik
          </span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* ================= TAB 1: HERO BANNER BERANDA ================= */}
        {activeSubTab === 'hero' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-fadeIn">
            {/* Teks Konfigurasi */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold tracking-wide uppercase text-primary/80 dark:text-slate-400 mb-3">
                  Judul Utama Halaman
                </label>
                <input 
                  type="text" 
                  value={settings.hero_title || ''} 
                  onChange={e => setSettings({...settings, hero_title: e.target.value})} 
                  className="w-full px-5 py-4 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 shadow-inner text-slate-800 dark:text-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-500 transition-all font-medium text-lg placeholder-slate-400"
                  placeholder="Contoh: Ekspedisi Patriot SDM Unggul"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  Mendukung penggunaan enter untuk baris baru (newline).
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-bold tracking-wide uppercase text-primary/80 dark:text-slate-400 mb-3">
                  Subjudul Paragraf
                </label>
                <textarea 
                  rows={5}
                  value={settings.hero_subtitle || ''} 
                  onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} 
                  className="w-full px-5 py-4 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 shadow-inner text-slate-800 dark:text-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-blue-500 transition-all resize-none font-medium placeholder-slate-400 leading-relaxed"
                  placeholder="Contoh: Tong bersama membangun sumber daya manusia yang tangguh..."
                />
              </div>
            </div>
            
            {/* Media Konfigurasi */}
            <div className="space-y-4">
              <label className="block text-sm font-bold tracking-wide uppercase text-primary/80 dark:text-slate-400 mb-1">
                Gambar Utama (Hero Image)
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <input 
                  type="url" 
                  value={settings.hero_image_url || ''} 
                  onChange={e => setSettings({...settings, hero_image_url: e.target.value})} 
                  className="flex-1 w-full min-w-0 px-4 py-3.5 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl border border-white/80 dark:border-slate-700/50 shadow-inner text-slate-800 dark:text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium placeholder-slate-400 text-sm"
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
                      <span className="material-symbols-outlined text-[14px]">visibility</span> Preview Hero
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
        )}

        {/* ================= TAB 2: FOTO KARTU TOPIK BELAJAR ================= */}
        {activeSubTab === 'topics' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Info Banner */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-blue-900 dark:text-blue-200">
              <span className="material-symbols-outlined text-2xl text-[#004A74] dark:text-[#D4B856] shrink-0 mt-0.5">info</span>
              <div className="text-sm">
                <p className="font-bold">Kelola Foto Sampul untuk 6 Topik Pilihan Beranda</p>
                <p className="text-xs opacity-80 mt-0.5">
                  Foto yang kamu unggah di sini akan langsung menjadi background foto kartu materi di section "Mau Belajar Apa Hari Ini?". Jika dikosongkan, kartu akan otomatis menggunakan foto bawaan sistem.
                </p>
              </div>
            </div>

            {/* Grid Kartu Topik */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOPICS_LIST.map((topic) => {
                const settingKey = `topic_image_${topic.id}`;
                const currentImg = settings[settingKey] || topic.image;
                const isCustom = Boolean(settings[settingKey]);

                return (
                  <div 
                    key={topic.id}
                    className="p-5 rounded-2xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4 group"
                  >
                    {/* Header Topik */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#004A74]/10 dark:bg-yellow-400/10 text-[#004A74] dark:text-yellow-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">{topic.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-white truncate text-base leading-tight">
                            {topic.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {topic.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Badge Foto Kustom vs Bawaan */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isCustom
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {isCustom ? 'Foto Kustom' : 'Bawaan'}
                      </span>
                    </div>

                    {/* Preview Gambar Topik */}
                    <div className="relative rounded-xl overflow-hidden aspect-[16/9] border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                      <img 
                        src={currentImg} 
                        alt={topic.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-2 left-2 text-white text-xs font-bold drop-shadow">
                        {topic.name}
                      </div>
                    </div>

                    {/* Kontrol Upload & URL */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={settings[settingKey] || ''}
                          onChange={(e) => setSettings({ ...settings, [settingKey]: e.target.value })}
                          placeholder="Paste URL foto..."
                          className="flex-1 min-w-0 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-1 focus:ring-[#004A74] text-slate-800 dark:text-slate-200"
                        />
                        <div className="shrink-0">
                          <CloudinaryUpload
                            onUploadSuccess={(url) => setSettings(prev => ({ ...prev, [settingKey]: url }))}
                            buttonText="Ganti"
                          />
                        </div>
                      </div>

                      {/* Tombol Reset ke Foto Bawaan jika sedang memakai foto kustom */}
                      {isCustom && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const newSettings = { ...settings };
                              delete newSettings[settingKey];
                              // Set to empty string so PUT API knows to update/clear
                              newSettings[settingKey] = '';
                              setSettings(newSettings);
                            }}
                            className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">restart_alt</span>
                            <span>Kembalikan Foto Bawaan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Aksi Simpan */}
        <div className="pt-8 mt-4 border-t border-slate-200 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {saveStatus === 'success' ? (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-fadeIn">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Pengaturan berhasil disimpan dan langsung aktif di publik!
              </span>
            ) : (
              <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-green-500">cloud_done</span> 
                Perubahan akan langsung tampil di halaman publik setelah disimpan.
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={saveStatus === 'saving'}
            className="bg-primary dark:bg-yellow-400 text-white dark:text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-primary/90 dark:hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 w-full md:w-auto flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[22px] filled">
              {saveStatus === 'saving' ? 'sync' : 'save'}
            </span>
            <span>{saveStatus === 'saving' ? 'Menyimpan...' : 'Terapkan Konfigurasi'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiteSettings;
