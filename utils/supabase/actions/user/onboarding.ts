'use server'

import { createClient } from '../../client'

function getFormattedTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset < 0 ? '+' : '-';
    const gmtOffset = `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return `${timezone} ${gmtOffset}`;
}

export async function checkAndUpdateTimezone(id: string) {
    try {
        const supabase = createClient()

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('user')
            .select('timezone')
            .eq('id', id)
            .single()

        if (profileError) throw profileError

        // If timezone is null, update it with the system timezone
        if (!profile.timezone) {
            const { error: updateError } = await supabase
                .from('user')
                .update({ timezone: getFormattedTimezone() })
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
