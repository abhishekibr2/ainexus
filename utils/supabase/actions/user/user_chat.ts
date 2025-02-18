"use server"

import { createClient } from "../../client"

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export async function createUserChat(userId: string, modelId: string, firstMessage: string, assistantMessage: ChatMessage) {
    const supabase = createClient()
    try {
        const chat: ChatMessage[] = [
            {
                id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                role: 'user',
                content: firstMessage
            },
            assistantMessage
        ]

        const { data, error } = await supabase
            .from('user_chat')
            .insert({
                user_id: userId,
                model_id: modelId,
                chat: chat,
                heading: firstMessage
            })
            .select()
            .single()

        if (error) throw error
        return { data, chatId: data.id }
    } catch (error) {
        console.error('Error in createUserChat:', error)
        throw error
    }
}

export async function updateUserChat(chatId: number, newMessages: ChatMessage[]) {
    const supabase = createClient()

    try {
        // Update the chat directly with new messages
        const { error: updateError } = await supabase
            .from('user_chat')
            .update({ chat: newMessages })
            .eq('id', chatId)

        if (updateError) throw updateError

        return { success: true }
    } catch (error) {
        console.error('Error in updateUserChat:', error)
        throw error
    }
}

export async function getUserChats(userId: string) {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('user_chat')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error in getUserChats:', error)
        throw error
    }
}

export async function getUserChatById(chatId: number) {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('user_chat')
            .select('*')
            .eq('id', chatId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error in getUserChatById:', error)
        throw error
    }
}

export async function getUserChatsByModel(userId: string, modelId: string) {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('user_chat')
            .select('*')
            .eq('user_id', userId)
            .eq('model_id', modelId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error in getUserChatsByModel:', error)
        throw error
    }
}
