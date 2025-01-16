'use client';

import { Bot, User2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useEffect, useRef } from "react";

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
}

export function MessageList({ messages, model, isTyping, availableIcons }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    return (
        <div className="h-full overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-6 pb-4">
                <AnimatePresence initial={false} mode="popLayout">
                    {messages.map((m, i) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}
                        >
                            {m.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                    {(() => {
                                        const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                        return <IconComponent className="w-5 h-5" />;
                                    })()}
                                </div>
                            )}
                            <motion.div
                                layout
                                className={`rounded-2xl p-4 max-w-[70%] ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted rounded-tl-none'
                                    }`}
                            >
                                {m.role === 'assistant' ? (
                                    <ReactMarkdown
                                        className="text-2sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0"
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        {...props}
                                                        style={oneDark}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        className="rounded-md"
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code {...props} className={className}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc pl-4 mb-4 last:mb-0">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 last:mb-0">{children}</ol>,
                                            li: ({ children }) => <li className="mb-1">{children}</li>,
                                            h1: ({ children }) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-lg font-bold mb-3">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
                                            a: ({ children, href }) => (
                                                <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                                                    {children}
                                                </a>
                                            ),
                                            blockquote: ({ children }) => (
                                                <blockquote className="border-l-2 border-gray-300 pl-4 italic my-4">
                                                    {children}
                                                </blockquote>
                                            ),
                                        }}
                                    >
                                        {m.content}
                                    </ReactMarkdown>
                                ) : (
                                    <div className="text-2sm">{m.content}</div>
                                )}
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
                            key="typing-indicator"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
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
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
} 