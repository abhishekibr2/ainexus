import { createClient } from "../../client";

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
    const { data, error } = await supabase
      .from("user_connection")
      .insert({
        user_id: userId,
        app_id: appId,
        user_assigned_assistant_id: userAssignedAssistantId,
        connection_key: `{${arrayValues.map(v => `"${v}"`).join(',')}}`,  // Format as PostgreSQL array
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

export async function getUserConnections(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_connection")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error getting user connections:", error);
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
    const { data, error } = await supabase.from("user_connection").update({ connection_key: connectionKey }).eq("id", connectionId);
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error updating user connection:", error);
    return { data: null, error };
  }
}

