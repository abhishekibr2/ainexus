"use server"

import { getAuthorizationUrl, OAUTH_PROVIDERS } from "@/utils/oauth/oauth-config"

interface ModelData {
    id: number;
    appId: number;
    name: string;
    description?: string;
    instruction?: string;
}

export async function signInWithGoogle(model: ModelData) {
    try {
        const state = JSON.stringify({
            modelId: model.id.toString(),
            modelData: {
                appId: model.appId,
                name: model.name,
                description: model.description,
                instruction: model.instruction
            }
        })
        const url = getAuthorizationUrl(OAUTH_PROVIDERS.GOOGLE_DRIVE, state)
        return url
    } catch (error) {
        console.error('Failed to get authorization URL:', error)
        throw error
    }
} 