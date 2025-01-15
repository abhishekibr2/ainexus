'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { columns } from "./columns";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Connection, getUserConnections, updateUserConnection } from "@/utils/supabase/actions/user/connections";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EditConnectionDialog } from "./edit-connection-dialog";
import { toast } from "@/hooks/use-toast";

export default function ConnectionPage() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchConnections = async () => {
        try {
            const supabase = createClient();
            const { data: user } = await supabase.auth.getUser();
            const userId = user?.user?.id;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const { data, error } = await getUserConnections(userId);
            if (error) throw error;

            setConnections(data || []);
        } catch (err) {
            console.error('Error in fetchConnections:', err);
            setError(err instanceof Error ? err : new Error('Failed to load connections'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    const handleUpdateConnection = async (connectionId: number, data: Partial<Connection>) => {
        try {
            await updateUserConnection(connectionId, data.connection_key as string);
            await fetchConnections();
            toast({
                title: 'Connection updated successfully',
                description: 'Your connection has been updated.',
            });
        } catch (err) {
            console.error('Error updating connection:', err);
            toast({
                title: 'Failed to update connection',
                description: 'There was an error updating your connection.',
            });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-10">
                <h1 className="text-2xl font-bold mb-6">Your Connections</h1>
                <TableSkeleton columnCount={columns.length} rowCount={5} />
            </div>
        );
    }

    if (error) {
        return <div className="flex items-center justify-center p-8">
            <div className="text-red-500">Error loading connections: {error.message}</div>
        </div>;
    }

    if (!connections.length) {
        return <div className="flex items-center justify-center p-8">
            <div className="text-lg">No connections found</div>
        </div>;
    }

    const columnsWithActions = columns.map(column => {
        if (column.accessorKey === 'actions') {
            return {
                ...column,
                cell: ({ row }: { row: { getValue: () => Connection } }) => {
                    const connection = row.getValue();
                    return (
                        <EditConnectionDialog
                            connection={connection}
                            onSave={async (updatedConnection) => {
                                await handleUpdateConnection(connection.id, updatedConnection);
                            }}
                        />
                    );
                },
            };
        }
        return column;
    });

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold">Your Connections</h1>
            <p className="text-sm text-muted-foreground mb-6">You can manage your connections with AI agents here.</p>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columnsWithActions.map((column) => (
                                <TableHead key={column.accessorKey}>
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {connections?.map((connection) => (
                            <TableRow key={connection.id}>
                                {columnsWithActions.map((column) => {
                                    return (
                                        <TableCell key={column.accessorKey}>
                                            {column.cell
                                                ? column.cell({ row: { getValue: () => connection } })
                                                : column.accessorKey === 'application.name'
                                                    ? connection.application?.name
                                                    : String(connection[column.accessorKey as keyof typeof connection] || '')}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
