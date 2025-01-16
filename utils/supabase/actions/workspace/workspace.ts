import { Database } from "@/lib/database.types";
import { createClient } from "../../client";

export type Workspace = Database['public']['Tables']['workspaces']['Row'];

export async function getUserWorkspaces(userId: string) {
    try {
        const supabase = await createClient();
        const { data: workspaces, error } = await supabase
            .from('workspaces')
            .select('*')
            .or(`owner.eq.${userId},members.cs.{${userId}}`);
        if (workspaces && workspaces.length === 0) {
            const { data: workspace, error: workspaceError } = await supabase
                .from('workspaces')
                .insert({
                    name: "Default Workspace",
                    description: "Default workspace for user",
                    owner: userId,
                    members: [userId]
                })
                .select()
            if (workspaceError) throw workspaceError;
            console.log(workspace)
            return workspace;
        }
        if (error) throw error;
        return workspaces || [];
    } catch (error) {
        console.error('Error in getUserWorkspaces:', error);
        return [];
    }
}

export async function createWorkspace(name: string, description?: string) {
    const supabase = await createClient();

    // First get the user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError;

    // Create workspace with owner and initial members array
    const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
            name,
            description,
            owner: user.id,
            members: [user.id]
        })
        .select()
        .single();

    if (workspaceError) throw workspaceError;
    return workspace;
}

export async function getWorkspaceById(workspaceId: string | number) {
    try {
        const supabase = await createClient();
        const { data: workspace, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', workspaceId)
            .single();

        if (error) throw error;
        return workspace;
    } catch (error) {
        console.error('Error in getWorkspaceById:', error);
        throw error;
    }
}

export async function updateWorkspaceDetails(workspaceId: string | number, updates: { name?: string; description?: string }) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('workspaces')
            .update(updates)
            .eq('id', workspaceId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error in updateWorkspaceDetails:', error);
        throw error;
    }
}

export async function deleteWorkspaceById(workspaceId: string | number) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('workspaces')
            .delete()
            .eq('id', workspaceId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error in deleteWorkspaceById:', error);
        throw error;
    }
}

export async function addWorkspaceMember(workspaceId: number, memberId: string) {
    const supabase = await createClient();

    // First get the current workspace
    const { data: workspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('members')
        .eq('id', workspaceId)
        .single();

    if (fetchError) throw fetchError;

    // Add the new member to the members array if not already present
    const updatedMembers = workspace.members.includes(memberId)
        ? workspace.members
        : [...workspace.members, memberId];

    // Update the workspace with the new members array
    const { error: updateError } = await supabase
        .from('workspaces')
        .update({ members: updatedMembers })
        .eq('id', workspaceId);

    if (updateError) throw updateError;
}

export async function removeWorkspaceMember(workspaceId: number, memberId: string) {
    const supabase = await createClient();

    // First get the current workspace
    const { data: workspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('members, owner')
        .eq('id', workspaceId)
        .single();

    if (fetchError) throw fetchError;

    // Don't allow removing the owner
    if (workspace.owner === memberId) {
        throw new Error("Cannot remove the workspace owner");
    }

    // Remove the member from the members array
    const updatedMembers = workspace.members.filter((id: string) => id !== memberId);

    // Update the workspace with the new members array
    const { error: updateError } = await supabase
        .from('workspaces')
        .update({ members: updatedMembers })
        .eq('id', workspaceId);

    if (updateError) throw updateError;
}
