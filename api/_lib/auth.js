import { getSupabaseAdmin } from './supabaseAdmin.js';

export async function requireAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';

  if (!token) {
    throw new Error('Debes iniciar sesión para crear o capturar pagos.');
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('Sesión inválida o expirada.');
  }

  return data.user;
}
