"use client";
import React, { useState, useEffect, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, Bot, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings } from "lucide-react";
import { getModels } from "@/utils/supabase/actions/assistant/assistant";
import { getUserChatById, ChatMessage } from "@/utils/supabase/actions/user/user_chat";
import { getUserAssignedModels, deleteUserAssignedModel, getUserAssignedModel } from "@/utils/supabase/actions/user/assignedAgents";
import { addToFavorites, removeFromFavorites, checkIsFavorite } from "@/utils/supabase/actions/assistant/favModels";
import { isSuperAdmin } from "@/utils/supabase/admin";
import { getUserConnections } from "@/utils/supabase/actions/user/connections";
import { getUserName, getUserTimezone } from "@/utils/supabase/actions/user/onboarding";
import { AccessDenied } from "./components/access-denied";
import { ModelNotFound } from "./components/model-not-found";
import { ChatContainer } from "./components/chat-container";
import { User } from "@supabase/supabase-js";
import { LoadingState } from './components/loading-state';

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
    chatflow_id: string;
}

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
    const [modelData, setModelData] = useState<{
        model: Model | null;
        user: User | null;
        timezone: string | null;
        name: string | null;
        hasAccess: boolean;
        isFavorite: boolean;
        isAdmin: boolean;
        connectionKeys: any;
        messages: Message[];
        currentChatId: number | null;
    }>({
        model: null,
        user: null,
        timezone: null,
        name: null,
        hasAccess: false,
        isFavorite: false,
        isAdmin: false,
        connectionKeys: null,
        messages: [],
        currentChatId: null
    });
    const { toast } = useToast();
    const [instruction, setInstruction] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        let isMounted = true;

        const fetchModelAndChat = async () => {
            setIsLoading(true);
            if (!isMounted) return;

            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user || !isMounted) {
                    if (isMounted) {
                        setModelData(prev => ({ ...prev, user: null, hasAccess: false }));
                        setIsLoading(false);
                    }
                    return;
                }

                // Fetch user-related data in parallel
                const [
                    name,
                    timezone,
                    isFav,
                    { data: assignedModels },
                    models
                ] = await Promise.all([
                    getUserName(user.id),
                    getUserTimezone(user.id),
                    checkIsFavorite(user.id, parseInt(id)),
                    getUserAssignedModels(user.id),
                    getModels(user.id)
                ]);

                if (!isMounted) {
                    setIsLoading(false);
                    return;
                }

                const hasModelAccess = assignedModels?.some(m => m.id === parseInt(id));
                if (!hasModelAccess) {
                    if (isMounted) {
                        setModelData(prev => ({
                            ...prev,
                            user,
                            hasAccess: false,
                            name: name ?? null,
                            timezone: timezone ?? null
                        }));
                        setIsLoading(false);
                    }
                    return;
                }

                const modelId = assignedModels?.find(m => m.id === parseInt(id))?.assistant_id;
                const foundModel = models.find(m => m.id === modelId);
                const instruction = assignedModels?.find(m => m.id === parseInt(id))?.instruction;
                setInstruction(instruction);

                if (!foundModel || !isMounted) {
                    if (isMounted) {
                        setModelData(prev => ({
                            ...prev,
                            user,
                            hasAccess: false
                        }));
                        setIsLoading(false);
                    }
                    return;
                }

                const permission = foundModel.permission || { type: 'global' };
                let hasPermission = permission.type === 'global';

                if (!hasPermission && permission.type === 'restricted') {
                    hasPermission = permission.restricted_users?.includes(user.id) || false;

                    if (!hasPermission && permission.restricted_to?.includes('workspace')) {
                        const storedWorkspace = localStorage.getItem('selectedWorkspace');
                        const currentWorkspace = storedWorkspace ? JSON.parse(storedWorkspace) : null;
                        const currentWorkspaceId = currentWorkspace?.id;
                        hasPermission = currentWorkspaceId && permission.restricted_workspaces?.includes(currentWorkspaceId);
                    }
                }

                if (!hasPermission || !isMounted) {
                    if (isMounted) {
                        setModelData(prev => ({
                            ...prev,
                            user,
                            hasAccess: false
                        }));
                        setIsLoading(false);
                    }
                    return;
                }

                const assignedModel = await getUserAssignedModel(parseInt(id));
                if (!isMounted) {
                    setIsLoading(false);
                    return;
                }

                let connectionKeys = null;
                if (foundModel.is_auth) {
                    const { data: connections } = await getUserConnections(user.id);
                    const modelConnection = connections?.find((c: { app_id: number }) => c.app_id === foundModel.app_id);
                    if (modelConnection) {
                        const cleanedKeys = modelConnection.connection_key
                            .map((key: string) => key.replace(/^"/, '').replace(/"$/, ''));

                        connectionKeys = cleanedKeys.reduce((acc: any, curr: string) => {
                            const [key, value] = curr.split('=');
                            if (key && value) {
                                acc[key] = value;
                            }
                            return acc;
                        }, {});
                    }
                }

                let messages: Message[] = [];
                let currentChatId: number | null = null;

                if (chatId) {
                    const chatData = await getUserChatById(parseInt(chatId));
                    if (chatData) {
                        messages = chatData.chat || [];
                        currentChatId = chatData.id;
                    }
                }

                if (!isMounted) {
                    setIsLoading(false);
                    return;
                }

                const updatedModel = {
                    ...foundModel,
                    name: assignedModel.name,
                    description: assignedModel.description,
                    is_auth: foundModel.is_auth
                };

                if (isMounted) {
                    setModelData({
                        model: updatedModel,
                        user,
                        timezone: timezone ?? null,
                        name: name ?? null,
                        hasAccess: true,
                        isFavorite: isFav,
                        isAdmin: isSuperAdmin(user.email),
                        connectionKeys,
                        messages,
                        currentChatId
                    });
                    setIsLoading(false);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                if (isMounted) {
                    toast({
                        title: "Error",
                        description: "Failed to load data. Please try again.",
                        variant: "destructive",
                    });
                    setModelData(prev => ({
                        ...prev,
                        hasAccess: false
                    }));
                    setIsLoading(false);
                }
            }
        };

        fetchModelAndChat();

        return () => {
            isMounted = false;
        };
    }, [id, chatId, toast]);

    const handleDeleteModel = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("User not authenticated");

            const { error } = await deleteUserAssignedModel(parseInt(id));

            if (error) throw error;

            window.dispatchEvent(new CustomEvent('modelDeleted', {
                detail: { modelId: parseInt(id) }
            }));

            toast({
                title: "Success",
                description: "Agent deleted successfully",
            });

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

            if (modelData.isFavorite) {
                const result = await removeFromFavorites(user.id, parseInt(id));
                if (result.success) {
                    setModelData(prev => ({ ...prev, isFavorite: false }));
                    toast({
                        title: "Success",
                        description: "Removed from favorites",
                    });
                    window.dispatchEvent(new CustomEvent('modelUnfavorited', {
                        detail: { modelId: parseInt(id) }
                    }));
                } else {
                    throw new Error(result.message);
                }
            } else {
                const result = await addToFavorites(user.id, parseInt(id));
                if (result.success) {
                    setModelData(prev => ({ ...prev, isFavorite: true }));
                    toast({
                        title: "Success",
                        description: "Added to favorites",
                    });
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
        return <LoadingState />;
    }

    if (!modelData.hasAccess) {
        return <AccessDenied />;
    }

    if (!modelData.model) {
        return <ModelNotFound />;
    }

    return (
        <ChatContainer
            userAssignedModelId={parseInt(id)}
            model={modelData.model}
            user={modelData.user}
            instruction={instruction}
            timezone={modelData.timezone ?? ''}
            connectionKeys={modelData.connectionKeys}
            isAdmin={modelData.isAdmin}
            isFavorite={modelData.isFavorite}
            messages={modelData.messages}
            setMessages={(newMessages: Message[] | ((prev: Message[]) => Message[])) => {
                if (typeof newMessages === 'function') {
                    setModelData(prev => ({ ...prev, messages: newMessages(prev.messages) }));
                } else {
                    setModelData(prev => ({ ...prev, messages: newMessages }));
                }
            }}
            onFavoriteToggle={handleFavoriteToggle}
            onDelete={handleDeleteModel}
            availableIcons={availableIcons}
        />
    );
}