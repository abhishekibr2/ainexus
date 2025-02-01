import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AccessDenied() {
    const router = useRouter();
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <div className="text-muted-foreground mb-4">
                    You don't have access to this agent. Please purchase this agent from the marketplace.
                </div>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        </div>
    );
} 