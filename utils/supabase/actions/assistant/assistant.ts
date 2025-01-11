"use server"

import { z } from "zod"
import { createClient } from "../../client"

// Updated schema matching the exact database fields from the screenshot
const modelFormSchema = z.object({
    id: z.number().int(),
    created_at: z.string().datetime(),
    name: z.string().min(2, {
        message: "Model name must be at least 2 characters.",
    }).max(50, {
        message: "Model name must not be longer than 50 characters.",
    }),
    description: z.string().min(10, {
        message: "Description must be at least 10 characters.",
    }).max(500, {
        message: "Description must not be longer than 500 characters.",
    }),
    icon: z.string(),
    is_auth: z.boolean(),
    code: z.string().optional(),
    created_by: z.string().uuid(),
    app_id: z.number().int(),
});

type ModelFormValues = Omit<z.infer<typeof modelFormSchema>, 'id' | 'created_at' | 'created_by'>;

export async function createModel(data: ModelFormValues, userId: string) {
    const supabase = createClient()
    
    // First validate the data
    const validatedData = modelFormSchema.omit({ id: true, created_at: true, created_by: true }).parse(data);
    
    const { error } = await supabase
        .from('assistant')
        .insert({
            name: validatedData.name,
            description: validatedData.description,
            icon: validatedData.icon,
            is_auth: validatedData.is_auth,
            code: validatedData.code,
            created_by: userId,
            app_id: validatedData.app_id,
        })

    if (error) {
        console.log(error)
        throw error
    }
    
    return { success: true }
}

export async function updateModel(modelId: number, data: ModelFormValues, userId: string) {
    const supabase = createClient()
    
    // First validate the data
    const validatedData = modelFormSchema.omit({ id: true, created_at: true, created_by: true }).parse(data);
    
    const { error } = await supabase
        .from('assistant')
        .update({
            name: validatedData.name,
            description: validatedData.description,
            icon: validatedData.icon,
            is_auth: validatedData.is_auth,
            code: validatedData.code,
            app_id: validatedData.app_id,
        })
        .eq('id', modelId)
        .eq('created_by', userId) // Ensure user owns the model

    if (error) {
        console.log(error)
        throw error
    }
    
    return { success: true }
}

export async function deleteModel(modelId: number, userId: string) {
    const supabase = createClient()
    
    const { error } = await supabase
        .from('assistant')
        .delete()
        .eq('id', modelId)
        .eq('created_by', userId) // Ensure user owns the model

    if (error) {
        console.log(error)
        throw error
    }
    
    return { success: true }
}

export async function getModels(userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
        .from('assistant')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.log(error)
        throw error
    }
    
    return data
}

export async function getModel(modelId: number, userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
        .from('assistant')
        .select('*')
        .eq('id', modelId)
        .eq('created_by', userId) // Ensure user owns the model
        .single()

    if (error) {
        console.log(error)
        throw error
    }
    
    return data
}

export async function getApplications() {
    const supabase = createClient()
    
    const { data, error } = await supabase
        .from('application')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.log(error)
        throw error
    }
    
    return data
}
