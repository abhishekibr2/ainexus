import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function SidebarComponent({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return <div className="flex flex-col items-center justify-center h-screen">{children}</div>
    }

    // Serialize the user data
    const serializedUser = {
        id: user.id,
        email: user.email,
        user_metadata: {
            avatar_url: user.user_metadata?.avatar_url || null,
            email: user.user_metadata?.email || null,
            name: user.user_metadata?.name || null,
        }
    };

    // Convert to plain JavaScript object
    const plainUser = JSON.parse(JSON.stringify(serializedUser));

    return (
        <SidebarProvider className="max-w-full max-h-full">
            <AppSidebar user={plainUser} />
            <SidebarInset>
                <SidebarTrigger className="sticky top-0" />
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
