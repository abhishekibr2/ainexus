"use server"

import { z } from "zod"
import { createClient } from "../client"

// Schema for creating new applications
const createApplicationSchema = z.object({
    name: z.string(),
    description: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
    auth_required: z.boolean(),
    fields: z.array(z.string()),
    o_auth: z.boolean(),
    provider: z.string().optional().nullable(),
});

type CreateApplicationValues = z.infer<typeof createApplicationSchema>;

// Schema for full application (including server-generated fields)
const applicationSchema = createApplicationSchema.extend({
    id: z.number(),
    created_at: z.string().datetime(),
});

type Application = z.infer<typeof applicationSchema>;

export async function createApplication(data: CreateApplicationValues) {
    const supabase = createClient()

    // Validate the data
    const validatedData = createApplicationSchema.parse({
        ...data,
        description: data.description || null,
        logo: data.logo || null,
        fields: data.fields || [],
    });

    const { data: newApplication, error } = await supabase
        .from('application')
        .insert([validatedData])
        .select()
        .single()

    if (error) {
        console.error(error)
        throw error
    }

    return newApplication
}

export async function updateApplication(applicationId: number, data: CreateApplicationValues) {
    const supabase = createClient()

    // Validate the data
    const validatedData = createApplicationSchema.parse({
        ...data,
        description: data.description || null,
        logo: data.logo || null,
        fields: data.fields || [],
    });

    const { data: updatedApplication, error } = await supabase
        .from('application')
        .update(validatedData)
        .eq('id', applicationId)
        .select()
        .single()

    if (error) {
        console.error(error)
        throw error
    }

    return updatedApplication
}

export async function deleteApplication(applicationId: number) {
    const supabase = createClient()

    const { error } = await supabase
        .from('application')
        .delete()
        .eq('id', applicationId)

    if (error) {
        console.error(error)
        throw error
    }

    return { success: true }
}

export async function getApplications() {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('application')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error(error)
        throw error
    }

    return data
}

export async function getApplication(applicationId: number) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('application')
        .select('*')
        .eq('id', applicationId)
        .single()

    if (error) {
        console.error(error)
        throw error
    }

    return data
}
