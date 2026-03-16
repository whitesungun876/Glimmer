const STORAGE_KEYS = {
  MORNING_ENABLED: 'glimmer_morning_reminder_enabled',
  MORNING_TIME: 'glimmer_morning_reminder_time',
  EVENING_ENABLED: 'glimmer_evening_reminder_enabled',
  EVENING_TIME: 'glimmer_evening_reminder_time',
};

const DEFAULT_MORNING = '07:30';
const DEFAULT_EVENING = '21:00';

export function getReminderSettings() {
  return {
    morningEnabled: localStorage.getItem(STORAGE_KEYS.MORNING_ENABLED) === 'true',
    morningTime: localStorage.getItem(STORAGE_KEYS.MORNING_TIME) || DEFAULT_MORNING,
    eveningEnabled: localStorage.getItem(STORAGE_KEYS.EVENING_ENABLED) === 'true',
    eveningTime: localStorage.getItem(STORAGE_KEYS.EVENING_TIME) || DEFAULT_EVENING,
  };
}

export function saveReminderSettings({ morningEnabled, morningTime, eveningEnabled, eveningTime }) {
  if (morningEnabled != null) localStorage.setItem(STORAGE_KEYS.MORNING_ENABLED, String(morningEnabled));
  if (morningTime != null) localStorage.setItem(STORAGE_KEYS.MORNING_TIME, morningTime);
  if (eveningEnabled != null) localStorage.setItem(STORAGE_KEYS.EVENING_ENABLED, String(eveningEnabled));
  if (eveningTime != null) localStorage.setItem(STORAGE_KEYS.EVENING_TIME, eveningTime);
}

export function formatReminderLabel(enabled, time) {
  if (!enabled) return null;
  return time || null;
}

const FIRED_KEY_PREFIX = 'glimmer_reminder_fired_';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function alreadyFired(kind) {
  return localStorage.getItem(FIRED_KEY_PREFIX + kind) === todayKey();
}

function markFired(kind) {
  localStorage.setItem(FIRED_KEY_PREFIX + kind, todayKey());
}

export function checkAndFireReminders() {
  if (typeof window === 'undefined' || !window.Notification || window.Notification.permission !== 'granted') return;
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const s = getReminderSettings();

  if (s.morningEnabled && s.morningTime === current && !alreadyFired('morning')) {
    try {
      new window.Notification('拾光 · 晨间微光', {
        body: '该开启清晨，设定今天的色调了 ☀️',
        icon: '/favicon.ico',
      });
      markFired('morning');
    } catch (_) {}
  }
  if (s.eveningEnabled && s.eveningTime === current && !alreadyFired('evening')) {
    try {
      new window.Notification('拾光 · 晚间微光', {
        body: '该捕捉存下的微光啦 🌙',
        icon: '/favicon.ico',
      });
      markFired('evening');
    } catch (_) {}
  }
}

export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && window.Notification?.requestPermission) {
    return window.Notification.requestPermission();
  }
  return Promise.resolve('denied');
}
