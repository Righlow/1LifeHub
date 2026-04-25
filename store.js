import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HABITS:  '1life_habits',
  ENTRIES: '1life_entries',
  GOALS:   '1life_goals',
  HEALTH:  '1life_health',
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function readList(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function writeList(key, list) {
  try { await AsyncStorage.setItem(key, JSON.stringify(list)); }
  catch (e) { console.warn('Storage write error:', e); }
}

// ── Habits ───────────────────────────────────────────────────
export const habitsStore = {
  list: () => readList(KEYS.HABITS),
  create: async (data) => {
    const list = await readList(KEYS.HABITS);
    const item = { ...data, id: uid(), created_at: new Date().toISOString() };
    await writeList(KEYS.HABITS, [...list, item]);
    return item;
  },
  update: async (id, patch) => {
    const list = await readList(KEYS.HABITS);
    await writeList(KEYS.HABITS, list.map(h => h.id === id ? { ...h, ...patch } : h));
  },
  remove: async (id) => {
    const list = await readList(KEYS.HABITS);
    await writeList(KEYS.HABITS, list.filter(h => h.id !== id));
  },
};

// ── Entries ──────────────────────────────────────────────────
export const entriesStore = {
  list: () => readList(KEYS.ENTRIES),
  create: async (data) => {
    const list = await readList(KEYS.ENTRIES);
    const item = { ...data, id: uid(), created_at: new Date().toISOString() };
    await writeList(KEYS.ENTRIES, [...list, item]);
    return item;
  },
  update: async (id, patch) => {
    const list = await readList(KEYS.ENTRIES);
    await writeList(KEYS.ENTRIES, list.map(e => e.id === id ? { ...e, ...patch } : e));
  },
  domainXPMap: async () => {
    const entries = await readList(KEYS.ENTRIES);
    const map = {};
    entries.forEach(e => {
      if (e.domain_xp) {
        Object.entries(e.domain_xp).forEach(([d, xp]) => {
          map[d] = (map[d] || 0) + xp;
        });
      }
    });
    return map;
  },
};

// ── Goals ────────────────────────────────────────────────────
export const goalsStore = {
  list: () => readList(KEYS.GOALS),
  create: async (data) => {
    const list = await readList(KEYS.GOALS);
    const item = { ...data, id: uid(), created_at: new Date().toISOString() };
    await writeList(KEYS.GOALS, [...list, item]);
    return item;
  },
  update: async (id, patch) => {
    const list = await readList(KEYS.GOALS);
    await writeList(KEYS.GOALS, list.map(g => g.id === id ? { ...g, ...patch } : g));
  },
  remove: async (id) => {
    const list = await readList(KEYS.GOALS);
    await writeList(KEYS.GOALS, list.filter(g => g.id !== id));
  },
  // Returns 0–1 score based on average weekly goal progress
  getWeeklyScore: async () => {
    const list = await readList(KEYS.GOALS);
    const weekly = list.filter(g => g.timeframe === 'weekly' && (g.status === 'active' || !g.status));
    if (!weekly.length) return 0;
    const avg = weekly.reduce((s, g) => s + (g.progress || 0), 0) / weekly.length;
    return avg / 100;
  },
};

// ── Health ───────────────────────────────────────────────────
// Each entry: { id, date, sleep, water, movement, logged_at }
// sleep: 0–12 (hours), water: 0–10 (glasses), movement: 0–120 (mins)
export const healthStore = {
  list: () => readList(KEYS.HEALTH),

  // Get today's entry or null
  getToday: async () => {
    const list = await readList(KEYS.HEALTH);
    const today = new Date().toISOString().split('T')[0];
    return list.find(e => e.date === today) || null;
  },

  // Save (create or update) today's entry
  saveToday: async (data) => {
    const list = await readList(KEYS.HEALTH);
    const today = new Date().toISOString().split('T')[0];
    const existing = list.find(e => e.date === today);
    const entry = {
      ...(existing || { id: uid(), date: today }),
      ...data,
      logged_at: new Date().toISOString(),
    };
    const updated = existing
      ? list.map(e => e.date === today ? entry : e)
      : [...list, entry];
    await writeList(KEYS.HEALTH, updated);
    return entry;
  },

  // Returns 0–1 score: average of (sleep/8, water/8, movement/60) for today
  getTodayScore: async () => {
    const list = await readList(KEYS.HEALTH);
    const today = new Date().toISOString().split('T')[0];
    const entry = list.find(e => e.date === today);
    if (!entry) return 0;
    const sleepScore    = Math.min((entry.sleep    || 0) / 8,   1);
    const waterScore    = Math.min((entry.water    || 0) / 8,   1);
    const movementScore = Math.min((entry.movement || 0) / 60,  1);
    return (sleepScore + waterScore + movementScore) / 3;
  },
};