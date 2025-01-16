import { createClient } from "../../client";

export interface Workspace {
    id: number;
    name: string;
    description?: string | null;
    owner: string;
    owner_email: string;
    members: string[];
    created_at: string;
}

export async function searchWorkspaces(query: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .or(`name.ilike.%${query}%,owner_email.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error searching workspaces:', error);
        throw error;
    }

    return data || [];
}

export async function getWorkspaces(workspaceIds: number[]) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);

    if (error) {
        console.error('Error getting workspaces:', error);
        throw error;
    }

    return data || [];
} 