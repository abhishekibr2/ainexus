"use server"

import { createClient } from "../../client"

export async function getStarterPrompts(id: string) {
    const supabase = createClient()
    try {
        const { data, error } = await supabase.from('user_assigned_assistants').select('starter_prompts').eq('id', id)
        if (error) {
            console.log(error.message)
            return []
        }
        return data?.[0]?.starter_prompts || []
    } catch (error) {
        console.log(error)
        return []
    }
}

export async function addStarterPrompt(id: string, prompt: string) {
    const supabase = createClient()
    const currentPrompts = await getStarterPrompts(id)
    const updatedPrompts = [...currentPrompts, prompt]

    const { data, error } = await supabase
        .from('user_assigned_assistants')
        .update({ starter_prompts: updatedPrompts })
        .eq('id', id)
        .select()
    if (error) throw error
    return data
}

export async function removeStarterPrompt(id: string, promptIndex: number) {
    const supabase = createClient()
    const currentPrompts = await getStarterPrompts(id)
    const updatedPrompts = currentPrompts.filter((_: string, index: number) => index !== promptIndex)

    const { data, error } = await supabase
        .from('user_assigned_assistants')
        .update({ starter_prompts: updatedPrompts })
        .eq('id', id)
        .select()
    if (error) throw error
    return data
}

export async function updateStarterPrompt(id: string, promptIndex: number, newPrompt: string) {
    const supabase = createClient()
    const currentPrompts = await getStarterPrompts(id)
    const updatedPrompts = [...currentPrompts]
    updatedPrompts[promptIndex] = newPrompt

    const { data, error } = await supabase
        .from('user_assigned_assistants')
        .update({ starter_prompts: updatedPrompts })
        .eq('id', id)
        .select()
    if (error) throw error
    return data
}

export async function createStarterPrompts(userId: string, prompts: string[] = []) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('user_assigned_assistants')
        .insert({ user_id: userId, starter_prompts: prompts })
        .select()
    if (error) throw error
    return data
}
