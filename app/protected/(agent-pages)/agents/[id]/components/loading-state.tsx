import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <Skeleton className="h-12 w-64 mb-4" />
                <Skeleton className="h-[600px] w-full rounded-lg" />
            </div>
        </div>
    );
} 