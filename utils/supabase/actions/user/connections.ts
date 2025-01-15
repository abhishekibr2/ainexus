import { createClient } from "../../client";

export type ConnectionKeyPair = {
  key: string;
  value: string;
};

export type Connection = {
  id: number;
  created_at: string;
  user_id: string;
  updated_at: string;
  connection_key: string[] | string;
  app_id: number;
  user_assigned_assistant_id: number;
  application: {
    name: string;
    description: string;
    logo: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
  parsedConnectionKeys: ConnectionKeyPair[];
};

export function parseConnectionKey(keyData: string[] | string): ConnectionKeyPair[] {
  try {
    // If it's already an array, process it directly
    if (Array.isArray(keyData)) {
      return keyData.map(pair => {
        const [key, value] = pair.split('=');
        return {
          key: key?.trim() || '',
          value: value?.trim() || ''
        };
      });
    }

    // If it's a string, handle the PostgreSQL array format
    const cleanString = keyData.replace(/^{|}$/g, '');
    const pairs = cleanString.split(',').map(str => str.replace(/^"|"$/g, ''));

    return pairs.map(pair => {
      const [key, value] = pair.split('=');
      return {
        key: key?.trim() || '',
        value: value?.trim() || ''
      };
    });
  } catch (error) {
    console.error('Error parsing connection key:', error);
    return [];
  }
}

export async function getUserConnections(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_connection')
      .select(`
        *,
        application:app_id (
          name,
          description,
          logo
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Parse connection keys for each connection
    const connectionsWithParsedKeys = data?.map(connection => ({
      ...connection,
      parsedConnectionKeys: parseConnectionKey(connection.connection_key)
    }));

    return { data: connectionsWithParsedKeys, error: null };
  } catch (error) {
    console.error("Error getting user connections:", error);
    return { data: null, error };
  }
}

export async function addUserConnection(
  userId: string,
  appId: number,
  connectionKey: string,
  userAssignedAssistantId: number
) {
  try {
    const supabase = await createClient();

    // Convert JSON string to array format
    const keyPairs = JSON.parse(connectionKey);
    const arrayValues = Object.entries(keyPairs)
      .map(([key, value]) => `${key}=${value}`);
    // Store the connection key as a PostgreSQL array
    console.log(arrayValues)
    const { data, error } = await supabase
      .from("user_connection")
      .insert({
        user_id: userId,
        app_id: appId,
        user_assigned_assistant_id: userAssignedAssistantId,
        connection_key: `{${arrayValues.map(v => `"${v}"`).join(',')}}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error("Error adding user connection:", error);
    return { data: null, error };
  }
}

export async function deleteUserConnection(connectionId: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_connection")
      .delete()
      .eq("id", connectionId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error deleting user connection:", error);
    return { data: null, error };
  }
}

export async function updateUserConnection(connectionId: number, connectionKey: string) {
  try {
    const supabase = await createClient();

    // Parse the JSON string and convert to array format
    const keyPairs = JSON.parse(connectionKey);
    const arrayValues = Object.entries(keyPairs)
      .map(([key, value]) => `${key}=${value}`);

    const { data, error } = await supabase
      .from("user_connection")
      .update({
        connection_key: `{${arrayValues.map(v => `"${v}"`).join(',')}}`
      })
      .eq("id", connectionId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating user connection:", error);
    return { data: null, error };
  }
}

export async function getUserEmailById(userId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user')
      .select('name')
      .eq('id', userId)
      .single();

    if (error) {
      console.log("User name not found for ID:", userId);
      return { data: null, error: null }; // Return null data but no error to handle gracefully
    }
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching user name:", error);
    return { data: null, error };
  }
}

