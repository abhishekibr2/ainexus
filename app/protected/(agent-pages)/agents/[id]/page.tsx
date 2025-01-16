'use client';

import { useEffect, useState, use } from "react";
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Brain, Bot, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings } from "lucide-react";
import { getModels } from "@/utils/supabase/actions/assistant/assistant";
import { createUserChat, updateUserChat, getUserChatById, ChatMessage } from "@/utils/supabase/actions/user/user_chat";
import { getUserAssignedModels, updateUserAssignedModel, getUserAssignedModel, deleteUserAssignedModel } from "@/utils/supabase/actions/user/assignedAgents";
import { addToFavorites, removeFromFavorites, checkIsFavorite } from "@/utils/supabase/actions/assistant/favModels";
import { isSuperAdmin } from "@/utils/supabase/admin";
import { User } from "@supabase/supabase-js";
import { getUserConnections } from "@/utils/supabase/actions/user/connections";
import { getUserWorkspaces } from "@/utils/supabase/actions/workspace/workspace";
import { ChatHeader } from "./components/chat-header";
import { MessageList } from "./components/message-list";
import { ChatInput } from "./components/chat-input";

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

export default function ModelPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const chatId = searchParams.get('chatId');
    const router = useRouter();
    const [model, setModel] = useState<Model | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
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
                setUser(user);
                if (user) {
                    // Set admin status
                    setIsAdmin(isSuperAdmin(user.email));
                    // Check if model is favorite
                    const isFav = await checkIsFavorite(user.id, parseInt(id));
                    setIsFavorite(isFav);

                    // Get assigned model details
                    const { data: assignedModels } = await getUserAssignedModels(user.id);
                    const hasModelAccess = assignedModels?.some(m => m.id === parseInt(id));
                    
                    if (!hasModelAccess) {
                        setIsLoading(false);
                        setHasAccess(false);
                        return;
                    }

                    const modelId = assignedModels?.find(m => m.id === parseInt(id))?.assistant_id;
                    // Fetch model data
                    const models = await getModels(user.id);
                    const foundModel = models.find(m => m.id === modelId);
                    
                    if (foundModel) {
                        // Check permissions
                        const permission = foundModel.permission || { type: 'global' };
                        let hasPermission = false;

                        if (permission.type === 'global') {
                            hasPermission = true;
                        } else if (permission.type === 'restricted') {
                            // Check user-level access
                            if (permission.restricted_users?.includes(user.id)) {
                                hasPermission = true;
                            }
                            
                            // Check workspace-level access if user doesn't have direct access
                            if (!hasPermission && permission.restricted_to?.includes('workspace')) {
                                // Get current workspace from localStorage
                                const storedWorkspace = localStorage.getItem('selectedWorkspace');
                                const currentWorkspace = storedWorkspace ? JSON.parse(storedWorkspace) : null;
                                const currentWorkspaceId = currentWorkspace?.id;
                                
                                hasPermission = currentWorkspaceId && permission.restricted_workspaces?.includes(currentWorkspaceId);
                            }
                        }

                        if (!hasPermission) {
                            setHasAccess(false);
                            setIsLoading(false);
                            return;
                        }

                        const assignedModel = await getUserAssignedModel(parseInt(id));
                        //set the model name and description to the assigned model
                        setModel(foundModel);
                        setModel(prev => ({
                            ...prev!,
                            name: assignedModel.name,
                            description: assignedModel.description,
                            is_auth: foundModel.is_auth
                        }));

                        setHasAccess(true);

                        // If model requires auth, fetch connection keys
                        if (foundModel.is_auth) {
                            const { data: connections } = await getUserConnections(user.id);
                            const modelConnection = connections?.find((c: { app_id: number }) => c.app_id === foundModel.app_id);
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

    const handleSubmit = async (message: string) => {
        if (!model || isTyping) return;

        setIsTyping(true);
        const timestamp = Date.now();
        const userMessage: Message = {
            id: `user_${timestamp}_${Math.random().toString(36).substring(2, 11)}`,
            role: 'user',
            content: message
        };

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
                            const connectionKeyString = Object.entries(connectionKeys || {}).map(([key, value]) => `${key}=${value}`).join('&');
                            const vars = connectionKeyString.split('&').reduce((acc: any, curr: string) => {
                                const [key, value] = curr.split('=');
                                if (key && value) {
                                acc[key] = value;
                                }
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
            <ChatHeader
                                        model={model}
                user={user}
                                        connectionKeys={connectionKeys}
                                        isAdmin={isAdmin}
                isFavorite={isFavorite}
                onFavoriteToggle={handleFavoriteToggle}
                                        onDelete={handleDeleteModel}
                onSave={async (settings) => {
                    try {
                        const { error } = await updateUserAssignedModel(parseInt(id), {
                            name: settings.name,
                            description: settings.description,
                            instruction: settings.instructions,
                            user_connection_id: settings.user_connection_id
                        });

                                                if (error) throw error;

                                                setModel(prev => ({
                                                    ...prev!,
                            name: settings.name,
                            description: settings.description
                                                }));

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
                                        onConnectionKeysChange={setConnectionKeys}
                availableIcons={availableIcons}
                showFullHeader={messages.length === 0}
            />

            <main className="flex-1 overflow-hidden relative">
                    {messages.length === 0 ? (
                    <div className="h-full" />
                ) : (
                    <MessageList
                        messages={messages}
                        model={model}
                        isTyping={isTyping}
                        availableIcons={availableIcons}
                    />
                )}
            </main>

            <ChatInput
                isTyping={isTyping}
                onSubmit={handleSubmit}
                modelName={model.name}
                messages={messages}
                modelCode={model.code ? extractModelCode(model.code) : null}
            />
        </div>
    );
}

function extractModelCode(code: string): string | null {
    try {
        const match = code.match(/prediction\/([^"]+)/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting model code:', error);
        return null;
    }
}