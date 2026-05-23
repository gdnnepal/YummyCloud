const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export function initOneSignal() {
  if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'your-onesignal-app-id-here') {
    console.log('OneSignal: No app ID configured');
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });

    const permission = OneSignal.Notifications.permission;
    if (!permission) {
      try {
        await OneSignal.Notifications.requestPermission();
      } catch (e) {
        console.log('OneSignal: Permission request failed or dismissed', e);
      }
    }
  });
}

export function setOneSignalExternalUserId(userId) {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      await OneSignal.login(String(userId));
      const permission = OneSignal.Notifications.permission;
      if (!permission) {
        await OneSignal.Notifications.requestPermission();
      }
    } catch (e) {
      console.log('OneSignal: login/permission error', e);
    }
  });
}

export function removeOneSignalExternalUserId() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      await OneSignal.logout();
    } catch (e) {
      console.log('OneSignal: logout error', e);
    }
  });
}
