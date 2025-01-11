import { createClient } from "../../client";

export async function assignModelToUser(
  userId: string,
  appId: number,
  assistantName: string,
  assistantId: number
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_assigned_assistants")
      .insert({
        user_id: userId,
        app_id: appId,
        assistant_name: assistantName,
        assistant_id: assistantId,
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

export async function getUserAssignedModels(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_assigned_assistants")
      .select("*")
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
