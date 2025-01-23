import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { modelId, sheetTab } = await request.json();
        
        if (!modelId || !sheetTab) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = createRouteHandlerClient({ cookies });

        const { error } = await supabase
            .from('models')
            .update({ sheet_tab: sheetTab })
            .eq('id', modelId);

        if (error) {
            console.error('Error updating sheet tab:', error);
            return NextResponse.json(
                { error: 'Failed to update sheet tab' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in update-sheet-tab route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 