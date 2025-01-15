"use server"

import { z } from "zod"
import { createClient } from "../../client"

const profileFormSchema = z.object({
    username: z
        .string()
        .min(2, {
            message: "Username must be at least 2 characters.",
        })
        .max(30, {
            message: "Username must not be longer than 30 characters.",
        }),
    bio: z.string().max(160).min(4),
})

const displayFormSchema = z.object({
    items: z.array(z.string()).refine((value) => value.some((item) => item), {
        message: "You have to select at least one item.",
    }),
})

const appearanceFormSchema = z.object({
    theme: z.enum(["light", "dark"], {
        required_error: "Please select a theme.",
    }),
    font: z.enum(["inter", "manrope", "system"], {
        invalid_type_error: "Select a font",
        required_error: "Please select a font.",
    }),
})

const accountFormSchema = z.object({
    name: z
        .string()
        .min(2, {
            message: "Name must be at least 2 characters.",
        })
        .max(30, {
            message: "Name must not be longer than 30 characters.",
        }),
    dob: z.date({
        required_error: "A date of birth is required.",
    }),
    language: z.string({
        required_error: "Please select a language.",
    }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type DisplayFormValues = z.infer<typeof displayFormSchema>
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>
type AccountFormValues = z.infer<typeof accountFormSchema>

export async function updateProfile(data: ProfileFormValues, userId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('user')
        .upsert({
            id: userId,
            username: data.username,
            bio: data.bio,
        })

    if (error) { console.log(error); throw error }
    return { success: true }
}

export async function updateDisplay(data: DisplayFormValues, userId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('user')
        .upsert({
            id: userId,
            sidebar: data.items
        })

    if (error) { console.log(error); throw error }
    return { success: true }
}

export async function updateAppearance(data: AppearanceFormValues, userId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('user')
        .upsert({
            id: userId,
            theme: data.theme,
            font: data.font
        })

    if (error) { console.log(error); throw error }
    return { success: true }
}

export async function updateAccount(data: AccountFormValues, userId: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('user')
        .upsert({
            id: userId,
            name: data.name,
            dob: data.dob.toISOString(),
            language: data.language
        })

    if (error) { console.log(error); throw error }
    return { success: true }
}

export async function getProfile(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('user')
        .select()
        .eq('id', userId)
        .single()
    if (error) {
        const { data, error } = await supabase.from('user').insert({ id: userId })
        if (error) {
            console.log(error); throw error
        }
        return data
    }
    return data
}
