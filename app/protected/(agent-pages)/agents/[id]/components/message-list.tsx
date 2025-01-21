'use client';

import { Bot, User2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useEffect, useRef, useCallback, memo } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { addStarterPrompt, getStarterPrompts } from "@/utils/supabase/actions/user/starterPrompts";
import { useToast } from "@/hooks/use-toast";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface Model {
    name: string;
    icon: string;
}

interface MessageListProps {
    messages: Message[];
    model: Model;
    isTyping: boolean;
    availableIcons: { [key: string]: any };
    userAssignedModelId: string;
}

// Memoized markdown components to prevent unnecessary re-renders
const MemoizedMarkdownComponents = {
    code: memo(({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <SyntaxHighlighter
                {...props}
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-4"
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code {...props} className="bg-muted-foreground/20 rounded px-1">
                {children}
            </code>
        );
    }),
    p: memo(({ children }: { children: React.ReactNode }) => <p className="mb-4 last:mb-0">{children}</p>),
    ul: memo(({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-4 mb-4 last:mb-0 space-y-2">{children}</ul>),
    ol: memo(({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-4 mb-4 last:mb-0 space-y-2">{children}</ol>),
    li: memo(({ children }: { children: React.ReactNode }) => <li>{children}</li>),
    h1: memo(({ children }: { children: React.ReactNode }) => <h1 className="text-xl font-bold mb-4">{children}</h1>),
    h2: memo(({ children }: { children: React.ReactNode }) => <h2 className="text-lg font-bold mb-3">{children}</h2>),
    h3: memo(({ children }: { children: React.ReactNode }) => <h3 className="text-md font-bold mb-2">{children}</h3>),
    a: memo(({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    )),
    blockquote: memo(({ children }: { children: React.ReactNode }) => (
        <blockquote className="border-l-2 border-gray-300 pl-4 italic my-4">
            {children}
        </blockquote>
    ))
};

const MessageBubble = memo(({ message, model, availableIcons, userAssignedModelId }: {
    message: Message;
    model: Model;
    availableIcons: { [key: string]: any };
    userAssignedModelId: string;
}) => {
    const isUser = message.role === 'user';
    const IconComponent = isUser ? User2 : (model.icon ? availableIcons[model.icon] || Bot : Bot);
    const { toast } = useToast();

    const handleSaveToStarterPrompts = async () => {
        try {
            // Get current starter prompts
            const currentPrompts = await getStarterPrompts(userAssignedModelId);

            // Check if prompt already exists
            if (currentPrompts.includes(message.content)) {
                toast({
                    title: "Already exists",
                    description: "This prompt is already saved in starter prompts.",
                    variant: "default"
                });
                return;
            }

            // Add the new prompt
            await addStarterPrompt(userAssignedModelId, message.content);
            toast({
                title: "Success",
                description: "Prompt saved successfully.",
                variant: "default"
            });
        } catch (error) {
            console.error('Failed to save starter prompt:', error);
            toast({
                title: "Error",
                description: "Failed to save starter prompt.",
                variant: "destructive"
            });
        }
    };

    // Don't render empty assistant messages
    if (!isUser && !message.content) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            layout
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-3`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5" />
                </div>
            )}

            <div className={`rounded-2xl p-4 max-w-[80%] ${isUser
                ? 'bg-primary text-primary-foreground rounded-tr-none ml-8'
                : 'bg-muted rounded-tl-none mr-8'
                }`}>
                {isUser ? (
                    <div className="flex items-start gap-2">
                        <div className="text-sm flex-grow">{message.content}</div>
                    </div>
                ) : (
                    <ReactMarkdown
                        className="text-sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0"
                        remarkPlugins={[remarkGfm, remarkMath]}
                        components={MemoizedMarkdownComponents as Components}
                    >
                        {message.content}
                    </ReactMarkdown>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5 text-primary-foreground" />
                </div>
            )}
            {isUser && (
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleSaveToStarterPrompts}>
                                Save to Starter Prompts
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </motion.div>
    );
});

MessageBubble.displayName = 'MessageBubble';


const TypingIndicator = memo(() => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        layout
        className="flex items-start gap-3"
    >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
        </div>
        <div className="bg-muted rounded-2xl rounded-tl-none p-4 flex items-center min-w-[60px]">
            <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full bg-foreground/25"
                        animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.3, 1, 0.3]
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </div>
    </motion.div>
));

TypingIndicator.displayName = 'TypingIndicator';


export function MessageList({ messages, model, isTyping, availableIcons, userAssignedModelId }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [scrollToBottom, messages.length, isTyping]);

    return (
        <div className="h-full overflow-y-auto px-4 py-6">
            <motion.div
                className="max-w-4xl mx-auto space-y-6"
                layout
            >
                <AnimatePresence mode="popLayout">
                    {messages.filter(m => m.role === 'user' || m.content).map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            model={model}
                            availableIcons={availableIcons}
                            userAssignedModelId={userAssignedModelId}
                        />
                    ))}

                    {isTyping && (
                        <TypingIndicator
                            key="typing"
                        />
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </motion.div>
        </div>
    );
}