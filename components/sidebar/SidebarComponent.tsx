import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";



export default async function SidebarComponent({ children }: { children: React.ReactNode }) {

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return <div className="flex flex-col items-center justify-center h-screen">{children}</div>
    }

    return (
        <SidebarProvider className="max-w-full max-h-full">
            <AppSidebar user={user} />
            <SidebarInset>
                <SidebarTrigger className="sticky top-0" />
                {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
