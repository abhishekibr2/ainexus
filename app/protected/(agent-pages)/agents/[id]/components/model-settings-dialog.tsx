'use client';

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/utils/supabase/client";
import { getUserConnections, Connection } from "@/utils/supabase/actions/user/connections";
import { getUserAssignedModel } from "@/utils/supabase/actions/user/assignedAgents";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bot, MessageSquare, FileText, Info, Lock, Check, Key, Save, Trash2, Pencil, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { EditConnectionDialog } from "@/app/protected/(agent-pages)/connections/components/edit-connection-dialog";
import { updateUserConnection } from "@/utils/supabase/actions/user/connections";
import { getStarterPrompts, removeStarterPrompt } from "@/utils/supabase/actions/user/starterPrompts";

const settingsFormSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    user_connection_id: z.number().optional()
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface Model {
    id: number;
    name: string;
    description: string;
    icon: string;
    is_auth: boolean;
    app_id: number;
    fields?: string[];
    o_auth: boolean;
}

interface ModelSettingsDialogProps {
    model: Model;
    connectionKeys: any;
    onDelete: () => Promise<void>;
    onSave: (settings: any) => Promise<void>;
    isAdmin: boolean;
    onConnectionKeysChange: (keys: any) => void;
}

export function ModelSettingsDialog({
    model,
    connectionKeys,
    onDelete,
    onSave,
    isAdmin,
    onConnectionKeysChange
}: ModelSettingsDialogProps) {
    const { toast } = useToast();
    const params = useParams();
    const id = params?.id as string;
    const [isDeleting, setIsDeleting] = useState(false);
    const [availableConnections, setAvailableConnections] = useState<Connection[]>([]);
    const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
    const [connectionFieldValues, setConnectionFieldValues] = useState<Record<string, string>>({});
    const [starterPrompts, setStarterPrompts] = useState<string[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            name: model.name,
            description: model.description,
            instructions: "",
            user_connection_id: undefined
        }
    });

    useEffect(() => {
        if (selectedConnectionId) {
            form.setValue('user_connection_id', selectedConnectionId);
        }
    }, [selectedConnectionId, form]);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: connections } = await getUserConnections(user.id);
                if (connections) {
                    const appConnections = connections.filter(conn => conn.app_id === model.app_id);
                    setAvailableConnections(appConnections);

                    const modelData = await getUserAssignedModel(id);
                    if (modelData?.user_connection_id) {
                        setSelectedConnectionId(modelData.user_connection_id);
                        const currentConnection = appConnections.find(conn => 
                            conn.id === modelData.user_connection_id);
                        if (currentConnection?.parsedConnectionKeys) {
                            const values = Object.fromEntries(
                                currentConnection.parsedConnectionKeys.map((pair: { key: string; value: string }) => [pair.key, pair.value])
                            );
                            setConnectionFieldValues(values);
                            onConnectionKeysChange({
                                ...values,
                                connection_id: currentConnection.id
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching connections:', error);
            }
        };

        if (model.is_auth) {
            fetchConnections();
        }
    }, [model, id, onConnectionKeysChange]);

    useEffect(() => {
        const fetchStarterPrompts = async () => {
            try {
                const prompts = await getStarterPrompts(id);
                setStarterPrompts(prompts);
            } catch (error) {
                console.error('Error fetching starter prompts:', error);
            }
        };

        fetchStarterPrompts();
    }, [id, refreshKey]);

    const handleConnectionChange = (value: string) => {
        const selectedConn = availableConnections.find(
            conn => conn.id === parseInt(value)
        );

        if (selectedConn?.parsedConnectionKeys) {
            const values = Object.fromEntries(
                selectedConn.parsedConnectionKeys.map(({ key, value }) => [key, value])
            );
            
            setConnectionFieldValues(values);
            setSelectedConnectionId(selectedConn.id);
            
            onConnectionKeysChange({
                ...values,
                connection_id: selectedConn.id
            });
        }
    };

    const onSubmit = async (data: SettingsFormValues) => {
        try {
            await onSave({
                ...data,
                user_connection_id: selectedConnectionId
            });
            
            toast({
                title: "Success",
                description: "Settings updated successfully",
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeletePrompt = async (index: number) => {
        try {
            await removeStarterPrompt(id, index);
            setStarterPrompts(prev => prev.filter((_, i) => i !== index));
            toast({
                title: "Success",
                description: "Prompt deleted successfully.",
                variant: "default"
            });
        } catch (error) {
            console.error('Error deleting prompt:', error);
            toast({
                title: "Error",
                description: "Failed to delete prompt.",
                variant: "destructive"
            });
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Agent Settings</DialogTitle>
                    <DialogDescription>
                        Configure your agent settings and connections
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <div className="space-y-6">
                        <Tabs defaultValue="general" className="mt-4">
                            <TabsList className={`grid w-full ${model.is_auth && !model.o_auth ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                <TabsTrigger value="general">General</TabsTrigger>
                                {model.is_auth && !model.o_auth && (
                                    <TabsTrigger value="connection">Connection</TabsTrigger>
                                )}
                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                                <TabsTrigger value="prompts">Starter Prompts</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-4 mt-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-base font-semibold">Basic Information</FormLabel>
                                    </div>
                                    <div className="rounded-lg border bg-card p-4 space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <Label className="text-sm font-medium flex items-center gap-2">
                                                            <Bot className="h-4 w-4 text-muted-foreground" />
                                                            Agent Name
                                                        </Label>
                                                        <div className="text-xs text-muted-foreground">
                                                            Enter a unique name
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={model.name}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <Label className="text-sm font-medium flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                            Description
                                                        </Label>
                                                        <div className="text-xs text-muted-foreground">
                                                            Describe the agent's purpose
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder={model.description}
                                                            className="min-h-[100px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                                            <Info className="h-4 w-4 flex-shrink-0" />
                                            <span>
                                                These settings help identify and describe your agent.
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </TabsContent>

                            <TabsContent value="connection" className="space-y-4 mt-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    {model.is_auth ? (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="user_connection_id"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <FormLabel className="text-base font-semibold">Connection Configuration</FormLabel>
                                                        </div>
                                                        <div className="rounded-lg border bg-card p-4 space-y-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium">Select Connection</Label>
                                                                <Select
                                                                    value={selectedConnectionId?.toString() || ""}
                                                                    onValueChange={handleConnectionChange}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Choose a connection to configure this agent" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableConnections.map((conn) => (
                                                                            <SelectItem 
                                                                                key={conn.id} 
                                                                                value={conn.id.toString()}
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    {conn.id === selectedConnectionId && (
                                                                                        <Check className="h-4 w-4 text-green-500" />
                                                                                    )}
                                                                                    {conn.connection_name}
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-base font-semibold">Connection Status</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        {selectedConnectionId && (
                                                            <>
                                                                <div className="rounded-full bg-green-50 dark:bg-green-900/20 px-3 py-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                                                                    <Check className="h-3 w-3" />
                                                                    Active Connection
                                                                </div>
                                                                {selectedConnectionId && (
                                                                    <EditConnectionDialog 
                                                                        connection={availableConnections.find(conn => conn.id === selectedConnectionId)!}
                                                                        onSave={async (updatedConnection) => {
                                                                            try {
                                                                                // Update the connection in the database
                                                                                const { data: updatedData, error } = await updateUserConnection(
                                                                                    selectedConnectionId!,
                                                                                    updatedConnection.connection_key,
                                                                                    updatedConnection.connection_name
                                                                                );
                                                                                
                                                                                if (error) throw error;

                                                                                // Refresh connections after the connection is updated
                                                                                const supabase = createClient();
                                                                                const { data: { user } } = await supabase.auth.getUser();
                                                                                if (!user) return;
                                                                                
                                                                                const { data: connections } = await getUserConnections(user.id);
                                                                                if (connections) {
                                                                                    const appConnections = connections.filter(conn => conn.app_id === model.app_id);
                                                                                    setAvailableConnections(appConnections);
                                                                                    
                                                                                    // Find and update the current connection values
                                                                                    const updatedConn = appConnections.find(conn => conn.id === selectedConnectionId);
                                                                                    if (updatedConn?.parsedConnectionKeys) {
                                                                                        const values = Object.fromEntries(
                                                                                            updatedConn.parsedConnectionKeys.map((pair: { key: string; value: string }) => [pair.key, pair.value])
                                                                                        );
                                                                                        setConnectionFieldValues(values);
                                                                                        onConnectionKeysChange({
                                                                                            ...values,
                                                                                            connection_id: updatedConn.id
                                                                                        });
                                                                                    }
                                                                                }
                                                                            } catch (error) {
                                                                                console.error('Error updating connection:', error);
                                                                                toast({
                                                                                    title: "Error",
                                                                                    description: "Failed to update connection. Please try again.",
                                                                                    variant: "destructive",
                                                                                });
                                                                            }
                                                                        }}
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border bg-card p-4 space-y-4">
                                                    {selectedConnectionId ? (
                                                        <div className="space-y-3">
                                                            {model.fields?.map((fieldName, index) => (
                                                                <motion.div
                                                                    key={index}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: index * 0.1 }}
                                                                >
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <Label className="text-sm font-medium flex items-center gap-2">
                                                                            <Key className="h-4 w-4 text-muted-foreground" />
                                                                            {fieldName}
                                                                        </Label>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            Managed via Connections
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        className="relative rounded-md border bg-muted/30 shadow-sm cursor-not-allowed"
                                                                        title="This value is managed through the Connections page"
                                                                    >
                                                                        <div className="flex items-center">
                                                                            <div className="w-full px-3 py-2 text-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Check className="h-4 w-4 text-green-500" />
                                                                                    <span className="font-medium text-muted-foreground">
                                                                                        ••••••••••••
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="border-l px-3 py-2">
                                                                                <Lock className="h-4 w-4 text-muted-foreground" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                                                                <Info className="h-4 w-4 flex-shrink-0" />
                                                                <span>
                                                                    These values are managed through the Connections page.
                                                                    To modify them, please visit the{" "}
                                                                    <Link href="/protected/connections" className="text-blue-500 hover:underline">
                                                                        Connections
                                                                    </Link>
                                                                    {" "}section.
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="flex flex-col items-center justify-center py-6 text-center space-y-4"
                                                        >
                                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                                <Settings className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h3 className="font-semibold">No Connection Selected</h3>
                                                                <p className="text-sm text-muted-foreground max-w-sm">
                                                                    Select a connection above to configure this agent's authentication settings
                                                                </p>
                                                            </div>
                                                            <Link href="/protected/connections">
                                                                Manage Connections
                                                            </Link>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center p-4 text-muted-foreground"
                                        >
                                            This agent does not require any connection settings.
                                        </motion.div>
                                    )}
                                </motion.div>
                            </TabsContent>

                            <TabsContent value="advanced" className="space-y-4 mt-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-base font-semibold">Advanced Configuration</FormLabel>
                                    </div>
                                    <div className="rounded-lg border bg-card p-4 space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="instructions"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <Label className="text-sm font-medium flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                            Custom Instructions
                                                        </Label>
                                                        <div className="text-xs text-muted-foreground">
                                                            Customize agent behavior
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter custom instructions for the agent..."
                                                            className="min-h-[100px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                                            <Info className="h-4 w-4 flex-shrink-0" />
                                            <span>
                                                Custom instructions allow you to define specific behaviors and rules for your agent.
                                            </span>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                        Clear Agent Memory
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Reset the agent's memory and start fresh
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        toast({
                                                            title: "Success",
                                                            description: "Agent memory cleared successfully",
                                                        });
                                                    }}
                                                >
                                                    Clear Memory
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                        Delete Agent
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Permanently delete this agent and all its data
                                                    </p>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting ? "Deleting..." : "Delete Agent"}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the agent
                                                                and remove all associated data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                onClick={async () => {
                                                                    setIsDeleting(true);
                                                                    await onDelete();
                                                                    setIsDeleting(false);
                                                                }}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </TabsContent>

                            <TabsContent value="prompts" className="space-y-4 mt-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-base font-semibold">Saved Starter Prompts</FormLabel>
                                    </div>
                                    <div className="rounded-lg border bg-card p-4 space-y-4">
                                        {starterPrompts.length > 0 ? (
                                            <div className="space-y-3">
                                                {starterPrompts.map((prompt, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="group relative rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-start gap-2">
                                                                <Sparkles className="h-4 w-4 text-muted-foreground mt-1" />
                                                                <p className="text-sm">{prompt}</p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleDeletePrompt(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col items-center justify-center py-6 text-center space-y-4"
                                            >
                                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="font-semibold">No Starter Prompts</h3>
                                                    <p className="text-sm text-muted-foreground max-w-sm">
                                                        Save prompts during chat by clicking the three dots next to your messages.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                                            <Info className="h-4 w-4 flex-shrink-0" />
                                            <span>
                                                Starter prompts help you quickly access commonly used messages.
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end mt-6">
                            <Button type="button" onClick={form.handleSubmit(onSubmit)}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
} 