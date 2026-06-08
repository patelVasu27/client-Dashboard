import { supabase } from '../supabaseClient';

const CLIENT_SELECT_FIELDS = [
  'id', 'buyer_name', 'phone', 'created_at', 'notes',
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
    console.error('fetchClients error:', error);
    throw new Error(`Could not retrieve clients: ${error.message}`);
  }

  return { data, count: count || 0 };
};

export const addClient = async (clientData) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('[addClient] getUser failed:', userError);
    throw new Error('Authentication error. Please sign in again.');
  }

  if (!user) {
    console.error('[addClient] No authenticated user');
    throw new Error('User not authenticated. Please sign in to create clients.');
  }

  const authUserId = user.id;
  console.log('[addClient] Authenticated user ID:', authUserId);

  const payload = {
    ...clientData,
    created_by: authUserId,
  };

  console.log('[addClient] Insert payload:', payload);

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[addClient] Insert failed:', { error, payload, authUserId });
    if (error.code === '42501' || error.message.includes('row-level security')) {
      throw new Error('Permission denied. You can only create clients for your own account.');
    }
    throw new Error(`Failed to create client: ${error.message}`);
  }

  console.log('[addClient] Client created successfully:', data);
  return data;
};

export const updateClient = async (clientId, updates, lastKnownUpdate) => {
  if (!updates.buyer_name || !updates.phone) {
    throw new Error('Name and Phone are required.');
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
    console.error('updateClient error:', error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Update failed. No data returned.');
  }

  return data;
};

export const deleteClient = async (clientId) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    console.error('deleteClient error:', error);
    throw new Error(`Failed to delete client: ${error.message}`);
  }

  return true;
};
