'use client';

import { Bot, User2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { useEffect, useRef, useCallback } from "react";

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

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "instant" });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [scrollToBottom, messages.length, isTyping]);

    return (
        <div className="h-full overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-6 pb-4">
                {messages.map((m, i) => (
                    <div
                        key={m.id}
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
                        <div
                            className={`rounded-2xl p-4 max-w-[70%] min-h-[60px] ${m.role === 'user'
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
                                    {m.content || ' '}
                                </ReactMarkdown>
                            ) : (
                                <div className="text-2sm">{m.content}</div>
                            )}
                        </div>
                        {m.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <User2 className="w-5 h-5 text-primary-foreground" />
                            </div>
                        )}
                    </div>
                ))}
                <AnimatePresence mode="wait">
                    {isTyping && (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex justify-start items-start gap-2"
                        >
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {(() => {
                                    const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                    return <IconComponent className="w-5 h-5" />;
                                })()}
                            </div>
                            <motion.div 
                                className="rounded-2xl p-4 max-w-[70%] bg-gradient-to-r from-muted via-muted/90 to-muted/80 rounded-tl-none shadow-sm"
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-primary/80"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.3, 1, 0.3]
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-primary/80"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.3, 1, 0.3]
                                        }}
                                        transition={{
                                            duration: 1,
                                            delay: 0.2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-primary/80"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.3, 1, 0.3]
                                        }}
                                        transition={{
                                            duration: 1,
                                            delay: 0.4,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
} 