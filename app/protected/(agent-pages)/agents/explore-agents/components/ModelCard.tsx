import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Clock, Key, Check, Brain, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { assignModelToUser } from "@/utils/supabase/actions/user/assignedAgents";
import { Model } from "./types";
import { ModelConfigForm } from "./ModelConfigForm";

const iconMap = {
    brain: Brain,
    robot: Bot,
    chat: MessageSquare,
    code: Code2,
    document: FileText,
    education: GraduationCap,
    analytics: BarChart3,
    ai: Sparkles,
    power: Zap,
    database: Database,
    search: Search,
    settings: Settings,
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

const MotionCard = motion(Card);

interface ModelCardProps {
    model: Model;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
    const IconComponent = iconMap[model.icon as keyof typeof iconMap] || Bot;
    const [isLoading, setIsLoading] = useState(false);
    const [showConfigForm, setShowConfigForm] = useState(false);
    const { toast } = useToast();

    const handleConfigSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            // First assign model to user with additional configuration
            if (model.is_auth) {
                if (!data.auth?.user_connection_id) {
                    toast({
                        title: "Error",
                        description: "Please select a connection for this agent",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }

                const { data: assignedModel, error: assignError } = await assignModelToUser(
                    user.id,
                    model.app_id,
                    data.basic?.override_name || model.name,
                    model.id,
                    data.basic?.override_description,
                    data.advanced?.override_instructions,
                    data.auth.user_connection_id
                );

                if (assignError) throw assignError;
            } else {
                // For non-auth models, proceed without connection
                const { data: assignedModel, error: assignError } = await assignModelToUser(
                    user.id,
                    model.app_id,
                    data.basic?.override_name || model.name,
                    model.id,
                    data.basic?.override_description,
                    data.advanced?.override_instructions,
                    undefined // No connection needed for non-auth models
                );

                if (assignError) throw assignError;
            }

            toast({
                title: "Success",
                description: "Model configured and added successfully",
            });

            // Dispatch custom event with full model data
            const event = new CustomEvent('modelAssigned', {
                detail: {
                    assistant_id: model.id,
                    assistant_name: data.basic?.override_name || model.name,
                    app_id: model.app_id
                }
            });
            window.dispatchEvent(event);

            setShowConfigForm(false);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to configure agent",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={showConfigForm} onOpenChange={setShowConfigForm}>
            <DialogTrigger asChild>
                <MotionCard
                    variants={item}
                    layout
                    className="group relative overflow-hidden bg-background hover:scale-[1.02] hover:shadow-xl transition-all duration-300 ease-out cursor-pointer"
                    whileHover={{
                        y: -5,
                        transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                >
                    {/* Glow Effect Container */}
                    <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                        whileHover={{ scale: 1.1 }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
                    </motion.div>

                    <div className="relative p-6">
                        {/* Header Section */}
                        <div className="flex items-start gap-4">
                            <div className="relative">
                                {/* Icon Container with new hover effect */}
                                <motion.div
                                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-background group-0 transition-all duration-300"
                                    whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <IconComponent className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                </motion.div>
                                {/* Auth Badge - Updated style */}
                                {model.is_auth && (
                                    <motion.div
                                        className="absolute -top-1 -right-1 w-3 h-3"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75" />
                                        <span className="absolute inset-0 rounded-full bg-yellow-400" />
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Title and Description */}
                                <div className="space-y-1.5">
                                    <motion.div layout className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors duration-300">
                                            {model.name}
                                        </h3>
                                    </motion.div>
                                    <motion.p
                                        layout
                                        className="text-sm text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/80 transition-colors duration-300"
                                    >
                                        {model.description}
                                    </motion.p>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Section */}
                        <motion.div
                            layout
                            className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground transition-colors duration-300"
                        >
                            <div className="flex items-center gap-4">
                                {/* Creation Date */}
                                <motion.div
                                    className="flex items-center gap-1.5 group-hover:text-muted-foreground/80 transition-colors duration-300"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{new Date(model.created_at).toLocaleDateString()}</span>
                                </motion.div>

                                {/* API Status */}
                                {model.is_auth ? (
                                    <motion.div
                                        className="flex items-center gap-1.5 text-yellow-600/80 group-hover:text-yellow-600 transition-colors duration-300"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <Key className="h-3.5 w-3.5" />
                                        <span>Auth Required</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        className="flex items-center gap-1.5 text-green-600/80 group-hover:text-green-600 transition-colors duration-300"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                        <span>Public API</span>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </MotionCard>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/5">
                                <IconComponent className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">{model.name}</h3>
                                <span className="text-sm text-muted-foreground font-normal">Created by {model.created_by.name}</span>
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="py-6">
                    <ModelConfigForm
                        model={model}
                        onSubmit={handleConfigSubmit}
                        onCancel={() => setShowConfigForm(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}; 