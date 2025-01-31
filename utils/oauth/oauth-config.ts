import { AuthorizationCode, OAuthConfig } from 'simple-oauth2'
import { updateGoogleDriveToken } from '../supabase/actions/user/connections'

export const OAUTH_PROVIDERS = {
    GOOGLE_DRIVE: 'google_drive',
} as const

export type OAuthProvider = typeof OAUTH_PROVIDERS[keyof typeof OAUTH_PROVIDERS]


// Verify environment variables are set
if (!process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID environment variable is not set')
}
if (!process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new Error('NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET environment variable is not set')
}
if (!process.env.NEXT_PUBLIC_SITE_URL) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable is not set')
}

// Ensure the redirect URI is consistent
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/oauth/callback`

const GOOGLE_OAUTH_CONFIG: OAuthConfig = {
    client: {
        id: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
        secret: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET,
    },
    auth: {
        tokenHost: 'https://oauth2.googleapis.com',
        tokenPath: '/token',
        authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
}

const SCOPES = {
    [OAUTH_PROVIDERS.GOOGLE_DRIVE]: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/spreadsheets',
    ],
}

export function getOAuthClient(provider: OAuthProvider): AuthorizationCode {
    switch (provider) {
        case OAUTH_PROVIDERS.GOOGLE_DRIVE:
            return new AuthorizationCode(GOOGLE_OAUTH_CONFIG)
        default:
            throw new Error(`Unsupported OAuth provider: ${provider}`)
    }
}

export function getAuthorizationUrl(provider: OAuthProvider, state?: string): string {
    const client = getOAuthClient(provider)
    const scopes = SCOPES[provider]

    return client.authorizeURL({
        redirect_uri: REDIRECT_URI,
        scope: scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state,
    })
}

export async function refreshAccessToken(provider: OAuthProvider, refreshToken: string, connectionId: string): Promise<any> {
    if (provider !== OAUTH_PROVIDERS.GOOGLE_DRIVE) {
        throw new Error(`Unsupported OAuth provider: ${provider}`)
    }
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID!,
                client_secret: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET!,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            }).toString()
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }
        const data = await response.json();
        updateGoogleDriveToken(parseInt(connectionId), data.access_token);
        return data.access_token;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
} 