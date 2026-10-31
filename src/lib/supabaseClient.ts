import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dogavyiyrqktygdgikqi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QTQtGxYPTKhs88P5GfXajA_2H8riQHi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

let sharedBroadcastChannel: ReturnType<typeof supabase.channel> | null = null;
let sharedBroadcastReady: Promise<void> | null = null;

function ensureBroadcastChannel() {
  if (typeof window === 'undefined') return null;
  if (!sharedBroadcastChannel) {
    sharedBroadcastChannel = supabase.channel('kodelocal-live-broadcast', {
      config: { broadcast: { self: false } },
    });
    sharedBroadcastReady = new Promise<void>((resolve) => {
      sharedBroadcastChannel!.subscribe((status) => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          resolve();
        }
      });
      setTimeout(resolve, 1500);
    });
  }
  return sharedBroadcastChannel;
}

export async function broadcastOrderSync(
  payload: { saleNumber?: string; source?: string; action?: string } = {}
) {
  if (typeof window === 'undefined') return;
  try {
    const ch = ensureBroadcastChannel();
    if (!ch) return;
    if (sharedBroadcastReady) {
      await sharedBroadcastReady;
    }
    await ch.send({
      type: 'broadcast',
      event: 'order_sync',
      payload: { ...payload, ts: Date.now() },
    });
  } catch (err) {
    console.warn('Error enviando broadcast de sincronización:', err);
  }
}

