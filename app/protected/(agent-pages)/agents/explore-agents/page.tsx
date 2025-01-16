'use client';

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getModels } from "@/utils/supabase/actions/assistant/assistant";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { toast, useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Brain, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings, Clock, Key, Check, ExternalLink, X, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { assignModelToUser, getUserAssignedModel } from "@/utils/supabase/actions/user/assignedAgents";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { createUserConnection, getUserConnections } from "@/utils/supabase/actions/user/connections";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User } from "@supabase/supabase-js";
import { AddConnectionDialog } from "../../connections/components/add-connection-dialog";
import { getApplications } from "@/utils/supabase/actions/user/connections";
import { getUserWorkspaces } from "@/utils/supabase/actions/workspace/workspace";

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

// Add this before the defaultModelConfig
interface ConnectionKey {
    key: string;
    value: string;
}

interface Connection {
    id: number;
    user_id: string;
    app_id: number;
    connection_name: string;
    connection_key: string[];
    parsedConnectionKeys?: ConnectionKey[];
}

interface Model {
    id: number;
    name: string;
    description: string;
    icon: string;
    is_auth: boolean;
    app_id: number;
    created_by: string;
    created_at: string;
    fields?: string[];
    permission?: {
        type: 'global' | 'restricted';
        restricted_users?: string[];
        restricted_to?: string[];
        restricted_workspaces?: number[];
    };
}

// Step form default values
const defaultModelConfig: ModelConfigValues = {
    basic: {
        override_name: "",
        override_description: "",
    },
    auth: {
        user_connection_id: undefined,
        config_keys: {},
    },
    advanced: {
        override_instructions: "",
        permission_scope: "private",
    },
};

// Predefined icons - same as admin page
const availableIcons: { id: string; icon: any; label: string }[] = [
    { id: "brain", icon: Brain, label: "Brain" },
    { id: "robot", icon: Bot, label: "Robot" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "code", icon: Code2, label: "Code" },
    { id: "document", icon: FileText, label: "Document" },
    { id: "education", icon: GraduationCap, label: "Education" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "ai", icon: Sparkles, label: "AI" },
    { id: "power", icon: Zap, label: "Power" },
    { id: "database", icon: Database, label: "Database" },
    { id: "search", icon: Search, label: "Search" },
    { id: "settings", icon: Settings, label: "Settings" },
];

const categories = [
    { id: "all", name: "All Agents" },
    { id: "chat", name: "Chat" },
    { id: "code", name: "Code" },
    { id: "research", name: "Research & Analysis" },
    { id: "education", name: "Education" },
    { id: "productivity", name: "Productivity" },
    { id: "document", name: "Document" },
];

const MotionCard = motion(Card);

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

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

const ModelCard = ({ model }: { model: Model }) => {
    const IconComponent = availableIcons.find(i => i.id === model.icon)?.icon || Bot;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showConfigForm, setShowConfigForm] = useState(false);
    const { toast } = useToast();

    const handleConfigSubmit = async (data: ModelConfigValues) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            // First assign model to user with additional configuration
            if (model.is_auth) {
                if (!data.auth?.user_connection_id) {
                    toast({
                        title: "Error",
                        description: "Please select a connection for this agent",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }

                const { data: assignedModel, error: assignError } = await assignModelToUser(
                    user.id,
                    model.app_id,
                    data.basic?.override_name || model.name,
                    model.id,
                    data.basic?.override_description,
                    data.advanced?.override_instructions,
                    data.auth.user_connection_id
                );

                if (assignError) throw assignError;
            } else {
                // For non-auth models, proceed without connection
                const { data: assignedModel, error: assignError } = await assignModelToUser(
                    user.id,
                    model.app_id,
                    data.basic?.override_name || model.name,
                    model.id,
                    data.basic?.override_description,
                    data.advanced?.override_instructions,
                    undefined // No connection needed for non-auth models
                );

                if (assignError) throw assignError;
            }

            toast({
                title: "Success",
                description: "Model configured and added successfully",
            });

            // Dispatch custom event with full model data
            const event = new CustomEvent('modelAssigned', {
                detail: {
                    assistant_id: model.id,
                    assistant_name: data.basic?.override_name || model.name,
                    app_id: model.app_id
                }
            });
            window.dispatchEvent(event);

            setShowConfigForm(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to configure agent",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AlertDialog open={showConfigForm} onOpenChange={setShowConfigForm}>
                <AlertDialogTrigger asChild>
                    <MotionCard
                        variants={item}
                        layout
                        className="group relative overflow-hidden bg-background hover:scale-[1.02] hover:shadow-xl transition-all duration-300 ease-out cursor-pointer"
                        whileHover={{
                            y: -5,
                            transition: { type: "spring", stiffness: 300, damping: 20 }
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        {/* Glow Effect Container */}
                        <motion.div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            initial={false}
                            whileHover={{ scale: 1.1 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
                        </motion.div>

                        <div className="relative p-6">
                            {/* Header Section */}
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    {/* Icon Container with new hover effect */}
                                    <motion.div
                                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-background group-0 transition-all duration-300"
                                        whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <IconComponent className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                    </motion.div>
                                    {/* Auth Badge - Updated style */}
                                    {model.is_auth && (
                                        <motion.div
                                            className="absolute -top-1 -right-1 w-3 h-3"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75" />
                                            <span className="absolute inset-0 rounded-full bg-yellow-400" />
                                        </motion.div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Title and Description */}
                                    <div className="space-y-1.5">
                                        <motion.div layout className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors duration-300">
                                                {model.name}
                                            </h3>
                                        </motion.div>
                                        <motion.p
                                            layout
                                            className="text-sm text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/80 transition-colors duration-300"
                                        >
                                            {model.description}
                                        </motion.p>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Section */}
                            <motion.div
                                layout
                                className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground transition-colors duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Creation Date */}
                                    <motion.div
                                        className="flex items-center gap-1.5 group-hover:text-muted-foreground/80 transition-colors duration-300"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{new Date(model.created_at).toLocaleDateString()}</span>
                                    </motion.div>

                                    {/* API Status */}
                                    {model.is_auth ? (
                                        <motion.div
                                            className="flex items-center gap-1.5 text-yellow-600/80 group-hover:text-yellow-600 transition-colors duration-300"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <Key className="h-3.5 w-3.5" />
                                            <span>Auth Required</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            className="flex items-center gap-1.5 text-green-600/80 group-hover:text-green-600 transition-colors duration-300"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                            <span>Public API</span>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </MotionCard>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-[600px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/5">
                                    <IconComponent className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{model.name}</h3>
                                    <span className="text-sm text-muted-foreground font-normal">Created by {model.created_by}</span>
                                </div>
                            </div>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Configure your model settings below
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-6">
                        <ModelConfigForm
                            model={model}
                            onSubmit={handleConfigSubmit}
                            onCancel={() => setShowConfigForm(false)}
                        />
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

const ModelConfigForm = ({ model, onSubmit, onCancel }: { model: Model; onSubmit: (data: ModelConfigValues) => void; onCancel: () => void }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const totalSteps = model.is_auth ? 3 : 2; // Only 2 steps for non-auth models
    const [availableConnections, setAvailableConnections] = useState<Connection[]>([]);
    const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
    const [connectionFieldValues, setConnectionFieldValues] = useState<Record<string, string>>({});
    const [applications, setApplications] = useState<{ id: number; name: string; fields: string[] }[]>([]);

    const form = useForm<ModelConfigValues>({
        resolver: zodResolver(modelConfigSchema),
        defaultValues: defaultModelConfig,
        context: {
            fields: model.fields || []
        }
    });

    // Fetch available connections and applications when the form opens
    useEffect(() => {
        const fetchData = async () => {
            if (!model.is_auth) return;

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
            }
        };

        fetchData();
    }, [model]);

    // Handle new connection added
    const handleAddConnection = async (newConnection: { app_id: number; connection_name: string; connection_key: string }) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

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

            // Refresh connections after adding new one
            const { data: connections } = await getUserConnections(userId);
            if (connections) {
                const appConnections = connections.filter(conn => conn.app_id === model.app_id);
                setAvailableConnections(appConnections);
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
            await onSubmit({
                ...data,
                auth: model.is_auth ? {
                    ...data.auth,
                    user_connection_id: selectedConnectionId || undefined
                } : undefined
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get the current step content
    const getCurrentStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="text-center">
                            <h2 className="text-lg font-semibold">Basic Configuration</h2>
                            <p className="text-sm text-muted-foreground">
                                Customize the basic settings for your agent
                            </p>
                        </div>
                        <FormField
                            control={form.control}
                            name="basic.override_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Override Name (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder={model.name} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Customize the display name for this agent
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="basic.override_description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Override Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={model.description}
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Customize the description for this agent
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </motion.div>
                );
            case 2:
                // Return auth step for auth models, advanced step for non-auth models
                return model.is_auth ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="text-center">
                            <h2 className="text-lg font-semibold">Authentication Required</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure your connection settings
                            </p>
                        </div>
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
                            <FormField
                                control={form.control}
                                name="auth.config_keys"
                                render={({ field, fieldState }) => (
                                    <FormItem className="space-y-4">
                                        <div className="space-y-2">
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
                                        {availableConnections.length === 0 && (
                                            <div className="text-sm text-muted-foreground text-center py-2">
                                                No connections available. Create a new connection to proceed.
                                            </div>
                                        )}
                                    </FormItem>
                                )}
                            />
                        </div>
                    </motion.div>
                ) : (
                    // Advanced settings for non-auth models
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="text-center">
                            <h2 className="text-lg font-semibold">Advanced Settings</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure advanced options for your agent
                            </p>
                        </div>
                        <FormField
                            control={form.control}
                            name="advanced.override_instructions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Override Instructions (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter custom instructions for the agent..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Provide custom instructions for how the agent should behave
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="advanced.permission_scope"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Permission Scope</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a permission scope" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="private">Private</SelectItem>
                                            <SelectItem value="team">Team</SelectItem>
                                            <SelectItem value="public">Public</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Control who can access this agent
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="text-center">
                            <h2 className="text-lg font-semibold">Advanced Settings</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure advanced options for your agent
                            </p>
                        </div>
                        <FormField
                            control={form.control}
                            name="advanced.override_instructions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Override Instructions (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter custom instructions for the agent..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Provide custom instructions for how the agent should behave
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="advanced.permission_scope"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Permission Scope</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a permission scope" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="private">Private</SelectItem>
                                            <SelectItem value="team">Team</SelectItem>
                                            <SelectItem value="public">Public</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Control who can access this agent
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="relative">
                <div className="absolute left-0 top-4 h-0.5 w-full bg-muted">
                    <div
                        className="absolute h-full bg-primary transition-all duration-300"
                        style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                    />
                </div>
                <div className="relative flex justify-between">
                    {[...Array(totalSteps)].map((_, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                                    step > index + 1
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : step === index + 1
                                            ? "border-primary bg-background text-primary"
                                            : "border-muted bg-muted text-muted-foreground"
                                )}
                            >
                                {step > index + 1 ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>
                            <span className="mt-2 text-sm font-medium">
                                {index === 0 ? "Basic" : index === 1 ? (model.is_auth ? "Auth" : "Advanced") : "Advanced"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
                    {getCurrentStepContent()}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (step === 1) {
                                    onCancel();
                                } else {
                                    setStep(step - 1);
                                }
                            }}
                            disabled={isSubmitting}
                        >
                            {step === 1 ? "Cancel" : "Previous"}
                        </Button>
                        <Button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                if (step === totalSteps) {
                                    form.handleSubmit(onFormSubmit)(e);
                                } else {
                                    setStep(step + 1);
                                }
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && step === totalSteps ? (
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
                                step === totalSteps ? "Submit" : "Next"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

const ModelCardSkeleton: React.FC = () => (
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

const EmptyState: React.FC = () => (
    <motion.div
        className="text-center py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <motion.div
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
        >
            <Bot className="h-5 w-5 text-muted-foreground" />
        </motion.div>
        <motion.h3
            className="mt-4 text-lg font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            No agents found
        </motion.h3>
        <motion.p
            className="mt-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
            We couldn't find any agents matching your criteria.
        </motion.p>
    </motion.div>
);

const AccessibleVariablesDialog = ({
    model,
    user,
    connectionKeys,
    selectedConnection
}: {
    model: Model;
    user: User | null;
    connectionKeys: Record<string, string>;
    selectedConnection?: Connection;
}) => {
    const [open, setOpen] = useState(false);
    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Code2 className="h-4 w-4 mr-2" />
                    Variables
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Accessible Variables</AlertDialogTitle>
                    <AlertDialogDescription>
                        Available variables for this agent
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">User Variables</h4>
                            <div className="gap-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <code className="bg-muted px-1 py-0.5 rounded">user.id</code>
                                    <span className="text-muted-foreground">{user?.id}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <code className="bg-muted px-1 py-0.5 rounded">user.email</code>
                                    <span className="text-muted-foreground">{user?.email}</span>
                                </div>
                            </div>
                        </div>
                        {model.is_auth && selectedConnection && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Connection Variables</h4>
                                    <div className="text-xs text-muted-foreground">
                                        From: {selectedConnection.connection_name}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    {model.fields?.map((field, index) => (
                                        <div key={index} className="flex items-center justify-between space-x-2 bg-muted/30 p-2 rounded-md">
                                            <code className="bg-muted px-1 py-0.5 rounded">vars.{field}</code>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">{connectionKeys[field]}</span>
                                                <Lock className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                                    <Info className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                        These variables are securely managed through your connection settings
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setOpen(false)}>Close</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const ModelSettingsDialog = ({
    model,
    onDelete,
    onSave,
    isAdmin
}: {
    model: Model;
    onDelete: () => Promise<void>;
    onSave: (settings: any) => Promise<void>;
    isAdmin: boolean;
}) => {
    const { toast } = useToast();
    const params = useParams();
    const id = params?.id as string;
    const [isDeleting, setIsDeleting] = useState(false);
    const [availableConnections, setAvailableConnections] = useState<Connection[]>([]);
    const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
    const [connectionFieldValues, setConnectionFieldValues] = useState<Record<string, string>>({});
    const [selectedConnection, setSelectedConnection] = useState<Connection | undefined>();
    const [user, setUser] = useState<User | null>(null);

    const form = useForm<ModelConfigValues>({
        resolver: zodResolver(modelConfigSchema),
        defaultValues: {
            basic: {
                override_name: model.name,
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
        }
    });

    // Get user on mount
    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    // Update form when selectedConnectionId changes
    useEffect(() => {
        if (selectedConnectionId) {
            form.setValue('auth.user_connection_id', selectedConnectionId);
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
                    // Filter connections for this app type
                    const appConnections = connections.filter(conn => conn.app_id === model.app_id);
                    setAvailableConnections(appConnections);

                    // Get the current model data to find its connection
                    const modelData = await getUserAssignedModel(parseInt(id));
                    if (modelData?.user_connection_id) {
                        setSelectedConnectionId(modelData.user_connection_id);
                        // Find the connection details
                        const currentConnection = appConnections.find(conn =>
                            conn.id === modelData.user_connection_id);
                        if (currentConnection?.parsedConnectionKeys) {
                            setSelectedConnection(currentConnection);
                            const values = Object.fromEntries(
                                currentConnection.parsedConnectionKeys.map((pair: { key: string; value: string }) => [pair.key, pair.value])
                            );
                            setConnectionFieldValues(values);
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
    }, [model, id]);

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
            setSelectedConnection(selectedConn);
            form.setValue('auth.user_connection_id', selectedConn.id);
        }
    };

    const onFormSubmit = async (data: ModelConfigValues) => {
        try {
            await onSave({
                ...data,
                auth: {
                    ...data.auth,
                    user_connection_id: selectedConnectionId || undefined
                }
            });

            // After successful save, refresh the connection data
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: connections } = await getUserConnections(user.id);
            if (connections) {
                const appConnections = connections.filter(conn => conn.app_id === model.app_id);
                setAvailableConnections(appConnections);

                // Get the current model data to find its connection
                const modelData = await getUserAssignedModel(parseInt(id));
                if (modelData?.user_connection_id) {
                    setSelectedConnectionId(modelData.user_connection_id);
                    // Find the connection details
                    const currentConnection = appConnections.find(conn =>
                        conn.id === modelData.user_connection_id);
                    if (currentConnection?.parsedConnectionKeys) {
                        setSelectedConnection(currentConnection);
                        const values = Object.fromEntries(
                            currentConnection.parsedConnectionKeys.map((pair: { key: string; value: string }) => [pair.key, pair.value])
                        );
                        setConnectionFieldValues(values);
                    }
                }
            }

            toast({
                title: "Success",
                description: "Settings saved successfully",
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: "Error",
                description: "Failed to save settings",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
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
                <div className="flex items-center gap-2 mb-4">
                    {isAdmin && (
                        <AccessibleVariablesDialog
                            user={user}
                            model={model}
                            connectionKeys={connectionFieldValues}
                            selectedConnection={selectedConnection}
                        />
                    )}
                </div>
                <Form {...form}>
                    <FormField
                        control={form.control}
                        name="basic.override_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default function ExploreModels() {
    const [models, setModels] = useState<Model[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const modelId = searchParams.get('id');

    useEffect(() => {
        const fetchModels = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const fetchedModels = await getModels(user.id);

                    // Get current workspace from localStorage
                    const storedWorkspace = localStorage.getItem('selectedWorkspace');
                    const currentWorkspace = storedWorkspace ? JSON.parse(storedWorkspace) : null;
                    const currentWorkspaceId = currentWorkspace?.id;

                    // Filter models based on permissions
                    const accessibleModels = fetchedModels.filter(model => {
                        const permission = model.permission || { type: 'global' };

                        // If global type, everyone has access
                        if (permission.type === 'global') {
                            return true;
                        }

                        // For restricted type, check user and workspace access
                        if (permission.type === 'restricted') {
                            // Check direct user access
                            if (permission.restricted_users?.includes(user.id)) {
                                return true;
                            }

                            // Check workspace access using current workspace
                            if (permission.restricted_to?.includes('workspace')) {
                                return currentWorkspaceId && permission.restricted_workspaces?.includes(currentWorkspaceId);
                            }

                            return false;
                        }

                        return false;
                    });

                    setModels(accessibleModels);

                    // If modelId is present in URL, scroll to that model and highlight it
                    if (modelId) {
                        const targetModel = accessibleModels.find(m => m.id === parseInt(modelId));
                        if (targetModel) {
                            // Set the category of the target model
                            setSelectedCategory(targetModel.icon || "all");
                            // Set search term to match the model name for easy finding
                            setSearchTerm(targetModel.name);
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error fetching models:', error);
                toast({
                    title: "Error",
                    description: "Failed to load models. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchModels();
    }, [modelId, toast]);

    const filteredModels = models.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || model.icon === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <motion.div
            className="container mx-auto px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="text-center mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h1 className="text-4xl font-bold mb-4">AI Agents</h1>
                <div className="text-muted-foreground">
                    Discover and use custom AI agents that combine different capabilities,
                    knowledge, and skills.
                </div>
            </motion.div>

            {/* Search Bar */}
            <motion.div
                className="max-w-2xl mx-auto mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <Input
                    type="search"
                    placeholder="Search AI Agents"
                    className="w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </motion.div>

            {/* Categories Tabs */}
            <Tabs
                defaultValue="all"
                className="mb-8"
                value={selectedCategory}
                onValueChange={setSelectedCategory}
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent">
                        {categories.map((category) => (
                            <TabsTrigger
                                key={category.id}
                                value={category.id}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                onClick={() => {
                                    if (category.id === "all") {
                                        setSearchTerm("");
                                        setSelectedCategory("all")
                                    }
                                }}
                            >
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </motion.div>

                <TabsContent value={selectedCategory} className="mt-6 border-none">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-none"
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {[...Array(6)].map((_, index) => (
                                    <motion.div key={index} variants={item}>
                                        <ModelCardSkeleton />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : filteredModels.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-none"
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {filteredModels.map((model) => (
                                    <ModelCard key={model.id} model={model} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
