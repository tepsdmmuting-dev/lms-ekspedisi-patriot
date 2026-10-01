import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-800 transition-colors duration-500 relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 z-0">
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Decorative Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-yellow-400/10 rounded-full blur-3xl -z-10 transition-colors duration-1000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 dark:bg-white/5 rounded-full blur-3xl -z-10 transition-colors duration-1000"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <h2 className="mt-6 font-display-md text-primary dark:text-white tracking-tight transition-colors duration-500">Portal <span className="text-secondary dark:text-yellow-400 transition-colors duration-500">Belajar</span></h2>
        <p className="mt-2 text-base text-on-surface-variant dark:text-slate-400 font-bold tracking-wide uppercase transition-colors duration-500">Ekspedisi Patriot LMS</p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-md relative z-10">
        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-8 px-6 rounded-2xl sm:px-10 transition-colors duration-500">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block font-medium text-sm text-on-surface dark:text-slate-200 mb-2 transition-colors duration-500">Alamat Email</label>
              <div>
                <input
                  type="email"
                  required
                  placeholder="admin@ep.gov.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700 shadow-inner rounded-xl focus:ring-4 focus:ring-primary-fixed/60 dark:focus:ring-blue-400/30 focus:border-primary-fixed dark:focus:border-blue-400 focus:bg-white/90 dark:focus:bg-slate-800 outline-none transition-all appearance-none placeholder-outline-variant/60 dark:placeholder-slate-500 font-medium text-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-sm text-on-surface dark:text-slate-200 mb-2 transition-colors duration-500">Kata Sandi</label>
              <div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700 shadow-inner rounded-xl focus:ring-4 focus:ring-primary-fixed/60 dark:focus:ring-blue-400/30 focus:border-primary-fixed dark:focus:border-blue-400 focus:bg-white/90 dark:focus:bg-slate-800 outline-none transition-all appearance-none placeholder-outline-variant/60 dark:placeholder-slate-500 font-medium text-slate-700 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="text-error bg-error-container/50 border border-error/20 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 bg-primary dark:bg-yellow-500 text-on-primary dark:text-white rounded-full shadow-sm hover:bg-[#003857] dark:hover:bg-yellow-600 hover:shadow-md font-bold text-sm transition-all hover-lift active:scale-95"
              >
                Masuk ke Dashboard
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant/20 dark:border-slate-700 text-center transition-colors duration-500">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Belum punya akun atau lupa password?
            </p>
            <a
              href="https://wa.me/6285190918643?text=Halo%20Admin%2C%20saya%20mau%20belajar%20di%20LMS%20SDM%20Muting.%20Tolong%20bantu%20bikinin%20akun%20atau%20reset%20password%20saya%20ya."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 dark:bg-[#25D366]/20 dark:hover:bg-[#25D366]/30 dark:text-[#42E67F] font-bold rounded-xl transition-all w-full sm:w-auto"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
