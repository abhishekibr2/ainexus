import React, { useState } from 'react';
import { FlowiseClient } from 'flowise-sdk';
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "@/utils/supabase/actions/user/user_chat";
import { updateUserAssignedModel } from "@/utils/supabase/actions/user/assignedAgents";

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
    userAssignedModelId: number;
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
    availableIcons
}: ChatContainerProps) {

    const [isTyping, setIsTyping] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (message: string) => {
        if (!model || isTyping) return;

        setIsTyping(true);
        const timestamp = Date.now();
        const userMessage: ChatMessage = {
            id: `user_${timestamp}_${Math.random().toString(36).substring(2, 11)}`,
            role: 'user',
            content: message
        };

        setMessages((prev) => [...prev, userMessage]);

        const assistantMessageId = `assistant_${timestamp + 1}_${Math.random().toString(36).substring(2, 11)}`;
        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: ''
        };

        setMessages((prev) => [...prev, assistantMessage]);
        const name = user?.user_metadata?.name
        try {
            const client = new FlowiseClient({
                baseUrl: 'https://flowise.ibrcloud.com',
            });

            setIsStreaming(true);
            const prediction = await client.createPrediction({
                chatflowId: model.chatflow_id,
                question: message,
                streaming: true,
                overrideConfig: model.override_config ? JSON.parse(model.override_config) : undefined
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

        } catch (error: any) {
            console.error('Error:', error);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMessageId
                        ? { ...m, content: `Error: ${error.message || 'Failed to get response from the model.'}` }
                        : m
                )
            );
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