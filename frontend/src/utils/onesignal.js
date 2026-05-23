// Webpushr push notification utility
// The Webpushr SDK is loaded via index.html script tag

export function initOneSignal() {
  // Webpushr auto-initializes via the script in index.html
}

export function setOneSignalExternalUserId(userId) {
  // Get Webpushr subscriber ID and send to backend
  _sendSidToBackend();
}

export function removeOneSignalExternalUserId() {
  // Nothing to clear on logout - sid stays with the browser
}

// Try to fetch and save SID - called on login and on app load
export function syncWebpushrSid() {
  _sendSidToBackend();
}

function _sendSidToBackend() {
  // Wait for webpushr SDK to be ready
  const tryFetch = () => {
    if (typeof window.webpushr !== 'undefined') {
      window.webpushr('fetch_id', function(sid) {
        if (sid) {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          let token = null;
          try {
            const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
            token = authData?.state?.token;
          } catch {}
          if (token) {
            fetch(`${API_BASE_URL}/profile/push-token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ webpushr_sid: sid }),
            }).catch(() => {});
          }
        }
      });
    } else {
      // SDK not loaded yet, retry in 2 seconds
      setTimeout(tryFetch, 2000);
    }
  };
  setTimeout(tryFetch, 1500);
}
