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
          <span className="text-5xl">🍽️</span>
        </div>
      </div>

      {/* App Name */}
      <h1 className="text-3xl font-bold text-white mt-6">CloudKitchen</h1>
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
