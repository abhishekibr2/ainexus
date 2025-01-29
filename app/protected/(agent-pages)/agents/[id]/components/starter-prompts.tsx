'use client';

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getStarterPrompts } from "@/utils/supabase/actions/user/starterPrompts";

interface StarterPromptsProps {
    onPromptSelect: (prompt: string) => void;
    isTyping: boolean;
    model: {
        chatflow_id: string;
    };
}

interface FlowiseConfig {
    starterPrompts: {
        [key: string]: {
            prompt: string;
        };
    };
    uploads: {
        isSpeechToTextEnabled: boolean;
        isImageUploadAllowed: boolean;
        isRAGFileUploadAllowed: boolean;
        imgUploadSizeAndTypes: any[];
        fileUploadSizeAndTypes: any[];
    };
}

export function StarterPrompts({ onPromptSelect, isTyping, model }: StarterPromptsProps) {
    const [prompts, setPrompts] = useState<string[]>([]);

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const prompts = await getStarterPrompts(model.chatflow_id);
                if (prompts.length === 0) {
                    // Fetch from Flowise API if no prompts are set
                    try {
                        const response = await fetch(`https://flowise.ibrcloud.com/api/v1/public-chatbotConfig/${model.chatflow_id}`);
                        if (!response.ok) {
                            throw new Error('Failed to fetch from Flowise API');
                        }
                        const data: FlowiseConfig = await response.json();
                        if (data.starterPrompts && Object.keys(data.starterPrompts).length > 0) {
                            // Convert the object structure to array of prompts
                            const starterPromptsArray = Object.values(data.starterPrompts).map(item => item.prompt);
                            setPrompts(starterPromptsArray);
                        } else {
                            // Fallback if no starter prompts in Flowise response
                            setPrompts([
                                "Can you explain what you can help me with?",
                                "I'm new here. How should I get started?"
                            ]);
                        }
                    } catch (flowiseError) {
                        console.error('Error fetching from Flowise:', flowiseError);
                        // Fallback if Flowise API fails
                        setPrompts([
                            "Can you explain what you can help me with?",
                            "I'm new here. How should I get started?"
                        ]);
                    }
                } else {
                    setPrompts(prompts);
                }
            } catch (error) {
                console.error('Error fetching prompts:', error);
                setPrompts([
                    "Can you explain what you can help me with?",
                    "I'm new here. How should I get started?"
                ]);
            }
        };

        fetchPrompts();
    }, [model.chatflow_id]);

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