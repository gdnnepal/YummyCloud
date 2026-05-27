const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export function initOneSignal() {
  if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'your-onesignal-app-id-here') {
    console.log('OneSignal: No app ID configured');
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(function (OneSignal) {
    OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: 'web.onesignal.auto.2068edc0-2ec7-4d8d-bc37-83913e3acbff',
      notifyButton: { enable: false },
    });
  });
}

export function setOneSignalExternalUserId(userId) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(function (OneSignal) {
    OneSignal.login(String(userId));
  });
}

export function removeOneSignalExternalUserId() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(function (OneSignal) {
    OneSignal.logout();
  });
}
