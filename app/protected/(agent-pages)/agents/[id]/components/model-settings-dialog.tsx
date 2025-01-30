'use client';

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/utils/supabase/client";
import { getUserConnections, Connection, updateGoogleDriveToken } from "@/utils/supabase/actions/user/connections";
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
import { Settings, Bot, MessageSquare, FileText, Info, Lock, Check, Key, Save, Trash2, Pencil, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { EditConnectionDialog } from "@/app/protected/(agent-pages)/connections/components/edit-connection-dialog";
import { updateUserConnection } from "@/utils/supabase/actions/user/connections";
import { getStarterPrompts, removeStarterPrompt } from "@/utils/supabase/actions/user/starterPrompts";
import { SheetSettingsDialog } from "./sheet-settings-dialog";
import { OAUTH_PROVIDERS, refreshAccessToken } from "@/utils/oauth/oauth-config";

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
    user_connection_id: string;
}

interface GoogleSheet {
    id: string;
    name: string;
}

interface ModelSettingsDialogProps {
    model: Model;
    connectionKeys: any;
    onDelete: () => Promise<void>;
    onSave: (settings: any) => Promise<void>;
    isAdmin: boolean;
    onConnectionKeysChange: (keys: any) => void;
}

async function fetchGoogleSheets(accessToken: string, user_connection_id: string): Promise<GoogleSheet[]> {
    try {
        let response = await fetch(
            'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        if (response.status === 401) {
            const newAccessToken = await refreshAccessToken(OAUTH_PROVIDERS.GOOGLE_DRIVE, accessToken);
            console.log("new access token: ", newAccessToken)
            await updateGoogleDriveToken(parseInt(user_connection_id), newAccessToken.access_token, newAccessToken.refresh_token);
            response = await fetch(
                'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27',
                {
                    headers: {
                        'Authorization': `Bearer ${newAccessToken}`
                    }
                }
            );
        }
        else if (!response.ok) {
            throw new Error('Failed to fetch sheets');
        }
        
        const data = await response.json();
        return data.files.map((file: any) => ({
            id: file.id,
            name: file.name
        }));
    } catch (error) {
        console.error('Error fetching sheets:', error);
        return [];
    }
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
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [loadingSheets, setLoadingSheets] = useState(false);
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);

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

    useEffect(() => {
        const loadSheets = async () => {
            if (selectedConnectionId && model.o_auth) {
                setLoadingSheets(true);
                try {
                    const currentConnection = availableConnections.find(
                        conn => conn.id === selectedConnectionId
                    );
                    
                    if (currentConnection?.parsedConnectionKeys) {
                        const accessToken = currentConnection.parsedConnectionKeys.find(
                            pair => pair.key === 'access_token'
                        )?.value;
                        
                        if (accessToken) {
                            const sheetsList = await fetchGoogleSheets(accessToken, currentConnection.id.toString());
                            setSheets(sheetsList);
                            
                            // Set selected sheet if one is already saved
                            const savedSheetId = currentConnection.parsedConnectionKeys.find(
                                pair => pair.key === 'sheet_id'
                            )?.value;
                            
                            if (savedSheetId) {
                                const savedSheet = sheetsList.find(s => s.id === savedSheetId);
                                if (savedSheet) {
                                    setSelectedSheet(savedSheet);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error loading sheets:', error);
                    toast({
                        title: "Error",
                        description: "Failed to load Google Sheets",
                        variant: "destructive",
                    });
                } finally {
                    setLoadingSheets(false);
                }
            }
        };
        
        loadSheets();
    }, [selectedConnectionId, model.o_auth, availableConnections]);

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

    const handleSheetChange = async (sheetId: string) => {
        const selectedSheet = sheets.find(s => s.id === sheetId);
        if (selectedSheet) {
            const updatedValues = {
                ...connectionFieldValues,
                sheet_id: sheetId,
                sheet_name: selectedSheet.name
            };
            setConnectionFieldValues(updatedValues);
            onConnectionKeysChange({
                ...updatedValues,
                connection_id: selectedConnectionId
            });
        }
    };

    const handleTabChange = async (tab: string) => {
        const updatedValues = {
            ...connectionFieldValues,
            sheet_tab: tab
        };
        setConnectionFieldValues(updatedValues);
        onConnectionKeysChange({
            ...updatedValues,
            connection_id: selectedConnectionId
        });
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
                                        {model.o_auth && selectedConnectionId && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="text-base font-semibold">Google Sheet Settings</FormLabel>
                                                </div>
                                                <div className="rounded-lg border bg-card p-4 space-y-4">
                                                    {loadingSheets ? (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            <span>Loading sheets...</span>
                                                        </div>
                                                    ) : (
                                                        <SheetSettingsDialog
                                                            modelId={model.id}
                                                            sheets={sheets}
                                                            selectedSheetId={connectionFieldValues?.sheet_id}
                                                            selectedTab={connectionFieldValues?.sheet_tab}
                                                            accessToken={connectionFieldValues?.access_token}
                                                            onSheetChange={handleSheetChange}
                                                            onTabChange={handleTabChange}
                                                            connectionId={selectedConnectionId}
                                                        />
                                                    )}
                                                    {connectionFieldValues?.sheet_id && (
                                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                            <Info className="h-4 w-4 flex-shrink-0" />
                                                            <span>
                                                                Current sheet: {connectionFieldValues.sheet_name || connectionFieldValues.sheet_id}
                                                                {connectionFieldValues.sheet_tab && ` (Tab: ${connectionFieldValues.sheet_tab})`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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