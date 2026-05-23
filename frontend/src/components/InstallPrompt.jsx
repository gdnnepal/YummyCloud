import { useState, useEffect } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';

function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 3 * 24 * 60 * 60 * 1000) return;

    // Check if already in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS Safari (no beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  if (!showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[100] px-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <span className="text-2xl">🍽️</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-800">Install CloudKitchen</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isIOS
                ? 'Tap the share button, then "Add to Home Screen"'
                : 'Install our app for a better experience'}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
          >
            <HiOutlineXMark className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="flex-1 bg-primary text-white py-2.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform"
            >
              Install App
            </button>
          )}
          {isIOS && (
            <div className="flex-1 bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600">
              <p>Tap <span className="inline-block">⬆️</span> Share → <strong>Add to Home Screen</strong></p>
            </div>
          )}
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-lg text-xs font-medium text-gray-500 bg-gray-100"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
