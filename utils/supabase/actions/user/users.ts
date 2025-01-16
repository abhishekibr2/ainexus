import { createClient } from "../../client";

export interface User {
    id: string;
    name?: string | null;
    email: string;  // Email is required
}

export async function searchUsers(query: string) {
    const supabase = createClient();

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    // First get users from auth.users by email
    const { data: authUsers, error: authUsersError } = await supabase
        .from('user')
        .select('id, email')
        .ilike('email', `%${query}%`)
        .limit(10);

    if (authUsersError) {
        console.error('Error fetching auth users:', authUsersError);
        throw authUsersError;
    }

    // Then get user data for these users
    const { data: userData2, error: userError } = await supabase
        .from('user')
        .select('id, name')
        .in('id', authUsers?.map(user => user.id) || [])
        .or(`name.ilike.%${query}%`);

    if (userError) {
        console.error('Error searching users:', userError);
        throw userError;
    }

    // Merge the data
    const mergedUsers = authUsers?.map(authUser => ({
        id: authUser.id,
        email: authUser.email,
        name: userData2?.find(u => u.id === authUser.id)?.name || null
    })) || [];

    return mergedUsers;
}

export async function getUsers(userIds: string[]) {
    const supabase = createClient();

    // Get users from auth.users
    const { data: authUsers, error: authUsersError } = await supabase
        .from('user')
        .select('id, email')
        .in('id', userIds);

    if (authUsersError) {
        console.error('Error fetching auth users:', authUsersError);
        throw authUsersError;
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id, name')
        .in('id', userIds);

    if (userError) {
        console.error('Error getting users:', userError);
        throw userError;
    }

    // Merge the data
    const mergedUsers = authUsers?.map(authUser => ({
        id: authUser.id,
        email: authUser.email,
        name: userData?.find(u => u.id === authUser.id)?.name || null
    })) || [];

    return mergedUsers;
} 