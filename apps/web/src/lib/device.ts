function randomId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Stable per-browser id (the backend needs 8+ characters). Falls back to a random id when storage is blocked. */
export function deviceId(): string {
  try {
    let id = localStorage.getItem('eg_device');
    if (!id) {
      id = `web-${randomId()}`;
      localStorage.setItem('eg_device', id);
    }
    return id;
  } catch {
    return `web-${randomId()}`;
  }
}

/** Identifies this tab: two tabs of one attempt must have different ids (multi-tab policy). */
export function tabId(): string {
  try {
    let id = sessionStorage.getItem('eg_tab');
    if (!id) {
      id = randomId().slice(0, 36);
      sessionStorage.setItem('eg_tab', id);
    }
    return id;
  } catch {
    return randomId().slice(0, 36);
  }
}

export function deviceName(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Browser';
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return `${br} on ${os}`;
}
