declare module 'simple-oauth2' {
    export interface OAuthConfig {
        client: {
            id: string;
            secret: string;
        };
        auth: {
            tokenHost: string;
            tokenPath: string;
            authorizePath: string;
        };
    }

    export interface AuthorizeURLParams {
        redirect_uri: string;
        scope: string;
        state?: string;
        access_type?: string;
        prompt?: string;
    }

    export interface TokenConfig {
        code?: string;
        redirect_uri?: string;
        refresh_token?: string;
        grant_type?: string;
    }

    export interface AccessToken {
        token: {
            access_token: string;
            refresh_token?: string;
            expires_in?: number;
            token_type: string;
        };
    }

    export class AuthorizationCode {
        constructor(config: OAuthConfig);
        authorizeURL(params: AuthorizeURLParams): string;
        getToken(params: TokenConfig): Promise<AccessToken>;
    }
} 