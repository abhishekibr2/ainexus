'use client';

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

interface ChatInputProps {
    isTyping: boolean;
    onSubmit: (message: string) => Promise<void>;
    modelName: string;
    messages: any[];
    flowise_id: string | null;
}

export function ChatInput({ isTyping, onSubmit, modelName, messages = [], flowise_id }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isTyping) return;

        try {
            setInput(''); // Clear input immediately after submission
            await onSubmit(trimmedInput);
        } catch (error) {
            console.error('Error submitting message:', error);
            setInput(trimmedInput); // Restore input if submission fails
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                handleSubmit(e as any);
            }
        }
    };
    

    return (
        <div className="flex flex-col">
            <div className="border-t bg-background p-4 w-full">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative flex gap-2">
                        <div className="flex-1 relative">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Message ${modelName}...`}
                                className="w-full rounded-xl pr-32 min-h-[60px] max-h-[120px] resize-none focus:border-gray-600 transition-all overflow-hidden"
                                rows={1}
                                onKeyDown={handleKeyDown}
                                disabled={isTyping}
                            />
                            <div className="absolute right-3 bottom-3 flex items-center gap-3">
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