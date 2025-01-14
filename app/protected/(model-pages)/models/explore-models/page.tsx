'use client';

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getModels } from "@/utils/supabase/actions/assistant/assistant";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Brain, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings, Clock, Key, Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { addUserConnection } from "@/utils/supabase/actions/user/connections";
import { assignModelToUser } from "@/utils/supabase/actions/user/assignedModels";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Step form schema
const modelConfigSchema = z.object({
    // Step 1: Basic Configuration
    basic: z.object({
        override_name: z.string().optional(),
        override_description: z.string().optional().or(z.string().min(10, "Description must be at least 10 characters")),
    }),
    // Step 2: Authentication (if required)
    auth: z.object({
        config_keys: z.record(z.string(), z.string()).superRefine((value, ctx) => {
            // Get the fields from the form context
            const fields = (ctx as any)._def?.fields || [];

            // If there are no fields defined, validation passes
            if (fields.length === 0) return;

            // Check if all required fields are present and have non-empty values
            fields.forEach((field: string) => {
                if (!value[field] || value[field].trim() === '') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `${field} is required`,
                        path: [field]
                    });
                } else if (value[field].trim().length < 3) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `${field} must be at least 3 characters`,
                        path: [field]
                    });
                }
            });
        }),
    }),
    // Step 3: Advanced Settings
    advanced: z.object({
        override_instructions: z.string().optional(),
        permission_scope: z.enum(["public", "private", "team"]).default("private"),
    }),
});

type ModelConfigValues = z.infer<typeof modelConfigSchema>;

// Step form default values
const defaultModelConfig: ModelConfigValues = {
    basic: {
        override_name: "",
        override_description: "",
    },
    auth: {
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

interface Model {
    id: number;
    name: string;
    description: string;
    icon: string;
    is_auth: boolean;
    api_endpoint: string;
    created_by: string;
    created_at: string;
    app_id: number;
    fields?: string[];
}

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
            if (model.is_auth && data.auth?.config_keys && Object.keys(data.auth.config_keys).length === model.fields?.length) {
                const { data: assignedModel, error: assignError } = await assignModelToUser(
                    user.id,
                    model.app_id,
                    data.basic?.override_name || model.name,
                    model.id,
                    data.basic?.override_description,
                    data.advanced?.override_instructions
                );

                if (assignError) throw assignError;
                console.log(data.auth.config_keys)
                console.log(Object.keys(data.auth.config_keys))
                // If auth is required and config keys are provided, save them
                const { error: connectionError } = await addUserConnection(
                    user.id,
                    model.app_id,
                    JSON.stringify(data.auth.config_keys),
                    assignedModel.id
                );

                if (connectionError) {
                    // If token storage fails, we should clean up the assigned model
                    // You might want to add a function to delete the assigned model here
                    throw new Error("Failed to store authentication tokens: " + connectionError);
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
            }
            else {
                toast({
                    title: "Error",
                    description: "Please fill out all required fields (marked with *)",
                    variant: "destructive",
                });
            }

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to configure model",
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
    const totalSteps = model.is_auth ? 3 : 2;
    const form = useForm<ModelConfigValues>({
        resolver: zodResolver(modelConfigSchema),
        defaultValues: defaultModelConfig,
        context: {
            fields: model.fields || []
        }
    });

    const onFormSubmit = async (data: ModelConfigValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prevent form submission on enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && step !== totalSteps) {
            e.preventDefault();
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
                <form onSubmit={form.handleSubmit(onFormSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
                    {/* Step 1: Basic Configuration */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="text-center">
                                <h2 className="text-lg font-semibold">Basic Configuration</h2>
                                <p className="text-sm text-muted-foreground">
                                    Customize the basic settings for your model
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
                                            Customize the display name for this model
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
                                            Customize the description for this model
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </motion.div>
                    )}

                    {/* Step 2: Authentication (if required) */}
                    {step === 2 && model.is_auth && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="text-center">
                                <h2 className="text-lg font-semibold">Authentication Required</h2>
                                <p className="text-sm text-muted-foreground">
                                    Enter your API keys and configuration
                                </p>
                            </div>
                            <div className="rounded-lg border p-4 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="auth.config_keys"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="space-y-4">
                                            <FormLabel>Configuration Keys</FormLabel>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    {model.fields?.map((fieldName, index) => (
                                                        <div key={index} className="space-y-2">
                                                            <Label className="text-sm font-medium">
                                                                {fieldName}
                                                                <span className="text-destructive ml-1">*</span>
                                                            </Label>
                                                            <Input
                                                                type="text"
                                                                placeholder={`Enter your ${fieldName}`}
                                                                value={field.value?.[fieldName] || ''}
                                                                onChange={(e) => {
                                                                    const newValue = { ...field.value };
                                                                    newValue[fieldName] = e.target.value;
                                                                    field.onChange(newValue);
                                                                }}
                                                                className={cn(
                                                                    fieldState.error?.message?.includes(fieldName) && "border-destructive"
                                                                )}
                                                            />
                                                            {fieldState.error?.message?.includes(fieldName) && (
                                                                <p className="text-sm text-destructive">
                                                                    {fieldState.error.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Enter the required configuration values for each field
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3 (or 2 if no auth): Advanced Settings */}
                    {step === (model.is_auth ? 3 : 2) && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="text-center">
                                <h2 className="text-lg font-semibold">Advanced Settings</h2>
                                <p className="text-sm text-muted-foreground">
                                    Configure advanced options for your model
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
                                                placeholder="Enter custom instructions for the model..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Provide custom instructions for how the model should behave
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
                                            Control who can access this model
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </motion.div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                                e.preventDefault();
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
            No models found
        </motion.h3>
        <motion.p
            className="mt-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
            We couldn't find any models matching your criteria.
        </motion.p>
    </motion.div>
);

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
                    setModels(fetchedModels);

                    // If modelId is present in URL, scroll to that model and highlight it
                    if (modelId) {
                        const targetModel = fetchedModels.find(m => m.id === parseInt(modelId));
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
