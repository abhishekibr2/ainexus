'use client';

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface StarterPromptsProps {
    onPromptSelect: (prompt: string) => void;
    isTyping: boolean;
    flowise_id: string | null;
}

interface StarterPrompt {
    prompt: string;
}

interface ChatbotConfig {
    starterPrompts: {
        [key: string]: StarterPrompt;
    };
}

export function StarterPrompts({ onPromptSelect, isTyping, flowise_id }: StarterPromptsProps) {
    const [prompts, setPrompts] = useState<string[]>([]);

    useEffect(() => {
        const fetchPrompts = async () => {
            if (!flowise_id) {
                setPrompts([
                    "Can you explain what you can help me with?",
                    "I'm new here. How should I get started?"
                ]);
                return;
            }

            try {
                const response = await fetch(`https://flowise.ibrcloud.com/api/v1/public-chatbotConfig/${flowise_id}`);
                const data: ChatbotConfig = await response.json();

                // Convert the object of prompts to an array of prompt strings
                const promptArray = Object.values(data.starterPrompts).map(p => p.prompt);
                setPrompts(promptArray);
            } catch (error) {
                console.error('Error fetching prompts:', error);
                // Fallback to default prompts if API fails
                setPrompts([
                    "Can you explain what you can help me with?",
                    "I'm new here. How should I get started?"
                ]);
            }
        };

        fetchPrompts();
    }, [flowise_id]);

    return (
        <div className="w-full max-w-4xl mx-auto px-4 mb-4">
            <div className="flex flex-wrap gap-2">
                {prompts.map((prompt, index) => (
                    <motion.button
                        key={index}
                        onClick={() => !isTyping && onPromptSelect(prompt)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-background hover:bg-muted transition-colors ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileHover={!isTyping ? { scale: 1.02 } : {}}
                        whileTap={!isTyping ? { scale: 0.98 } : {}}
                        disabled={isTyping}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">{prompt}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
} 