// Webpushr push notification utility
// The Webpushr SDK is loaded via index.html script tag

export function initOneSignal() {
  // Webpushr auto-initializes via the script in index.html
}

export function setOneSignalExternalUserId(userId) {
  // Get Webpushr subscriber ID and send to backend
  if (typeof window.webpushr !== 'undefined') {
    window.webpushr('fetch_id', function(sid) {
      if (sid) {
        // Send sid to backend to associate with user
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        const token = authData?.state?.token;
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
  }
}

export function removeOneSignalExternalUserId() {
  // Nothing to clear on logout - sid stays with the browser
}
