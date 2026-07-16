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
            <p className="text-xs font-medium text-on-surface-variant dark:text-slate-400 mb-1 transition-colors duration-500">
              Admin: <span className="text-primary dark:text-blue-400 font-bold transition-colors duration-500">admin@ep.gov.id</span> / (any password)
            </p>
            <p className="text-xs font-medium text-on-surface-variant dark:text-slate-400 transition-colors duration-500">
              Trainee: <span className="text-primary dark:text-blue-400 font-bold transition-colors duration-500">budi@trainee.id</span> / (any password)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
