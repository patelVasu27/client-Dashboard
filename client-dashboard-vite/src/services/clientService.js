import { supabase } from '../supabaseClient';

export const fetchClients = async ({ filters = {}, page = 0, pageSize = 20 } = {}) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('clients')
    .select('*, purchase_profiles(*)', { count: 'exact' });

  if (filters.buyer_name) {
    query = query.ilike('buyer_name', `%${filters.buyer_name}%`);
  }
  
  if (filters.site_location) {
    console.debug('[fetchClients] Filtering site_location:', filters.site_location);
    query = query.filter('purchase_profiles.site_location', 'ilike', `%${filters.site_location}%`);
  }

  if (filters.qty_type) {
    query = query.filter('purchase_profiles.quantity_type', 'eq', filters.qty_type);
  }

  if (filters.min_rate) {
    query = query.filter('purchase_profiles.rate', 'gte', filters.min_rate);
  }

  if (filters.max_rate) {
    query = query.filter('purchase_profiles.rate', 'lte', filters.max_rate);
  }

  if (filters.min_qty) {
    query = query.filter('purchase_profiles.quantity_value', 'gte', filters.min_qty);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('fetchClients error:', error);
    throw new Error(`Could not retrieve clients: ${error.message}`);
  }

  data?.forEach(client => {
    if (client.purchase_profiles) {
      client.purchase_profiles.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    }
  });

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

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      buyer_name: clientData.buyer_name,
      phone: clientData.phone,
      site_location: clientData.site_location,
      rate: clientData.rate,
      quantity_value: clientData.quantity_value,
      quantity_type: clientData.quantity_type,
      notes: clientData.notes || null,
      created_by: authUserId,
    })
    .select()
    .single();

  if (error) {
    console.error('[addClient] Insert failed:', { error, clientData, authUserId });
    if (error.code === '42501' || error.message.includes('row-level security')) {
      throw new Error('Permission denied. You can only create clients for your own account.');
    }
    throw new Error(`Failed to create client: ${error.message}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from('purchase_profiles')
    .insert({
      client_id: client.id,
      site_location: clientData.site_location,
      rate: clientData.rate,
      quantity_value: clientData.quantity_value,
      quantity_type: clientData.quantity_type,
      notes: clientData.notes || null,
    })
    .select()
    .single();

  if (profileError) {
    console.error('[addClient] Profile insert failed:', profileError);
    throw new Error(`Failed to create purchase profile: ${profileError.message}`);
  }

  console.log('[addClient] Client created successfully:', client.id);
  client.purchase_profiles = [profile];
  return client;
};

export const updateClient = async (clientId, updates, lastKnownUpdate) => {
  if (!updates.buyer_name || !updates.phone) {
    throw new Error('Name and Phone are required.');
  }

  let query = supabase
    .from('clients')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .select()
    .single();

  if (lastKnownUpdate) {
    query = query.match({ id: clientId, updated_at: lastKnownUpdate });
  } else {
    query = query.eq('id', clientId);
  }

  const { data, error } = await query;

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

// --- Profile CRUD ---

export const addProfile = async (clientId, profileData) => {
  const { data, error } = await supabase
    .from('purchase_profiles')
    .insert({ client_id: clientId, ...profileData })
    .select()
    .single();

  if (error) throw new Error(`Failed to add profile: ${error.message}`);

  const syncFields = {};
  if (profileData.site_location !== undefined) syncFields.site_location = profileData.site_location;
  if (profileData.rate !== undefined) syncFields.rate = profileData.rate;
  if (profileData.quantity_value !== undefined) syncFields.quantity_value = profileData.quantity_value;
  if (profileData.quantity_type !== undefined) syncFields.quantity_type = profileData.quantity_type;
  if (profileData.notes !== undefined) syncFields.notes = profileData.notes;

  if (Object.keys(syncFields).length > 0) {
    await supabase.from('clients').update(syncFields).eq('id', clientId);
  }

  return data;
};

export const updateProfile = async (profileId, updates, lastKnownUpdate, clientId) => {
  let query = supabase
    .from('purchase_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (lastKnownUpdate) {
    query = query.match({ id: profileId, updated_at: lastKnownUpdate });
  } else {
    query = query.eq('id', profileId);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Stale data detected or record not found. Please refresh and try again.');
    }
    throw new Error(error.message);
  }

  if (!data) throw new Error('Update failed. No data returned.');

  if (clientId) {
    const syncFields = {};
    if (updates.site_location !== undefined) syncFields.site_location = updates.site_location;
    if (updates.rate !== undefined) syncFields.rate = updates.rate;
    if (updates.quantity_value !== undefined) syncFields.quantity_value = updates.quantity_value;
    if (updates.quantity_type !== undefined) syncFields.quantity_type = updates.quantity_type;
    if (updates.notes !== undefined) syncFields.notes = updates.notes;

    if (Object.keys(syncFields).length > 0) {
      await supabase.from('clients').update(syncFields).eq('id', clientId);
    }
  }

  return data;
};

export const deleteProfile = async (profileId, clientId) => {
  const { error } = await supabase
    .from('purchase_profiles')
    .delete()
    .eq('id', profileId);

  if (error) throw new Error(`Failed to delete profile: ${error.message}`);

  if (clientId) {
    const { data: remaining } = await supabase
      .from('purchase_profiles')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (remaining && remaining.length > 0) {
      const latest = remaining[0];
      await supabase
        .from('clients')
        .update({
          site_location: latest.site_location,
          rate: latest.rate,
          quantity_value: latest.quantity_value,
          quantity_type: latest.quantity_type,
          notes: latest.notes,
        })
        .eq('id', clientId);
    }
  }

  return true;
};
