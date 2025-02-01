import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Connection, ConnectionKeyPair } from "@/utils/supabase/actions/user/connections";
import { EditConnectionDialog } from "./edit-connection-dialog";

type Column = {
    accessorKey: keyof Connection | 'application.name' | 'actions';
    header: string;
    cell?: ({ row }: { row: { getValue: () => Connection } }) => React.ReactNode;
};

export const columns: Column[] = [
    {
        accessorKey: "application.name",
        header: "Application",
        cell: ({ row }) => {
            const connection = row.getValue();
            return connection.application?.name || 'Unknown App';
        },
    },
    {
        accessorKey: "connection_name",
        header: "Name",
        cell: ({ row }) => {
            const connection = row.getValue();
            return connection.connection_name;
        },
    },
    {
        accessorKey: "connection_key",
        header: "Connection Key",
        cell: ({ row }) => {
            const connection = row.getValue();
            const keyPairs = connection.parsedConnectionKeys || [];
            
            return (
                <div className="flex flex-wrap gap-2">
                    {keyPairs.map((keyPair: ConnectionKeyPair, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                            <span className="font-semibold">{keyPair.key}:</span>
                            <span className="ml-1">••••••••</span>
                        </Badge>
                    ))}
                </div>
            );
        },
    },
    {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
            const connection = row.getValue();
            return format(new Date(connection.created_at), "PPpp");
        },
    },
    {
        accessorKey: "updated_at",
        header: "Updated At",
        cell: ({ row }) => {
            const connection = row.getValue();
            return format(new Date(connection.updated_at), "PPpp");
        },
    },
    {
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const connection = row.getValue();
            return (
                <EditConnectionDialog
                    connection={connection}
                    onSave={async (updatedConnection) => {
                        // TODO: Implement save functionality
                    }}
                />
            );
        },
    },
]; 