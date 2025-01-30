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
    description: z.string().min(0, {
        message: "Description must be at least 10 characters.",
    }).max(500, {
        message: "Description must not be longer than 500 characters.",
    }).optional(),
    icon: z.string(),
    is_auth: z.boolean(),
    override_config: z.any().nullable(),
    created_by: z.string().uuid(),
    app_id: z.number().int().nullable(),
    permission: z.object({
        type: z.enum(['global', 'restricted']),
        restricted_to: z.array(z.enum(['user', 'workspace'])).optional(),
        restricted_users: z.array(z.string()).optional(),
        restricted_workspaces: z.array(z.number()).optional()
    }).optional(),
    chatflow_id: z.string(),
});

type ModelFormValues = Omit<z.infer<typeof modelFormSchema>, 'id' | 'created_at' | 'created_by'>;

export async function createModel(data: ModelFormValues, userId: string) {
    const supabase = createClient()

    // First validate the data
    const validatedData = modelFormSchema.omit({ id: true, created_at: true, created_by: true }).parse(data);

    // Always store the permission object with proper type and empty arrays for global
    const permission = validatedData.permission?.type === 'global'
        ? {
            type: 'global',
            restricted_to: [],
            restricted_users: [],
            restricted_workspaces: []
        }
        : validatedData.permission;

    const { error } = await supabase
        .from('assistant')
        .insert({
            name: validatedData.name,
            description: validatedData.description || null,
            icon: validatedData.icon,
            is_auth: validatedData.is_auth,
            chatflow_id: validatedData.chatflow_id,
            override_config: validatedData.override_config ? JSON.stringify(validatedData.override_config) : JSON.stringify({ "sessionId": "{sessionId}" }),
            created_by: userId,
            app_id: validatedData.app_id,
            permission: permission
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

    // Always store the permission object with proper type and empty arrays for global
    const permission = validatedData.permission?.type === 'global'
        ? {
            type: 'global',
            restricted_to: [],
            restricted_users: [],
            restricted_workspaces: []
        }
        : validatedData.permission;

    const { error } = await supabase
        .from('assistant')
        .update({
            name: validatedData.name,
            description: validatedData.description,
            icon: validatedData.icon,
            is_auth: validatedData.is_auth,
            chatflow_id: validatedData.chatflow_id,
            override_config: validatedData.override_config,
            app_id: validatedData.app_id,
            permission: permission
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
        .select(`
            *,
            application:app_id (
                fields,
                o_auth,
                provider
            ),
            created_by:user (
                name
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.log(error)
        throw error
    }

    // Transform the data to include fields directly in the model
    const transformedData = data.map(model => ({
        ...model,
        fields: model.application?.fields || [],
        o_auth: model.application?.o_auth || false,
        provider: model.application?.provider || null,
        application: undefined // Remove the nested application object
    }));

    return transformedData
}

export async function getModel(modelId: number, userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('assistant')
        .select(`
            *,
            application:app_id (
                fields
            )
        `)
        .eq('id', modelId)
        .eq('created_by', userId) // Ensure user owns the model
        .single()

    if (error) {
        console.log(error)
        throw error
    }

    // Transform the data to include fields directly in the model
    const transformedData = {
        ...data,
        fields: data.application?.fields || [],
        application: undefined // Remove the nested application object
    };

    return transformedData
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
