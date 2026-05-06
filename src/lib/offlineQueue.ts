import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type QueuedWrite = {
  id: string;
  table: string;
  op: 'insert' | 'update' | 'delete';
  payload?: any;
  match?: Record<string, any>;
  ts: number;
};

const KEY = 'offline-write-queue-v1';

function read(): QueuedWrite[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(q: QueuedWrite[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
}

export function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

export function enqueueWrite(w: Omit<QueuedWrite, 'id' | 'ts'>) {
  const q = read();
  q.push({ ...w, id: crypto.randomUUID(), ts: Date.now() });
  write(q);
}

export async function flushQueue() {
  if (isOffline()) return;
  const q = read();
  if (!q.length) return;
  const remaining: QueuedWrite[] = [];
  for (const item of q) {
    try {
      const tbl = supabase.from(item.table as any);
      let err: any = null;
      if (item.op === 'insert') ({ error: err } = await tbl.insert(item.payload));
      else if (item.op === 'update') {
        let qy: any = tbl.update(item.payload);
        for (const [k, v] of Object.entries(item.match || {})) qy = qy.eq(k, v);
        ({ error: err } = await qy);
      } else if (item.op === 'delete') {
        let qy: any = tbl.delete();
        for (const [k, v] of Object.entries(item.match || {})) qy = qy.eq(k, v);
        ({ error: err } = await qy);
      }
      if (err) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  write(remaining);
  const synced = q.length - remaining.length;
  if (synced > 0) toast.success(`Synced ${synced} offline change${synced > 1 ? 's' : ''}`);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushQueue(); });
  // Try once on load
  setTimeout(() => flushQueue(), 1500);
}
