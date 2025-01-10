import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user?.email?.toLowerCase() !== "abhishekibr.trainee2@gmail.com") {
        redirect("/protected");
    }

    return <div>{children}</div>
}