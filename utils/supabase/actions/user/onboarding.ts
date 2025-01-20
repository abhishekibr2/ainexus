'use server'

import { createClient } from '../../client'

export async function checkAndUpdateTimezone(id: string) {
    try {
        const supabase = createClient()

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('id', id)
            .single()

        if (profileError) throw profileError

        // If timezone is null, update it with the system timezone
        if (!profile.timezone) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
                .eq('id', id)

            if (updateError) throw updateError
        }

        return { success: true }
    } catch (error) {
        console.error('Error checking/updating timezone:', error)
        return { success: false, error }
    }
}

export async function getUserTimezone(userId: string) {
    const supabase = createClient()
    const { data: profile, error: profileError } = await supabase.from('user').select('timezone').eq('id', userId).single()
    if (profileError) throw profileError
    return profile.timezone
}

export async function getUserName(userId: string) {
    const supabase = createClient()
    const { data: profile, error: profileError } = await supabase.from('user').select('name').eq('id', userId).single()
    if (profileError) throw profileError
    return profile.name
}
