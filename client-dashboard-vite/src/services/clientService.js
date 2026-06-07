import { supabase } from '../supabaseClient';

const CLIENT_SELECT_FIELDS = [
  'id', 'buyer_name', 'phone', 'email', 'created_at', 'notes',
  'rate', 'quantity_value', 'quantity_type', 'site_location', 'created_by',
];

export const fetchClients = async ({ filters = {}, page = 0, pageSize = 20 } = {}) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('clients')
    .select(CLIENT_SELECT_FIELDS.join(', '), { count: 'exact' });

  if (filters.buyer_name) {
    query = query.ilike('buyer_name', `%${filters.buyer_name}%`);
  }
  
  if (filters.site_location) {
    query = query.ilike('site_location', `%${filters.site_location}%`);
  }

  if (filters.qty_type) {
    query = query.eq('quantity_type', filters.qty_type);
  }

  if (filters.min_rate) {
    query = query.gte('rate', filters.min_rate);
  }

  if (filters.max_rate) {
    query = query.lte('rate', filters.max_rate);
  }

  if (filters.min_qty) {
    query = query.gte('quantity_value', filters.min_qty);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error('Could not retrieve clients.');
  }

  return { data, count: count || 0 };
};

export const updateClient = async (clientId, updates, lastKnownUpdate) => {
  // Basic validation
  if (!updates.buyer_name || !updates.email || !updates.phone) {
    throw new Error('Name, Email, and Phone are required.');
  }

  const { data, error } = await supabase
    .from('clients')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .match({ id: clientId, updated_at: lastKnownUpdate })
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Stale data detected or record not found. Please refresh and try again.');
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Update failed. No data returned.');
  }

  return data;
};
