'use client';

import { useEffect, useState } from 'react';
import { getUserChatsByModel } from '@/utils/supabase/actions/user/user_chat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistoryProps {
    userId: string;
    modelId: string;
    currentChatId: number | null;
    isExpanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
    onChatSelect: (chatId: number) => Promise<void>;
    refreshTrigger?: number;
}

export function ChatHistory({
    userId,
    modelId,
    currentChatId,
    isExpanded,
    onExpandedChange,
    onChatSelect,
    refreshTrigger = 0
}: ChatHistoryProps) {
    const [chats, setChats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<number | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                setIsLoading(true);
                const chatHistory = await getUserChatsByModel(userId, modelId);
                setChats(chatHistory || []);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChats();
    }, [userId, modelId, refreshTrigger]);

    useEffect(() => {
        const chatId = searchParams.get('chatId');
        setSelectedChat(chatId ? parseInt(chatId) : null);
    }, [searchParams]);

    const handleChatSelect = async (chatId: number) => {
        if (selectedChat === chatId) return;
        setSelectedChat(chatId);
        try {
            await onChatSelect(chatId);
            setSelectedChat(null);
            onExpandedChange(false);
        } catch (error) {
            console.error('Error loading chat:', error);
            setSelectedChat(null);
        }
    };

    if (chats.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="w-full flex items-center justify-between py-2 px-4 hover:bg-background/80"
                    onClick={() => onExpandedChange(!isExpanded)}
                >
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Your recent chats
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </Button>
                {isExpanded && (
                    <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {isLoading ? (
                            <div className="col-span-full flex items-center justify-center py-2">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                {chats.slice(0, 6).map((chat) => (
                                    <Button
                                        key={chat.id}
                                        variant={currentChatId === chat.id ? "secondary" : "outline"}
                                        className="relative h-auto flex-col items-start gap-1 py-2 px-3"
                                        onClick={() => handleChatSelect(chat.id)}
                                        disabled={selectedChat === chat.id}
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                            <div className="font-medium truncate text-sm">{chat.heading}</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground w-full text-left">
                                            {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                                        </div>
                                        {selectedChat === chat.id && (
                                            <div>
                                                <p>Current Chat </p>
                                            </div>
                                        )}
                                    </Button>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
} 