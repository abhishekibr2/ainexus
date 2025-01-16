'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Connection, createUserConnection, deleteUserConnection, getApplications, getUserConnections, updateUserConnection } from "@/utils/supabase/actions/user/connections";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EditConnectionDialog } from "./components/edit-connection-dialog";
import { AddConnectionDialog } from "./components/add-connection-dialog";
import { toast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { columns } from "./components/columns";

export default function ConnectionPage() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [applications, setApplications] = useState<{ id: number; name: string; fields: any }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);

    const fetchConnections = async () => {
        try {
            const supabase = createClient();
            const { data: user } = await supabase.auth.getUser();
            const userId = user?.user?.id;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const [connectionsResult, applicationsResult] = await Promise.all([
                getUserConnections(userId),
                getApplications()
            ]);

            if (!connectionsResult.data || !applicationsResult.data) {
                throw new Error("Failed to load data");
            }
            setConnections(connectionsResult.data);
            setApplications(applicationsResult.data);
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

    const handleAddConnection = async (newConnection: { app_id: number; connection_name: string; connection_key: string }) => {
        try {
            const supabase = createClient();
            const { data: user } = await supabase.auth.getUser();
            const userId = user?.user?.id;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const { error } = await createUserConnection(
                userId,
                newConnection.app_id,
                newConnection.connection_name,
                newConnection.connection_key
            );

            if (error) throw error;

            await fetchConnections();
            toast({
                title: 'Connection added successfully',
                description: 'Your new connection has been created.',
            });
        } catch (err) {
            console.error('Error adding connection:', err);
            toast({
                title: 'Failed to add connection',
                description: 'There was an error creating your connection.',
                variant: 'destructive',
            });
        }
    };

    const handleUpdateConnection = async (connectionId: number, data: Partial<Connection>) => {
        try {
            await updateUserConnection(
                connectionId,
                data.connection_key as string,
                data.connection_name
            );
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
                variant: 'destructive',
            });
        }
    };

    const handleDeleteConnection = async (connection: Connection) => {
        setConnectionToDelete(connection);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!connectionToDelete) return;

        try {
            const { error } = await deleteUserConnection(connectionToDelete.id);
            if (error) throw error;

            await fetchConnections();
            toast({
                title: 'Connection deleted successfully',
                description: 'Your connection has been deleted.',
            });
        } catch (err) {
            console.error('Error deleting connection:', err);
            toast({
                title: 'Failed to delete connection',
                description: 'There was an error deleting your connection.',
                variant: 'destructive',
            });
        } finally {
            setDeleteDialogOpen(false);
            setConnectionToDelete(null);
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

    const columnsWithActions = columns.map(column => {
        if (column.accessorKey === 'actions') {
            return {
                ...column,
                cell: ({ row }: { row: { getValue: () => Connection } }) => {
                    const connection = row.getValue();
                    return (
                        <div className="flex items-center gap-2">
                            {connection && (
                                <>
                                    <EditConnectionDialog
                                        connection={connection}
                                        onSave={async (updatedConnection) => {
                                            await handleUpdateConnection(connection.id, updatedConnection);
                                        }}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteConnection(connection)}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    );
                },
            };
        }
        return column;
    });

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Your Connections</h1>
                    <p className="text-sm text-muted-foreground">Manage your connections with AI agents here.</p>
                </div>
                <AddConnectionDialog
                    applications={applications}
                    onAdd={handleAddConnection}
                />
            </div>

            {!connections.length ? (
                <div className="flex items-center justify-center p-8 border rounded-lg">
                    <div className="text-center">
                        <p className="text-lg mb-2">No connections found</p>
                        <p className="text-sm text-muted-foreground">Add a new connection to get started.</p>
                    </div>
                </div>
            ) : (
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
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the connection for {connectionToDelete?.application?.name}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
