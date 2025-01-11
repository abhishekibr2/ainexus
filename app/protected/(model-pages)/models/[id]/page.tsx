'use client';

import { useEffect, useState, use } from "react";
import { getModels } from "@/utils/supabase/actions/assistant/assistant";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic, Globe, Paperclip, Send, Clock, Key, Check, Brain, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings, User2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { createUserChat, updateUserChat, getUserChatById, ChatMessage } from "@/utils/supabase/actions/user/user_chat";
import { useSearchParams } from 'next/navigation';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getUserConnections } from "@/utils/supabase/actions/user/connections";
import { getUserAssignedModels } from "@/utils/supabase/actions/user/assignedModels";

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

    const [model, setModel] = useState<Model | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<number | null>(null);
    const [connectionKeys, setConnectionKeys] = useState<any>(null);
    const [hasAccess, setHasAccess] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchModelAndChat = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Check if user has access to this model
                    const { data: assignedModels } = await getUserAssignedModels(user.id);
                    const hasModelAccess = assignedModels?.some(m => m.assistant_id === parseInt(id));
                    setHasAccess(hasModelAccess || false);

                    if (!hasModelAccess) {
                        setIsLoading(false);
                        return;
                    }

                    // Fetch model data
                    const models = await getModels(user.id);
                    const foundModel = models.find(m => m.id === parseInt(id));
                    if (foundModel) {
                        setModel(foundModel);

                        // If model requires auth, fetch connection keys
                        if (foundModel.is_auth) {
                            const { data: connections } = await getUserConnections(user.id);
                            const modelConnection = connections?.find(c => c.app_id === foundModel.app_id);
                            if (modelConnection) {
                                const keyValueObject = modelConnection.connection_key.reduce((acc: any, curr: string) => {
                                    const [key, value] = curr.split('=');
                                    if (key && value) {
                                        acc[key] = value;
                                    }
                                    return acc;
                                }, {});

                                setConnectionKeys(keyValueObject);
                            }
                        }

                        // If chatId is provided, load that chat's messages
                        if (chatId) {
                            const chatData = await getUserChatById(parseInt(chatId));
                            if (chatData) {
                                setMessages(chatData.chat || []);
                                setCurrentChatId(chatData.id);
                            }
                        }
                    } else {
                        toast({
                            title: "Error",
                            description: "Model not found.",
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
        if (!input.trim() || !model) return;

        setIsTyping(true);
        const timestamp = Date.now();
        const userMessage: Message = {
            id: `user_${timestamp}_${Math.random().toString(36).substring(2, 11)}`,
            role: 'user',
            content: input.trim()
        };

        setInput('');

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Add user message to UI
                setMessages(prev => [...prev, userMessage]);

                let response: any;
                if (model && model.code) {
                    try {
                        // Create a safe execution context
                        const context = {
                            async query(data: { question: string }) {
                                // Execute the model's code in a controlled environment
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
                        console.error('Error executing model code:', error);
                        response = { text: 'Error executing model code' };
                    }
                } else {
                    response = { text: 'Model code not found' };
                }

                const assistantMessage: Message = {
                    id: `assistant_${timestamp + 1}_${Math.random().toString(36).substring(2, 11)}`,
                    role: 'assistant',
                    content: response.text || response.message || response.content || response.response || 'No response received'
                };

                // Add assistant message to UI
                setMessages(prev => [...prev, assistantMessage]);

                // Handle chat creation or update after we have both messages
                if (!currentChatId) {
                    // Create new chat with both messages
                    const chatData = await createUserChat(user.id, model.id, userMessage.content, assistantMessage);
                    setCurrentChatId(chatData.id);

                    // Dispatch custom event for new chat
                    const event = new CustomEvent('chatCreated', {
                        detail: {
                            id: chatData.id,
                            heading: userMessage.content,
                            model_id: model.id
                        }
                    });
                    window.dispatchEvent(event);
                } else {
                    // Update existing chat with both messages
                    await updateUserChat(currentChatId, [userMessage, assistantMessage]);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: "Failed to get response from the model.",
                variant: "destructive",
            });
        } finally {
            setIsTyping(false);
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

    if (!hasAccess || !model) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <div className="text-muted-foreground mb-4">
                        You don't have access to this model. Please purchase this model from the marketplace.
                    </div>
                    <Button onClick={() => window.history.back()}>Go Back</Button>
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
                                {model?.is_auth && (
                                    <HoverCard>
                                        <HoverCardTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Key className="h-4 w-4 mr-2" />
                                                Connection Keys
                                            </Button>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80">
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-semibold">Connection Details</h4>
                                                {connectionKeys ? (
                                                    <div className="text-sm space-y-2">
                                                        {Object.entries(connectionKeys).map(([key, value]) => (
                                                            <div key={key} className="flex justify-between items-center">
                                                                <span className="font-medium">{key}:</span>
                                                                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                                                    {value as string}
                                                                </code>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        No connection keys found. Please set up your connection in the model settings.
                                                    </p>
                                                )}
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                )}
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
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    {(() => {
                                        const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                        return <IconComponent className="w-5 h-5" />;
                                    })()}
                                </div>
                                <h1 className="text-xl font-semibold">{model.name}</h1>
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
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                                    {(() => {
                                                        const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                                        return <IconComponent className="w-5 h-5" />;
                                                    })()}
                                                </div>
                                            )}
                                            <motion.div
                                                whileHover={{ scale: 1.01 }}
                                                className={`rounded-2xl p-4 max-w-[70%] ${m.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-muted text-muted-foreground rounded-tl-none'
                                                    }`}
                                            >
                                                <div className="text-sm">{m.content}</div>
                                            </motion.div>
                                            {m.role === 'user' && (
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                                    <User2 className="w-5 h-5 text-primary-foreground" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
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