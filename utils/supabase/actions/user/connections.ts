import { createClient } from "@/utils/supabase/client";

export interface ConnectionKeyPair {
  key: string;
  value: string;
}

export interface Connection {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  connection_key: string;
  app_id: number;
  connection_name: string;
  sheet_id?: string;
  sheet_name?: string;
  application?: {
    id: number;
    name: string;
    fields?: string[];
  };
  parsedConnectionKeys?: ConnectionKeyPair[];
}

export interface ConnectionError extends Error {
  code?: string;
  details?: string;
}

function parseConnectionKeyString(keyString: string | string[]): ConnectionKeyPair[] {
  if (!keyString) return [];

  try {
    // If it's already an array from the database
    if (Array.isArray(keyString)) {
      return keyString
        .filter(Boolean)
        .map(pair => {
          const [key, value] = pair.split('=').map((s: string) => s.trim());
          return { key: key || '', value: value || '' };
        });
    }

    // If it's a string in PostgreSQL array format
    if (typeof keyString === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(keyString);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(Boolean)
            .map(pair => {
              const [key, value] = pair.split('=').map((s: string) => s.trim());
              return { key: key || '', value: value || '' };
            });
        }
      } catch {
        // If JSON parsing fails, try PostgreSQL array format
        if (keyString.startsWith('{') && keyString.endsWith('}')) {
          const cleanString = keyString.slice(1, -1); // Remove { }
          if (!cleanString) return [];

          return cleanString
            .split(',')
            .filter(Boolean)
            .map(pair => {
              const cleanPair = pair.replace(/^"|"$/g, '').trim(); // Remove quotes
              const [key, value] = cleanPair.split('=').map((s: string) => s.trim());
              return { key: key || '', value: value || '' };
            });
        }

        // If it's a single key=value pair
        if (keyString.includes('=')) {
          const [key, value] = keyString.split('=').map((s: string) => s.trim());
          return [{ key: key || '', value: value || '' }];
        }
      }
    }

    return [];
  } catch (error) {
    console.error('Error parsing connection key:', error);
    return [];
  }
}

export async function getUserConnections(userId: string) {
  if (!userId) throw new Error('User ID is required');

  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_connection')
    .select(`
      *,
      application:app_id (
        id,
        name,
        fields
      ),
      assigned_agents:user_assigned_assistants (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user connections:', error);
    return { data: null, error };
  }

  // Parse connection_key string and format it for display
  const connectionsWithParsedKeys = data?.map(connection => ({
    ...connection,
    parsedConnectionKeys: connection.connection_key ?
      parseConnectionKeyString(connection.connection_key) :
      []
  })) || [];

  return { data: connectionsWithParsedKeys, error };
}

export async function createUserConnection(
  userId: string,
  appId: number,
  connectionName: string,
  connectionKey: string
) {
  if (!userId) throw new Error('User ID is required');
  if (!appId) throw new Error('Application ID is required');
  if (!connectionName) throw new Error('Connection name is required');
  if (!connectionKey) throw new Error('Connection key is required');

  const supabase = createClient();

  const { data, error } = await supabase
    .from('user_connection')
    .insert([
      {
        user_id: userId,
        app_id: appId,
        connection_name: connectionName.trim(),
        connection_key: connectionKey
      }
    ])
    .select(`
      *,
      application:app_id (
        id,
        name,
        fields
      )
    `)
    .single();

  if (error) {
    console.error('Error creating user connection:', error);
    return { data: null, error };
  }

  // Parse connection_key
  const connectionWithParsedKeys = data ? {
    ...data,
    parsedConnectionKeys: data.connection_key ?
      parseConnectionKeyString(data.connection_key) :
      []
  } : null;

  return { data: connectionWithParsedKeys, error: null };
}

export async function updateUserConnection(
  connectionId: number,
  connectionKey?: string,
  connectionName?: string,
  sheetId?: string,
  sheetName?: string,
  sheetTab?: string
) {
  if (!connectionId) throw new Error('Connection ID is required');

  const supabase = createClient();
  
  const updateData: Partial<Connection> = {};
  
  if (connectionKey !== undefined) {
    updateData.connection_key = connectionKey;
  }
  if (connectionName !== undefined) {
    updateData.connection_name = connectionName.trim();
  }
  if (sheetId !== undefined) {
    updateData.sheet_id = sheetId;
  }
  if (sheetName !== undefined) {
    updateData.sheet_name = sheetName;
  }
  if (sheetTab !== undefined) {
    // Add sheet_tab to connection_key if it exists
    const currentKeys = updateData.connection_key ? 
      parseConnectionKeyString(updateData.connection_key) : 
      [];
    
    // Remove existing sheet_tab if any
    const filteredKeys = currentKeys.filter(pair => pair.key !== 'sheet_tab');
    
    // Add new sheet_tab
    filteredKeys.push({ key: 'sheet_tab', value: sheetTab });
    
    // Convert back to PostgreSQL array format
    updateData.connection_key = `{${filteredKeys.map(pair => 
      `"${pair.key}=${pair.value}"`
    ).join(',')}}`;
  }

  const { data, error } = await supabase
    .from('user_connection')
    .update(updateData)
    .eq('id', connectionId)
    .select(`
      *,
      application:app_id (
        id,
        name,
        fields
      )
    `)
    .single();

  if (error) {
    console.error('Error updating user connection:', error);
    return { data: null, error };
  }

  // Parse connection_key
  const connectionWithParsedKeys = data ? {
    ...data,
    parsedConnectionKeys: data.connection_key ? 
      parseConnectionKeyString(data.connection_key) : 
      []
  } : null;

  return { data: connectionWithParsedKeys, error: null };
}

export async function deleteUserConnection(connectionId: number) {
  if (!connectionId) throw new Error('Connection ID is required');

  const supabase = createClient();

  const { error } = await supabase
    .from('user_connection')
    .delete()
    .eq('id', connectionId);

  if (error) {
    console.error('Error deleting user connection:', error);
  }

  return { error };
}

export async function getApplications() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('application')
    .select('id, name, fields')
    .order('name');

  if (error) {
    console.error('Error fetching applications:', error);
  }

  return { data: data || [], error };
}