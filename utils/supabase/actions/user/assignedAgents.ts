import { createClient } from "../../client";

export async function assignModelToUser(
  userId: string,
  appId: number,
  name: string,
  assistantId: number,
  description?: string,
  instruction?: string,
  userConnectionId?: number
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_assigned_assistants")
      .insert({
        user_id: userId,
        app_id: appId,
        name: name,
        assistant_id: assistantId,
        description: description,
        instruction: instruction,
        user_connection_id: userConnectionId
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error("Error assigning model to user:", error);
    return { data: null, error };
  }
}

export async function updateUserAssignedModel(
  id: string,
  updates: {
    name?: string;
    description?: string;
    instruction?: string;
    user_connection_id?: number;
  }
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_assigned_assistants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error("Error updating assigned model:", error);
    return { data: null, error };
  }
}

export async function deleteUserAssignedModel(modelId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_assigned_assistants")
      .delete()
      .eq("id", modelId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error("Error deleting assigned model:", error);
    return { data: null, error };
  }
}

export async function getUserAssignedModel(id: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("user_assigned_assistants")
      .select(`
        *,
        connection:user_connection_id (
          id,
          connection_name,
          connection_key,
          app_id
        )
      `)
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting user assigned model:", error);
    return null;
  }
}

export async function getUserAssignedModels(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_assigned_assistants")
      .select(`
        *,
        connection:user_connection_id (
          id,
          connection_name,
          connection_key,
          app_id
        )
      `)
      .eq("user_id", userId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error getting user assigned models:", error);
    return { data: null, error };
  }
}

export async function removeAssignedModel(modelId: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_assigned_assistants")
      .delete()
      .eq("id", modelId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error removing assigned model:", error);
    return { data: null, error };
  }
}
