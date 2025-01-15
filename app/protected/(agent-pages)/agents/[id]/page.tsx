'use client';

import { useEffect, useState, use } from "react";
import { getModels } from "@/utils/supabase/actions/assistant/assistant";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic, Globe, Paperclip, Send, Clock, Key, Check, Brain, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings, User2, Trash2, Edit, Save, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { createUserChat, updateUserChat, getUserChatById, ChatMessage } from "@/utils/supabase/actions/user/user_chat";
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getUserConnections, addUserConnection, updateUserConnection } from "@/utils/supabase/actions/user/connections";
import { getUserAssignedModels, updateUserAssignedModel, getUserAssignedModel, deleteUserAssignedModel } from "@/utils/supabase/actions/user/assignedAgents";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { addToFavorites, removeFromFavorites, checkIsFavorite } from "@/utils/supabase/actions/assistant/favModels";
import { isSuperAdmin } from "@/utils/supabase/admin";

type Message = ChatMessage;

interface Model {
    id: number;
    created_at: string;
    name: string;
    description: string;
    icon: string;
    is_auth: boolean;
    code: string | null;
    created_by: string;
    app_id: number;
    fields?: string[];
}

// Add the availableIcons mapping
const availableIcons: { [key: string]: any } = {
    brain: Brain,
    robot: Bot,
    chat: MessageSquare,
    code: Code2,
    document: FileText,
    education: GraduationCap,
    analytics: BarChart3,
    ai: Sparkles,
    power: Zap,
    database: Database,
    search: Search,
    settings: Settings,
};

// Add this before the ModelSettingsDialog component
const settingsFormSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    connectionKeys: z.record(z.string(), z.string()).optional()
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// Add ModelSettingsDialog component before the main component
const ModelSettingsDialog = ({
    model,
    connectionKeys,
    onDelete,
    onSave,
    isAdmin
}: {
    model: Model;
    connectionKeys: any;
    onDelete: () => Promise<void>;
    onSave: (settings: any) => Promise<void>;
    isAdmin: boolean;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            name: model.name,
            description: model.description,
            instructions: "",
            connectionKeys: connectionKeys || {}
        }
    });
    const onSubmit = async (data: SettingsFormValues) => {
        await onSave(data);
        setIsEditing(false);
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
                <Form {...form}>
                    <div className="space-y-6">
                        <Tabs defaultValue="general" className="mt-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="connection">Connection</TabsTrigger>
                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general" className="space-y-4 mt-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Agent Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        disabled={!isEditing}
                                                        placeholder={model.name}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    The display name for your agent
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        disabled={!isEditing}
                                                        placeholder={model.description}
                                                        className="min-h-[100px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    A description of what your agent does
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                        <FormField
                                            control={form.control}
                                            name="connectionKeys"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel>Connection Keys</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <div className="space-y-3">
                                                            {model.fields?.map((fieldName, index) => (
                                                                <motion.div
                                                                    key={index}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: index * 0.1 }}
                                                                    className="space-y-2"
                                                                >
                                                                    <Label className="text-sm font-medium">{fieldName}</Label>
                                                                    <Input
                                                                        type="text"
                                                                        disabled={!isEditing}
                                                                        placeholder={`Enter your ${fieldName}`}
                                                                        value={field.value?.[fieldName] || ''}
                                                                        onChange={(e) => {
                                                                            const newValue = { ...field.value };
                                                                            newValue[fieldName] = e.target.value;
                                                                            field.onChange(newValue);
                                                                        }}
                                                                    />
                                                                </motion.div>
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
                                    <FormField
                                        control={form.control}
                                        name="instructions"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Custom Instructions</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        disabled={!isEditing}
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
                                </motion.div>
                            </TabsContent>




                        </Tabs>
                        <div className="flex justify-between mt-6">
                            {isEditing ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            form.reset();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="button" onClick={() => {
                                        form.handleSubmit(onSubmit)();
                                        setIsEditing(false);
                                    }}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                disabled={isDeleting}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
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
                                    <Button type="button" onClick={() => setIsEditing(true)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Settings
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

// Add this component before ModelSettingsDialog component
const AccessibleVariablesDialog = ({
    model
}: {
    model: Model;
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
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <code className="bg-muted px-1 py-0.5 rounded">user.id</code>
                                    <span className="text-muted-foreground">User's ID</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <code className="bg-muted px-1 py-0.5 rounded">user.email</code>
                                    <span className="text-muted-foreground">User's email</span>
                                </div>
                            </div>
                        </div>
                        {model.is_auth && model.fields && model.fields.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Connection Variables</h4>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    {model.fields.map((field, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <code className="bg-muted px-1 py-0.5 rounded">vars.{field}</code>
                                            <span className="text-muted-foreground">Connection {field}</span>
                                        </div>
                                    ))}
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

export default function ModelPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const chatId = searchParams.get('chatId');
    const router = useRouter();

    const [model, setModel] = useState<Model | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<number | null>(null);
    const [connectionKeys, setConnectionKeys] = useState<any>(null);
    const [hasAccess, setHasAccess] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const { toast } = useToast();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const fetchModelAndChat = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Set admin status
                    setIsAdmin(isSuperAdmin(user.email));
                    // Check if model is favorite
                    const isFav = await checkIsFavorite(user.id, parseInt(id));
                    setIsFavorite(isFav);

                    // Check if user has access to this model
                    const { data: assignedModels } = await getUserAssignedModels(user.id);
                    const hasModelAccess = assignedModels?.some(m => m.id === parseInt(id));
                    setHasAccess(hasModelAccess || false);

                    if (!hasModelAccess) {
                        setIsLoading(false);
                        return;
                    }
                    const modelId = assignedModels?.find(m => m.id === parseInt(id))?.assistant_id;
                    // Fetch model data
                    const models = await getModels(user.id);
                    const foundModel = models.find(m => m.id === modelId);
                    if (foundModel) {
                        const assignedModel = await getUserAssignedModel(parseInt(id));
                        //set the model name and description to the assigned model
                        setModel(foundModel);
                        setModel(prev => ({
                            ...prev!,
                            name: assignedModel.name,
                            description: assignedModel.description,
                            is_auth: foundModel.is_auth
                        }));

                        // If model requires auth, fetch connection keys
                        if (foundModel.is_auth) {
                            const { data: connections } = await getUserConnections(user.id);
                            const modelConnection = connections?.find(c => c.app_id === foundModel.app_id);
                            if (modelConnection) {
                                // Clean the connection key string and parse it
                                const cleanedKeys = modelConnection.connection_key
                                    .map((key: string) => key.replace(/^"/, '').replace(/"$/, '')); // Remove surrounding quotes

                                const keyValueObject = cleanedKeys.reduce((acc: any, curr: string) => {
                                    const [key, value] = curr.split('=');
                                    if (key && value) {
                                        acc[key] = value;
                                    }
                                    return acc;
                                }, {});

                                setConnectionKeys(keyValueObject);
                            }
                        }

                        // Clear messages and currentChatId if no chatId in URL
                        if (!chatId) {
                            setMessages([]);
                            setCurrentChatId(null);
                        } else {
                            // If chatId is provided, load that chat's messages
                            const chatData = await getUserChatById(parseInt(chatId));
                            if (chatData) {
                                setMessages(chatData.chat || []);
                                setCurrentChatId(chatData.id);
                            } else {
                                // If chat not found, clear messages
                                setMessages([]);
                                setCurrentChatId(null);
                            }
                        }

                    } else {
                        toast({
                            title: "Error",
                            description: "Agent not found.",
                            variant: "destructive",
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load data. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchModelAndChat();
    }, [id, chatId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || !model || isTyping) return;

        setIsTyping(true);
        const timestamp = Date.now();
        const userMessage: Message = {
            id: `user_${timestamp}_${Math.random().toString(36).substring(2, 11)}`,
            role: 'user',
            content: input.trim()
        };

        setInput('');
        // Add user message to UI immediately
        setMessages(prev => [...prev, userMessage]);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            let response: any;
            if (model && model.code) {
                try {
                    // Create a safe execution context
                    const context = {
                        async query(data: { question: string }) {
                            // Execute the model's code in a controlled environment

                            const connectionKeyString = Object.entries(connectionKeys).map(([key, value]) => `${key}=${value}`).join('&');
                            //convert connectionKeyString to an object
                            const vars = connectionKeyString.split('&').reduce((acc: any, curr: string) => {
                                const [key, value] = curr.split('=');
                                acc[key] = value;
                                return acc;
                            }, {}) as any;
                            const result = await eval(`
                                (async () => {
                                    ${model.code}
                                    return await query(data);
                                })()
                            `);
                            return result;
                        }
                    };

                    // Execute the query with the user's message
                    response = await context.query({
                        question: userMessage.content
                    });
                } catch (error) {
                    console.error('Error executing agent code:', error);
                    throw new Error('Error executing agent code');
                }
            } else {
                throw new Error('Agent code not found');
            }

            const assistantMessage: Message = {
                id: `assistant_${timestamp + 1}_${Math.random().toString(36).substring(2, 11)}`,
                role: 'assistant',
                content: response.text || response.message || response.content || response.response || 'No response received'
            };

            // Add assistant message to UI
            setMessages(prev => [...prev, assistantMessage]);

            // Handle chat creation or update
            if (!currentChatId) {
                // Create new chat with both messages
                const chatData = await createUserChat(user.id, parseInt(id), userMessage.content, assistantMessage);
                setCurrentChatId(chatData.id);

                // Dispatch custom event for new chat
                const event = new CustomEvent('chatCreated', {
                    detail: {
                        id: chatData.id,
                        heading: userMessage.content,
                        agent_id: model.id
                    }
                });
                window.dispatchEvent(event);
            } else {
                // Update existing chat with both messages
                await updateUserChat(currentChatId, [userMessage, assistantMessage]);
            }
        } catch (error: any) {
            console.error('Error:', error);
            // Add error message to the chat
            setMessages(prev => [...prev, {
                id: `error_${timestamp + 1}_${Math.random().toString(36).substring(2, 11)}`,
                role: 'assistant',
                content: `Error: ${error.message || 'Failed to get response from the model.'}`
            }]);

            toast({
                title: "Error",
                description: error.message || "Failed to get response from the model.",
                variant: "destructive",
            });
        } finally {
            setIsTyping(false);
        }
    };

    const handleDeleteModel = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("User not authenticated");

            const { error } = await deleteUserAssignedModel(parseInt(id));

            if (error) throw error;

            // Dispatch modelDeleted event
            window.dispatchEvent(new CustomEvent('modelDeleted', {
                detail: { modelId: parseInt(id) }
            }));

            toast({
                title: "Success",
                description: "Agent deleted successfully",
            });

            // Redirect to models page
            router.push("/protected/agents/explore-agents");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete agent",
                variant: "destructive",
            });
        }
    };

    const handleFavoriteToggle = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("User not authenticated");

            if (isFavorite) {
                const result = await removeFromFavorites(user.id, parseInt(id));
                if (result.success) {
                    setIsFavorite(false);
                    toast({
                        title: "Success",
                        description: "Removed from favorites",
                    });
                    // Dispatch unfavorite event
                    window.dispatchEvent(new CustomEvent('modelUnfavorited', {
                        detail: { modelId: parseInt(id) }
                    }));
                } else {
                    throw new Error(result.message);
                }
            } else {
                const result = await addToFavorites(user.id, parseInt(id));
                if (result.success) {
                    setIsFavorite(true);
                    toast({
                        title: "Success",
                        description: "Added to favorites",
                    });
                    // Dispatch favorite event
                    window.dispatchEvent(new CustomEvent('modelFavorited', {
                        detail: { modelId: parseInt(id) }
                    }));
                } else {
                    throw new Error(result.message);
                }
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update favorites",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-12 w-64 mb-4" />
                    <Skeleton className="h-[600px] w-full rounded-lg" />
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <div className="text-muted-foreground mb-4">
                        You don't have access to this agent. Please purchase this agent from the marketplace.
                    </div>
                    <Button onClick={() => window.history.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    if (!model) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Model Not Found</h1>
                    <div className="text-muted-foreground mb-4">
                        The agent you are looking for does not exist.
                    </div>
                    <Button onClick={() => router.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-65px)]">
            <AnimatePresence mode="wait">
                {messages.length === 0 ? (
                    <motion.div
                        key="empty-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b"
                    >
                        <div className="max-w-4xl mx-auto p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        {(() => {
                                            const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                            return <IconComponent className="w-5 h-5" />;
                                        })()}
                                    </div>
                                    <h1 className="text-xl font-semibold">{model.name}</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleFavoriteToggle}
                                        className={`${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </Button>
                                    {isAdmin && <AccessibleVariablesDialog model={model} />}
                                    <ModelSettingsDialog
                                        model={model}
                                        connectionKeys={connectionKeys}
                                        onDelete={handleDeleteModel}
                                        onSave={async (newSettings) => {
                                            try {
                                                const supabase = createClient();
                                                const { data: { user } } = await supabase.auth.getUser();

                                                if (!user) throw new Error("User not authenticated");

                                                // Update connection keys if changed
                                                if (model.is_auth && newSettings.connectionKeys) {
                                                    const { data: connections } = await getUserConnections(user.id);
                                                    const existingConnection = connections?.find(c => c.app_id === model.app_id);

                                                    if (existingConnection) {
                                                        const { error: connectionError } = await updateUserConnection(
                                                            existingConnection.id,
                                                            JSON.stringify(newSettings.connectionKeys)
                                                        );
                                                        if (connectionError) throw connectionError;
                                                    } else {
                                                        const { error: connectionError } = await addUserConnection(
                                                            user.id,
                                                            model.app_id,
                                                            JSON.stringify(newSettings.connectionKeys),
                                                            parseInt(id)
                                                        );
                                                        if (connectionError) throw connectionError;
                                                    }
                                                }

                                                // Update model settings
                                                const { error } = await updateUserAssignedModel(
                                                    parseInt(id),
                                                    {
                                                        name: newSettings.name,
                                                        description: newSettings.description,
                                                        instruction: newSettings.instructions
                                                    }
                                                );

                                                if (error) throw error;

                                                // Update local state
                                                setModel(prev => ({
                                                    ...prev!,
                                                    name: newSettings.name,
                                                    description: newSettings.description
                                                }));
                                                setConnectionKeys(newSettings.connectionKeys);

                                                toast({
                                                    title: "Success",
                                                    description: "Model settings updated successfully",
                                                });
                                            } catch (error: any) {
                                                toast({
                                                    title: "Error",
                                                    description: error.message || "Failed to update settings",
                                                    variant: "destructive",
                                                });
                                            }
                                        }}
                                        isAdmin={isAdmin}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="header"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b"
                    >
                        <div className="max-w-4xl mx-auto p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        {(() => {
                                            const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                            return <IconComponent className="w-6 h-6" />;
                                        })()}
                                    </div>
                                    <h1 className="text-2xl font-semibold">{model.name}</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleFavoriteToggle}
                                        className={`${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </Button>
                                    {isAdmin && <AccessibleVariablesDialog model={model} />}
                                    <ModelSettingsDialog
                                        model={model}
                                        connectionKeys={connectionKeys}
                                        onDelete={handleDeleteModel}
                                        onSave={async (newSettings) => {
                                            try {
                                                const supabase = createClient();
                                                const { data: { user } } = await supabase.auth.getUser();

                                                if (!user) throw new Error("User not authenticated");

                                                // Update connection keys if changed
                                                if (model.is_auth && newSettings.connectionKeys) {
                                                    const { data: connections } = await getUserConnections(user.id);
                                                    const existingConnection = connections?.find(c => c.app_id === model.app_id);

                                                    if (existingConnection) {
                                                        const { error: connectionError } = await updateUserConnection(
                                                            existingConnection.id,
                                                            JSON.stringify(newSettings.connectionKeys)
                                                        );
                                                        if (connectionError) throw connectionError;
                                                    } else {
                                                        const { error: connectionError } = await addUserConnection(
                                                            user.id,
                                                            model.app_id,
                                                            JSON.stringify(newSettings.connectionKeys),
                                                            parseInt(id)
                                                        );
                                                        if (connectionError) throw connectionError;
                                                    }
                                                }

                                                // Update model settings
                                                const { error } = await updateUserAssignedModel(
                                                    parseInt(id),
                                                    {
                                                        name: newSettings.name,
                                                        description: newSettings.description,
                                                        instruction: newSettings.instructions
                                                    }
                                                );

                                                if (error) throw error;

                                                // Update local state
                                                setModel(prev => ({
                                                    ...prev!,
                                                    name: newSettings.name,
                                                    description: newSettings.description
                                                }));
                                                setConnectionKeys(newSettings.connectionKeys);

                                                toast({
                                                    title: "Success",
                                                    description: "Agent settings updated successfully",
                                                });
                                            } catch (error: any) {
                                                toast({
                                                    title: "Error",
                                                    description: error.message || "Failed to update agent settings",
                                                    variant: "destructive",
                                                });
                                            }
                                        }}
                                        isAdmin={isAdmin}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <main className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center gap-12 h-full"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-center space-y-4"
                            >
                                {model.icon && (
                                    <div className="flex justify-center mb-6">
                                        {(() => {
                                            const IconComponent = availableIcons[model.icon] || Bot;
                                            return (
                                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                                                    <IconComponent className="w-12 h-12" />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                                <h1 className="text-4xl font-bold">
                                    Start chatting with {model.name}
                                </h1>
                                <div className="text-gray-400">{model.description}</div>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <div className="h-full overflow-y-auto px-4 py-6">
                            <div className="max-w-4xl mx-auto space-y-6 pb-4">
                                <AnimatePresence>
                                    {messages.map((m, i) => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}
                                        >
                                            {m.role === 'assistant' && (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                                    {(() => {
                                                        const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                                        return <IconComponent className="w-5 h-5" />;
                                                    })()}
                                                </div>
                                            )}
                                            <motion.div
                                                className={`rounded-2xl p-4 max-w-[70%] ${m.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-muted rounded-tl-none'
                                                    }`}
                                            >
                                                {m.role === 'assistant' ? (
                                                    <ReactMarkdown
                                                        className="text-2sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0"
                                                        remarkPlugins={[remarkGfm, remarkMath]}
                                                        components={{
                                                            code({ node, inline, className, children, ...props }: any) {
                                                                const match = /language-(\w+)/.exec(className || '');
                                                                return !inline && match ? (
                                                                    <SyntaxHighlighter
                                                                        {...props}
                                                                        style={oneDark}
                                                                        language={match[1]}
                                                                        PreTag="div"
                                                                        className="rounded-md"
                                                                    >
                                                                        {String(children).replace(/\n$/, '')}
                                                                    </SyntaxHighlighter>
                                                                ) : (
                                                                    <code {...props} className={className}>
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                            // Customize other markdown elements if needed
                                                            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                                                            ul: ({ children }) => <ul className="list-disc pl-4 mb-4 last:mb-0">{children}</ul>,
                                                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 last:mb-0">{children}</ol>,
                                                            li: ({ children }) => <li className="mb-1">{children}</li>,
                                                            h1: ({ children }) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                                                            h2: ({ children }) => <h2 className="text-lg font-bold mb-3">{children}</h2>,
                                                            h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
                                                            a: ({ children, href }) => (
                                                                <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                                                                    {children}
                                                                </a>
                                                            ),
                                                            blockquote: ({ children }) => (
                                                                <blockquote className="border-l-2 border-gray-300 pl-4 italic my-4">
                                                                    {children}
                                                                </blockquote>
                                                            ),
                                                        }}
                                                    >
                                                        {m.content}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <div className="text-2sm">{m.content}</div>
                                                )}
                                            </motion.div>
                                            {m.role === 'user' && (
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                                    <User2 className="w-5 h-5 text-primary-foreground" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <AnimatePresence>
                                    {isTyping && (
                                        <motion.div
                                            key="typing-indicator"
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                                            className="flex justify-start items-start gap-2"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                {(() => {
                                                    const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                                    return <IconComponent className="w-5 h-5" />;
                                                })()}
                                            </div>
                                            <div className="rounded-2xl p-4 max-w-[70%] bg-muted rounded-tl-none space-y-2">
                                                <div className="flex gap-2">
                                                    <Skeleton className="h-4 w-4 rounded-full animate-bounce" />
                                                    <Skeleton className="h-4 w-4 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                    <Skeleton className="h-4 w-4 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            {/* Fixed message input bar at the bottom */}
            <div className="border-t bg-background p-4 w-full">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative flex gap-2">
                        <div className="flex-1 relative">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Message ${model.name}...`}
                                className="w-full rounded-xl pr-32 min-h-[60px] max-h-[120px] resize-none focus:border-gray-600 transition-all"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (input.trim()) {
                                            handleSubmit(e as any);
                                        }
                                    }
                                }}
                            />
                            <div className="absolute right-3 bottom-3 flex items-center gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    className="p-1.5"
                                >
                                    <Mic className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    className="p-1.5"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </motion.button>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        className="p-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed max-h-10 align-middle hover:bg-muted"
                                        disabled={!input.trim() || isTyping}
                                    >
                                        <motion.div
                                            animate={{ rotate: input.trim() ? [0, 12, 0] : 0 }}
                                            transition={{ duration: 0.5, repeat: 0 }}
                                        >
                                            <Send className="w-5 h-5" />
                                        </motion.div>
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}