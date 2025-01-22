"use server"

import { createClient } from "../server"

interface TokenData {
    access_token: string
    refresh_token?: string
    expires_in?: number
    app_id: number
}

export async function storeTokens(modelId: string, userId: string, tokens: TokenData) {
    const supabase = await createClient()

    try {
        // Create connection keys array in the required format
        const connectionKeys = [
            `access_token=${tokens.access_token}`,
            tokens.refresh_token ? `refresh_token=${tokens.refresh_token}` : null,
            tokens.expires_in ? `expires_in=${tokens.expires_in}` : null,
        ].filter(Boolean) // Remove null values

        // Store the connection in user_connection table
        const { data: connection, error: connectionError } = await supabase
            .from('user_connection')
            .insert({
                user_id: userId,
                app_id: tokens.app_id,
                connection_name: 'Google Drive',
                connection_key: connectionKeys,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (connectionError) throw connectionError

        return { success: true, connection_id: connection.id }
    } catch (error) {
        console.error('Error storing connection:', error)
        throw error
    }
}

export async function getTokens(modelId: string, userId: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('oauth_tokens')
            .select('*')
            .eq('model_id', modelId)
            .eq('user_id', userId)
            .single()

        if (error) throw error

        return data
    } catch (error) {
        console.error('Error getting tokens:', error)
        throw error
    }
}

export async function deleteTokens(modelId: string, userId: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('oauth_tokens')
            .delete()
            .eq('model_id', modelId)
            .eq('user_id', userId)

        if (error) throw error

        return { success: true }
    } catch (error) {
        console.error('Error deleting tokens:', error)
        throw error
    }
} 