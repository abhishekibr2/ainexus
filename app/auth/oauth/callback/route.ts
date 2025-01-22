import { NextResponse } from 'next/server'
import { getOAuthClient, OAUTH_PROVIDERS } from '@/utils/oauth/oauth-config'
import { storeTokens } from '@/utils/supabase/actions/token-service'
import { createClient } from '@/utils/supabase/server'
import { assignModelToUser } from '@/utils/supabase/actions/user/assignedAgents'
import { cookies } from 'next/headers'

// Ensure the redirect URI is consistent
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/oauth/callback`

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const cookieStore = await cookies()

    try {
        const code = requestUrl.searchParams.get('code')
        const state = requestUrl.searchParams.get('state')
        
        if (!code) {
            return NextResponse.json(
                { error: 'No code provided' },
                { status: 400 }
            )
        }

        let modelId: string | undefined
        let modelData: any
        if (state) {
            try {
                const stateData = JSON.parse(state)
                modelId = stateData.modelId
                modelData = stateData.modelData
            } catch (e) {
                console.error('Failed to parse state:', e)
                return NextResponse.json(
                    { error: 'Invalid state parameter' },
                    { status: 400 }
                )
            }
        }

        // Get the OAuth client
        const client = getOAuthClient(OAUTH_PROVIDERS.GOOGLE_DRIVE)

        // Exchange the authorization code for tokens
        const tokenParams = {
            code,
            redirect_uri: REDIRECT_URI,
        }

        const accessToken = await client.getToken(tokenParams)

        // Create Supabase client with cookie handling
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            console.error('Failed to get user:', userError)
            return NextResponse.redirect(new URL('/auth/auth-error', requestUrl.origin))
        }

        let success = true
        let errorMessage = ''

        // Store the tokens and assign the model
        if (modelId && modelData) {
            try {
                // Store OAuth tokens and get connection ID
                const { connection_id } = await storeTokens(modelId, user.id, {
                    access_token: accessToken.token.access_token,
                    refresh_token: accessToken.token.refresh_token,
                    expires_in: accessToken.token.expires_in,
                    app_id: modelData.appId
                })

                // Assign the model to the user with the connection ID
                await assignModelToUser(
                    user.id,
                    modelData.appId,
                    modelData.name,
                    parseInt(modelId),
                    modelData.description,
                    modelData.instruction,
                    connection_id
                )
            } catch (error) {
                console.error('Failed to store tokens or assign model:', error)
                success = false
                errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }

        // Create response with redirect
        const redirectUrl = new URL('/protected/agents/explore-agents', requestUrl.origin)
        if (modelId) {
            redirectUrl.searchParams.append('model', modelId)
        }
        redirectUrl.searchParams.append('oauth_success', success.toString())
        if (!success && errorMessage) {
            redirectUrl.searchParams.append('oauth_error', errorMessage)
        }
        
        const response = NextResponse.redirect(redirectUrl)

        // Copy over the Supabase session cookie to maintain the session
        const supabaseSessionCookie = cookieStore.get('sb-access-token')
        if (supabaseSessionCookie) {
            response.cookies.set('sb-access-token', supabaseSessionCookie.value, {
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                httpOnly: true
            })
        }

        return response

    } catch (error) {
        console.error('OAuth callback error:', error)
        const redirectUrl = new URL('/protected/agents/explore-agents', requestUrl.origin)
        redirectUrl.searchParams.append('oauth_success', 'false')
        redirectUrl.searchParams.append('oauth_error', 'Authentication failed')
        return NextResponse.redirect(redirectUrl)
    }
} 