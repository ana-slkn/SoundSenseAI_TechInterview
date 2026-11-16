import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export type Review = {
  decision: string;
  notes: string;
  findings: Record<string, string>;
};
const localKey = 'soundsense-reviews-v1';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const storageMode = url || key ? 'Supabase' : 'Local browser';
let client: SupabaseClient | undefined;
let sessionPromise: Promise<string> | undefined;
async function database() {
  if (!url || !key) throw new Error('Supabase is not configured.');
  client ??= createClient(url, key);
  const db = client;
  sessionPromise ??= (async () => {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session.user.id;
    const result = await db.auth.signInAnonymously();
    if (result.error) throw result.error;
    if (!result.data.user)
      throw new Error('Could not create a reviewer session.');
    return result.data.user.id;
  })().catch((error) => {
    sessionPromise = undefined;
    throw error;
  });
  return { db, userId: await sessionPromise };
}
export async function loadReviews(): Promise<Record<string, Review>> {
  if (storageMode === 'Local browser') {
    const raw = localStorage.getItem(localKey);
    return raw ? JSON.parse(raw) : {};
  }
  const { db, userId } = await database();
  const { data, error } = await db
    .from('reviews')
    .select('call_id, decision, notes, findings')
    .eq('user_id', userId);
  if (error) throw error;
  return Object.fromEntries(
    data.map((row) => [
      row.call_id,
      { decision: row.decision, notes: row.notes, findings: row.findings },
    ]),
  );
}
export async function saveReview(
  callId: string,
  review: Review,
): Promise<void> {
  if (storageMode === 'Local browser') {
    const saved = await loadReviews();
    localStorage.setItem(
      localKey,
      JSON.stringify({ ...saved, [callId]: review }),
    );
    return;
  }
  const { db, userId } = await database();
  const { error } = await db
    .from('reviews')
    .upsert(
      { user_id: userId, call_id: callId, ...review },
      { onConflict: 'user_id,call_id' },
    );
  if (error) throw error;
}
