import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { createUserConnection, getUserConnections } from "@/utils/supabase/actions/user/connections";
import { getApplications } from "@/utils/supabase/actions/user/connections";
import { AddConnectionDialog } from "../../../connections/components/add-connection-dialog";
import { Model, Connection } from "./types";

// Step form schema
const modelConfigSchema = z.object({
    // Step 1: Basic Configuration
    basic: z.object({
        override_name: z.string().optional(),
        override_description: z.string().optional().or(z.string().min(10, "Description must be at least 10 characters")),
    }),
    // Step 2: Authentication (if required)
    auth: z.object({
        user_connection_id: z.number().optional(),
        config_keys: z.record(z.string(), z.string()).optional()
    }).optional(),
    // Step 3: Advanced Settings
    advanced: z.object({
        override_instructions: z.string().optional(),
        permission_scope: z.enum(["public", "private", "team"]).default("private"),
    }),
});

type ModelConfigValues = z.infer<typeof modelConfigSchema>;

interface ModelConfigFormProps {
    model: Model;
    onSubmit: (data: ModelConfigValues) => void;
    onCancel: () => void;
    handleOAuthLogin?: (provider: string, configData: any) => Promise<void>;
}

export const ModelConfigForm: React.FC<ModelConfigFormProps> = ({ 
    model, 
    onSubmit, 
    onCancel,
    handleOAuthLogin 
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOverrides, setShowOverrides] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [availableConnections, setAvailableConnections] = useState<Connection[]>([]);
    const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
    const [connectionFieldValues, setConnectionFieldValues] = useState<Record<string, string>>({});
    const [applications, setApplications] = useState<{ id: number; name: string; fields: string[] }[]>([]);
    const { toast } = useToast();

    const form = useForm<ModelConfigValues>({
        resolver: zodResolver(modelConfigSchema),
        defaultValues: {
            basic: {
                override_name: `My ${model.name}`,
                override_description: model.description,
            },
            auth: {
                user_connection_id: undefined,
                config_keys: {},
            },
            advanced: {
                override_instructions: "",
                permission_scope: "private",
            },
        },
        context: {
            fields: model.fields || []
        }
    });

    // Reset form values when showOverrides changes
    useEffect(() => {
        if (!showOverrides) {
            form.reset({
                basic: {
                    override_name: `My ${model.name}`,
                    override_description: model.description,
                },
                auth: {
                    user_connection_id: undefined,
                    config_keys: {},
                },
                advanced: {
                    override_instructions: "",
                    permission_scope: "private",
                },
            });
        }
    }, [showOverrides, model, form]);

    // Fetch available connections and applications when the form opens
    useEffect(() => {
        const fetchData = async () => {
            if (!model.is_auth) return;

            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const [connectionsResult, applicationsResult] = await Promise.all([
                    getUserConnections(user.id),
                    getApplications()
                ]);

                if (connectionsResult.data) {
                    // Filter connections for this app type
                    const appConnections = connectionsResult.data.filter(conn => conn.app_id === model.app_id);
                    setAvailableConnections(appConnections);
                }

                if (applicationsResult.data) {
                    setApplications(applicationsResult.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [model]);

    // Handle new connection added
    const handleAddConnection = async (newConnection: { app_id: number; connection_name: string; connection_key: string }) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            if (!userId) {
                throw new Error("User not authenticated");
            }

            const { data: createdConnection, error } = await createUserConnection(
                userId,
                newConnection.app_id,
                newConnection.connection_name,
                newConnection.connection_key
            );

            if (error) throw error;

            // Refresh connections after adding new one
            const { data: connections } = await getUserConnections(userId);
            if (connections) {
                const appConnections = connections.filter(conn => conn.app_id === model.app_id);
                setAvailableConnections(appConnections);

                // Find and auto-select the newly created connection
                const newlyCreatedConnection = appConnections.find(
                    conn => conn.connection_name === newConnection.connection_name
                );
                
                if (newlyCreatedConnection) {
                    setSelectedConnectionId(newlyCreatedConnection.id);
                    form.setValue('auth.user_connection_id', newlyCreatedConnection.id);
                    
                    // Set the connection field values if available
                    if (newlyCreatedConnection.parsedConnectionKeys) {
                        const values = Object.fromEntries(
                            newlyCreatedConnection.parsedConnectionKeys.map(({ key, value }: { key: string, value: string }) => [key, value])
                        );
                        setConnectionFieldValues(values);
                    }
                }
            }

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
        } finally {
            setIsLoading(false);
        }
    };

    // Handle connection selection
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
            form.setValue('auth.user_connection_id', selectedConn.id);
        }
    };

    const onFormSubmit = async (data: ModelConfigValues) => {
        setIsSubmitting(true);
        try {
            if (model.o_auth) {
                // For OAuth models, initiate OAuth flow with config data
                await handleOAuthLogin!(model.provider!, data);
            } else {
                // For non-OAuth models, proceed with normal submission
                await onSubmit({
                    ...data,
                    auth: model.is_auth ? {
                        ...data.auth,
                        user_connection_id: selectedConnectionId || undefined
                    } : undefined
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Model Details Section */}
            <div className="space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
                        {/* Basic Configuration */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="basic.override_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agent Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder={`My ${model.name}`} {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Authentication Section */}
                        {model.is_auth && !model.o_auth && (
                            <div className="space-y-4 pt-4">
                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Select Connection</Label>
                                        <AddConnectionDialog
                                            applications={[{
                                                id: model.app_id,
                                                name: model.name,
                                                fields: model.fields || []
                                            }]}
                                            onAdd={handleAddConnection}
                                        />
                                    </div>
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
                                    {!isLoading && availableConnections.length === 0 && (
                                        <div className="text-sm text-muted-foreground">
                                            No connections available. Add a new connection to continue.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || (model.is_auth && !selectedConnectionId)}
                            >
                                {isSubmitting ? (
                                    <>
                                        <motion.div
                                            className="mr-2 h-4 w-4 animate-spin"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </motion.div>
                                        Adding AI Agent...
                                    </>
                                ) : (
                                    "Add Agent"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}; 