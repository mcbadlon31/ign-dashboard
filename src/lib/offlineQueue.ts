
type QueueItem = { url: string; body: any; ts: number };

const KEY = 'ign_offline_queue';

function load(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(items: QueueItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export async function postWithQueue(url: string, body: any, headers: Record<string,string> = {}) {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res;
  } catch (e) {
    const items = load();
    items.push({ url, body, ts: Date.now() });
    save(items);
    return new Response(JSON.stringify({ queued: true }), { status: 202 });
  }
}

export async function flushQueue() {
  const items = load();
  if (!items.length) return;
  const rest: QueueItem[] = [];
  for (const it of items) {
    try {
      const res = await fetch(it.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it.body) });
      if (!res.ok) throw new Error('bad');
    } catch (e) {
      rest.push(it);
    }
  }
  save(rest);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushQueue());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flushQueue(); });
  setInterval(() => flushQueue(), 15000);
}

// expose for SW-driven flush
if (typeof window !== 'undefined') { (window as any).flushOfflineQueue = flushQueue; }


export async function postAllWithQueue(url: string, body: any){
  // global helper used by fetch shim
  return postWithQueue(url, body, { 'X-IGN-OFFLINE-REPLAY': '0' });
}
