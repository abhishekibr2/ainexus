import { OAUTH_PROVIDERS, refreshAccessToken } from "@/utils/oauth/oauth-config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { refreshToken, accessToken, connectionId } = await request.json();

        const result = await refreshAccessToken(OAUTH_PROVIDERS.GOOGLE_DRIVE, refreshToken, connectionId);
        return NextResponse.json({ message: result, result: result });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

//api endpoint : /api/refresh-token
