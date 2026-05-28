const CLIENT_ID_KEY = 'mytiket_client_id';
const ALERT_IDS_KEY = 'mytiket_alert_ids';

export function getClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function getAlertIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(ALERT_IDS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addAlertId(id: string): void {
  const ids = getAlertIds();
  if (!ids.includes(id)) {
    localStorage.setItem(ALERT_IDS_KEY, JSON.stringify([...ids, id]));
  }
}

export function removeAlertId(id: string): void {
  const ids = getAlertIds().filter((i) => i !== id);
  localStorage.setItem(ALERT_IDS_KEY, JSON.stringify(ids));
}
