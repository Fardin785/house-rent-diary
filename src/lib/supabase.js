import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ───── TENANT CRUD ─────

export async function fetchTenants() {
  const { data, error } = await supabase.from('tenants').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function addTenant(tenant) {
  const { data, error } = await supabase.from('tenants').insert([tenant]).select().single();
  if (error) throw error;
  return data;
}

export async function updateTenant(id, updates) {
  const { data, error } = await supabase.from('tenants').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTenant(id) {
  const { error } = await supabase.from('tenants').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function uploadTenantAsset(file, type = 'photo') {
  const fileExt = file.name.split('.').pop();
  const filePath = `${crypto.randomUUID()}-${type}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('tenant_assets')
    .upload(filePath, file);
    
  if (error) throw error;
  
  const { data: publicUrlData } = supabase.storage
    .from('tenant_assets')
    .getPublicUrl(filePath);
    
  return { path: filePath, url: publicUrlData.publicUrl, name: file.name };
}

// ───── RECORD CRUD ─────

export async function fetchRecords(filters = {}) {
  let query = supabase.from('monthly_records').select('*, tenants(name, flat)').order('month', { ascending: false });
  if (filters.month) query = query.eq('month', filters.month);
  if (filters.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addRecord(record) {
  const { data, error } = await supabase.from('monthly_records').insert([record]).select().single();
  if (error) throw error;
  return data;
}

export async function updateRecord(id, updates) {
  const { data, error } = await supabase.from('monthly_records').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(id) {
  const { error } = await supabase.from('monthly_records').delete().eq('id', id);
  if (error) throw error;
  return true;
}
