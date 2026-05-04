import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ───── TENANT CRUD ─────

export async function fetchTenants() {
  const { data, error } = await supabase.from('tenants').select('*, monthly_records(due)').order('name');
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

// ───── HOUSE MONTHLY COSTS ─────

export async function fetchMonthlyCosts() {
  const { data, error } = await supabase.from('house_monthly_costs').select('*').order('month', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchMonthlyCost(month) {
  const { data, error } = await supabase.from('house_monthly_costs').select('*').eq('month', month).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveMonthlyCost(month, payload) {
  // payload: { total_common_rent, total_water_bill, common_costs }
  // Use upsert on 'month' which must be unique
  const { data, error } = await supabase
    .from('house_monthly_costs')
    .upsert(
      {
        month,
        ...payload
      },
      { onConflict: 'month' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ───── UTILITY DOCUMENTS ─────

export async function fetchUtilityDocuments() {
  const { data, error } = await supabase.from('utility_documents').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function uploadUtilityDocument(month, type, file) {
  const fileExt = file.name.split('.').pop();
  const filePath = `utility_bills/${month}-${type}-${crypto.randomUUID()}.${fileExt}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('tenant_assets')
    .upload(filePath, file);
    
  if (uploadError) throw uploadError;
  
  const { data: publicUrlData } = supabase.storage
    .from('tenant_assets')
    .getPublicUrl(filePath);
    
  const doc = {
    month,
    type,
    file_path: filePath,
    file_name: file.name,
    file_url: publicUrlData.publicUrl
  };
  
  const { data, error } = await supabase.from('utility_documents').insert([doc]).select().single();
  if (error) throw error;
  
  return data;
}

export async function deleteUtilityDocument(id, filePath) {
  if (filePath) {
    const { error: storageError } = await supabase.storage.from('tenant_assets').remove([filePath]);
    if (storageError) console.error("Storage delete failed", storageError); // fail gracefully
  }
  
  const { error } = await supabase.from('utility_documents').delete().eq('id', id);
  if (error) throw error;
  return true;
}
