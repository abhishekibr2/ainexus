import React, { useState } from 'react';
import { FlowiseClient } from 'flowise-sdk';
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { ChatHistory } from "./chat-history";
import { ChatMessage } from "@/utils/supabase/actions/user/user_chat";
import { updateUserAssignedModel } from "@/utils/supabase/actions/user/assignedAgents";
import { useRouter } from "next/navigation";
import { getUserChatById, createUserChat, updateUserChat } from "@/utils/supabase/actions/user/user_chat";

interface Model {
    id: number;
    created_at: string;
    name: string;
    description: string;
    icon: string;
    is_auth: boolean;
    created_by: string;
    app_id: number;
    chatflow_id: string;
    fields?: string[];
    override_config?: string;
}

interface ChatContainerProps {
    model: Model;
    user: User | null;
    connectionKeys: any;
    userAssignedModelId: string;
    isAdmin: boolean;
    timezone: string;
    isFavorite: boolean;
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    onFavoriteToggle: () => Promise<void>;
    onDelete: () => Promise<void>;
    availableIcons: { [key: string]: any };
    instruction: string;
}

export function ChatContainer({
    model,
    user,
    connectionKeys,
    userAssignedModelId,
    isAdmin,
    isFavorite,
    messages,
    timezone,
    instruction,
    setMessages,
    onFavoriteToggle,
    onDelete,
    availableIcons,
}: ChatContainerProps) {

    const [isTyping, setIsTyping] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
    const [refreshHistory, setRefreshHistory] = useState(0);
    const { toast } = useToast();
    const router = useRouter();

    const handleChatSelect = async (chatId: number) => {
        try {
            const chatData = await getUserChatById(chatId);
            if (!chatData) {
                throw new Error('Chat not found');
            }
            setMessages(chatData.chat || []);
            router.push(`/protected/agents/${userAssignedModelId}?chatId=${chatId}`);
        } catch (error) {
            console.error('Error loading chat:', error);
            toast({
                title: "Error",
                description: "Failed to load chat history. Please try again.",
                variant: "destructive",
            });
            throw error; // Re-throw to let ChatHistory handle the error state
        }
    };

    const handleSubmit = async (message: string) => {
        if (!model || isTyping) return;

        setIsTyping(true);
        setIsHistoryExpanded(false);
        const timestamp = Date.now();
        const userMessage: ChatMessage = {
            id: `user_${timestamp}_${Math.random().toString(36).substring(2, 11)}`,
            role: 'user',
            content: message
        };

        let currentChatId: number | null = null;

        // Create assistant message for UI
        const assistantMessageId = `assistant_${timestamp + 1}_${Math.random().toString(36).substring(2, 11)}`;
        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: ''
        };

        // Create a new chat or get existing chat ID
        if (messages.length === 0 && user) {
            try {
                const { chatId } = await createUserChat(user.id, userAssignedModelId, message, assistantMessage);
                currentChatId = chatId;
                router.push(`/protected/agents/${userAssignedModelId}?chatId=${chatId}`);
                setRefreshHistory(prev => prev + 1);
                // For new chat, set initial messages
                setMessages([userMessage, assistantMessage]);
            } catch (error: any) {
                console.error('Error creating chat:', error);
                toast({
                    title: "Error",
                    description: "Failed to create new chat",
                    variant: "destructive",
                });
                setIsTyping(false);
                return;
            }
        } else {
            const searchParams = new URLSearchParams(window.location.search);
            const chatIdParam = searchParams.get('chatId');
            currentChatId = chatIdParam ? parseInt(chatIdParam) : null;
            // For existing chat, append new messages
            setMessages(prev => [...prev, userMessage, assistantMessage]);
        }

        try {
            const client = new FlowiseClient({
                baseUrl: 'https://flowise.ibrcloud.com',
            });
            const sessionId = userAssignedModelId;
            const overrideConfig = typeof model.override_config === 'string'
                ? JSON.parse(model.override_config || '{}')
                : model.override_config || {};
            setIsStreaming(true);
            const prediction = await client.createPrediction({
                chatflowId: model.chatflow_id,
                question: message,
                streaming: true,
                overrideConfig: overrideConfig
            });

            let content = '';
            for await (const chunk of prediction) {
                if (chunk.event === 'token' && chunk.data) {
                    content += chunk.data;
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === assistantMessageId
                                ? { ...msg, content }
                                : msg
                        )
                    );
                }
            }

            // After getting complete response, update the chat in database
            if (currentChatId) {
                const updatedMessages = messages.length === 0
                    ? [userMessage, { ...assistantMessage, content }]  // For new chat
                    : [...messages, userMessage, { ...assistantMessage, content }];  // For existing chat
                await updateUserChat(currentChatId, updatedMessages);
            }

        } catch (error: any) {
            console.error('Error:', error);
            const errorMessage = `Error: ${error.message || 'Failed to get response from the model.'}`;
            setMessages(prev =>
                prev.map(m =>
                    m.id === assistantMessageId
                        ? { ...m, content: errorMessage }
                        : m
                )
            );

            // Update chat with error message
            if (currentChatId) {
                const updatedMessages = messages.length === 0
                    ? [userMessage, { ...assistantMessage, content: errorMessage }]  // For new chat
                    : [...messages, userMessage, { ...assistantMessage, content: errorMessage }];  // For existing chat
                await updateUserChat(currentChatId, updatedMessages);
            }

            toast({
                title: "Error",
                description: error.message || "Failed to get response from the model.",
                variant: "destructive",
            });
        } finally {
            setIsTyping(false);
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-65px)]">
            <ChatHeader
                model={model}
                user={user}
                connectionKeys={connectionKeys}
                instruction={instruction}
                isAdmin={isAdmin}
                isFavorite={isFavorite}
                onFavoriteToggle={onFavoriteToggle}
                onDelete={onDelete}
                onSave={async (settings) => {
                    try {
                        console.log(userAssignedModelId)
                        console.log({
                            name: settings.name,
                            description: settings.description,
                            instruction: settings.instructions,
                            user_connection_id: settings.user_connection_id
                        })
                        const { error } = await updateUserAssignedModel(userAssignedModelId, {
                            name: settings.name,
                            description: settings.description,
                            instruction: settings.instructions,
                            user_connection_id: settings.user_connection_id
                        });
                        console.log(error)
                        if (error) throw error;

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
                onConnectionKeysChange={() => { }}
                availableIcons={availableIcons}
                showFullHeader={messages.length === 0}
            />

            {user && (
                <ChatHistory
                    userId={user.id}
                    modelId={userAssignedModelId}
                    currentChatId={messages.length > 0 ? parseInt(messages[0].id.split('_')[1]) : null}
                    isExpanded={isHistoryExpanded}
                    onExpandedChange={setIsHistoryExpanded}
                    onChatSelect={handleChatSelect}
                    refreshTrigger={refreshHistory}
                />
            )}

            <main className="flex-1 overflow-hidden relative">
                {messages.length === 0 ? (
                    <div className="h-full" />
                ) : (
                    <MessageList
                        key={messages.map(m => m.id).join(',')}
                        messages={messages}
                        model={model}
                        isTyping={isTyping}
                        availableIcons={availableIcons}
                        userAssignedModelId={userAssignedModelId.toString()}
                    />
                )}
            </main>

            <ChatInput
                isTyping={isTyping}
                onSubmit={handleSubmit}
                modelName={model.name}
                messages={messages}
                flowise_id={model.chatflow_id}
            />
        </div>
    );
}