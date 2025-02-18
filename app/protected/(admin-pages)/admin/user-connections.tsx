'use client';

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Connection, updateUserConnection, getUserConnections } from "@/utils/supabase/actions/user/connections";
import { EditConnectionDialog } from "./components/EditConnectionDialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const MotionTableRow = motion(TableRow);

const item = {
    hidden: { y: 20, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

const ConnectionSkeletonRow = () => (
    <MotionTableRow
        variants={item}
        initial="hidden"
        animate="show"
        exit="hidden"
    >
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
    </MotionTableRow>
);

function parseConnectionKeyString(keyString: string | string[]): { key: string; value: string }[] {
    try {
        // If it's already an array from the database
        if (Array.isArray(keyString)) {
            return keyString
                .filter(Boolean)
                .map(pair => {
                    const [key, value] = pair.split('=').map(s => s.trim());
                    return { key: key || '', value: value || '' };
                });
        }

        // If it's a string in PostgreSQL array format
        if (typeof keyString === 'string') {
            if (keyString.startsWith('{') && keyString.endsWith('}')) {
                const cleanString = keyString.slice(1, -1); // Remove { }
                if (!cleanString) return [];

                return cleanString
                    .split(',')
                    .filter(Boolean)
                    .map(pair => {
                        const cleanPair = pair.replace(/^"|"$/g, '').trim(); // Remove quotes
                        const [key, value] = cleanPair.split('=').map(s => s.trim());
                        return { key: key || '', value: value || '' };
                    });
            }

            // If it's a JSON string
            try {
                const parsed = JSON.parse(keyString);
                if (Array.isArray(parsed)) {
                    return parsed
                        .filter(Boolean)
                        .map(pair => {
                            const [key, value] = (pair as string).split('=').map((s: string) => s.trim());
                            return { key: key || '', value: value || '' };
                        });
                }

                // If it's an object
                return Object.entries(parsed)
                    .filter(([key, value]) => key && value)
                    .map(([key, value]) => ({
                        key,
                        value: String(value).trim()
                    }));
            } catch {
                // If JSON parsing fails, try direct key=value format
                if (keyString.includes('=')) {
                    const [key, value] = keyString.split('=').map(s => s.trim());
                    return [{ key: key || '', value: value || '' }];
                }
            }
        }

        return [];
    } catch (error) {
        console.error('Error parsing connection key:', error);
        return [];
    }
}

export function UserConnections() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [userEmails, setUserEmails] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const fetchUserEmails = async (userIds: string[]) => {
        const supabase = createClient();
        const uniqueUserIds = Array.from(new Set(userIds));
        const emailMap: { [key: string]: string } = {};

        for (const userId of uniqueUserIds) {
            const { data } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', userId)
                .single();
            if (data?.full_name) {
                emailMap[userId] = data.full_name;
            }
        }

        setUserEmails(emailMap);
    };

    const fetchAllConnections = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('user_connection')
                .select(`
                    *,
                    application:app_id (
                        id,
                        name
                    )
                `);

            if (data) {
                const connectionsWithParsedKeys = data.map((connection) => ({
                    ...connection,
                    parsedConnectionKeys: connection.connection_key ? 
                        parseConnectionKeyString(connection.connection_key) : 
                        []
                })) as Connection[];
                setConnections(connectionsWithParsedKeys);

                // Fetch emails for all users
                const userIds = connectionsWithParsedKeys.map(conn => conn.user_id);
                await fetchUserEmails(userIds);
            }
        } catch (error) {
            console.error('Error fetching connections:', error);
            toast({
                title: "Error",
                description: "Failed to load connections",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllConnections();
    }, []);

    const handleUpdateConnection = async (connectionId: number, data: Partial<Connection>) => {
        try {
            await updateUserConnection(connectionId, data.connection_key as string);
            await fetchAllConnections(); // Refresh the list after update

            toast({
                title: "Success",
                description: "Connection updated successfully",
            });
        } catch (error) {
            console.error('Error updating connection:', error);
            toast({
                title: "Error",
                description: "Failed to update connection",
                variant: "destructive",
            });
        }
    };

    const filteredConnections = connections.filter(conn =>
        conn.application?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (userEmails[conn.user_id]?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Connections</h2>
                <Input
                    placeholder="Search by app name or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Application</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Connection Name</TableHead>
                        <TableHead>Connection Keys</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Updated At</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <>
                                <ConnectionSkeletonRow />
                                <ConnectionSkeletonRow />
                                <ConnectionSkeletonRow />
                            </>
                        ) : connections.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    No connections found
                                </TableCell>
                            </TableRow>
                        ) : (
                            connections.map((connection) => (
                                <MotionTableRow
                                    key={connection.id}
                                    variants={item}
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                >
                                    <TableCell>{connection.application?.name}</TableCell>
                                    <TableCell className="font-mono text-sm">
                                        <div className="flex items-center gap-2">
                                            {userEmails[connection.user_id] || connection.user_id}
                                            {!userEmails[connection.user_id] && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Showing user ID as fallback. User name will be available once set in the profile section.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{connection.connection_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            {connection.parsedConnectionKeys?.map((keyPair, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                    <span className="font-semibold">{keyPair.key}:</span>
                                                    <span className="ml-1">{'•'.repeat(8)}</span>
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(connection.created_at), "PPpp")}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(connection.updated_at), "PPpp")}
                                    </TableCell>
                                    <TableCell>
                                        <EditConnectionDialog
                                            connection={connection}
                                            onSave={async (updatedConnection) => {
                                                await handleUpdateConnection(connection.id, updatedConnection);
                                            }}
                                        />
                                    </TableCell>
                                </MotionTableRow>
                            ))
                        )}
                    </AnimatePresence>
                </TableBody>
            </Table>
        </div>
    );
}