// Webpushr push notification utility
// The Webpushr SDK is loaded via index.html script tag

export function initOneSignal() {
  // Webpushr auto-initializes via the script in index.html
  // No additional init needed
}

export function setOneSignalExternalUserId(userId) {
  // Set Webpushr subscriber attribute (user_id) for targeted notifications
  if (typeof window.webpushr !== 'undefined') {
    window.webpushr('set_attribute', { 'user_id': String(userId) });
  }
}

export function removeOneSignalExternalUserId() {
  // Clear Webpushr subscriber attribute on logout
  if (typeof window.webpushr !== 'undefined') {
    window.webpushr('set_attribute', { 'user_id': '' });
  }
}
