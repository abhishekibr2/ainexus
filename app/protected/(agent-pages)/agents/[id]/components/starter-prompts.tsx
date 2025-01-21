'use client';

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getStarterPrompts } from "@/utils/supabase/actions/user/starterPrompts";

interface StarterPromptsProps {
    onPromptSelect: (prompt: string) => void;
    isTyping: boolean;
    userAssignedModelId: string;
}

export function StarterPrompts({ onPromptSelect, isTyping, userAssignedModelId }: StarterPromptsProps) {
    const [prompts, setPrompts] = useState<string[]>([]);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const prompts = await getStarterPrompts(userAssignedModelId);
                if (prompts.length === 0) {
                    // Fallback to default prompts if none are set
                    setPrompts([
                        "Can you explain what you can help me with?",
                        "I'm new here. How should I get started?"
                    ]);
                } else {
                    setPrompts(prompts);
                }
            } catch (error) {
                console.error('Error fetching prompts:', error);
                // Fallback to default prompts if there's an error
                setPrompts([
                    "Can you explain what you can help me with?",
                    "I'm new here. How should I get started?"
                ]);
            }
        };

        fetchPrompts();
    }, [userAssignedModelId]);

    return (
        <div className="w-full max-w-4xl mx-auto px-4 mb-4">
            <motion.div
                className="flex flex-wrap gap-2"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {prompts.map((prompt, index) => (
                    <motion.button
                        key={index}
                        onClick={() => !isTyping && onPromptSelect(prompt)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-background hover:bg-muted transition-colors ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        whileHover={!isTyping ? { scale: 1.02 } : {}}
                        whileTap={!isTyping ? { scale: 0.98 } : {}}
                        disabled={isTyping}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">{prompt.length > 30 ? `${prompt.slice(0, 20)}...` : prompt}</span>
                    </motion.button>
                ))}
            </motion.div>
        </div>
    );
} 