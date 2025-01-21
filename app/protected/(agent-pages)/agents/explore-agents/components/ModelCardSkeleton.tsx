import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ModelCardSkeleton: React.FC = () => (
    <Card className="p-6">
        <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </div>
    </Card>
); 