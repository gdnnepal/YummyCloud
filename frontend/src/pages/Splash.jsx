import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center max-w-lg mx-auto">
      {/* Logo */}
      <div className="animate-bounce-slow">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-12.75H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z" /></svg>
        </div>
      </div>

      {/* App Name */}
      <h1 className="text-3xl font-bold text-white mt-6">t('app_name')</h1>
      <p className="text-sm text-white/70 mt-2">Delicious food, delivered fast</p>

      {/* Loading indicator */}
      <div className="mt-12 flex gap-1.5">
        <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
        <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}

export default Splash;
