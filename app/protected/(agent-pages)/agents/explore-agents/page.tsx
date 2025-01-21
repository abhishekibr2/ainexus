'use client';

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getModels } from "@/utils/supabase/actions/assistant/assistant";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'next/navigation';
import type { Model } from "./components/types";
import { ModelCard } from "./components/ModelCard";
import { ModelCardSkeleton } from "./components/ModelCardSkeleton";
import { EmptyState } from "./components/EmptyState";
import { categories } from "./components/types";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
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

export default function ExploreModels() {
    const [models, setModels] = useState<Model[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const modelId = searchParams.get('id');

    useEffect(() => {
        const fetchModels = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const fetchedModels = await getModels(user.id);
                    // Get current workspace from localStorage
                    const storedWorkspace = localStorage.getItem('selectedWorkspace');
                    const currentWorkspace = storedWorkspace ? JSON.parse(storedWorkspace) : null;
                    const currentWorkspaceId = currentWorkspace?.id;

                    // Filter models based on permissions
                    const accessibleModels = fetchedModels.filter(model => {
                        const permission = model.permission || { type: 'global' };

                        // If global type, everyone has access
                        if (permission.type === 'global') {
                            return true;
                        }

                        // For restricted type, check user and workspace access
                        if (permission.type === 'restricted') {
                            // Check direct user access
                            if (permission.restricted_users?.includes(user.id)) {
                                return true;
                            }

                            // Check workspace access using current workspace
                            if (permission.restricted_to?.includes('workspace')) {
                                return currentWorkspaceId && permission.restricted_workspaces?.includes(currentWorkspaceId);
                            }

                            return false;
                        }

                        return false;
                    });

                    setModels(accessibleModels);

                    // If modelId is present in URL, scroll to that model and highlight it
                    if (modelId) {
                        const targetModel = accessibleModels.find(m => m.id === parseInt(modelId));
                        if (targetModel) {
                            // Set the category of the target model
                            setSelectedCategory(targetModel.icon || "all");
                            // Set search term to match the model name for easy finding
                            setSearchTerm(targetModel.name);
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error fetching models:', error);
                toast({
                    title: "Error",
                    description: "Failed to load models. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchModels();
    }, [modelId, toast]);

    const filteredModels = models.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || model.icon === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <motion.div
            className="container mx-auto px-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="text-center mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h1 className="text-4xl font-bold mb-4">AI Agents</h1>
                <div className="text-muted-foreground">
                    Discover and use custom AI agents that combine different capabilities,
                    knowledge, and skills.
                </div>
            </motion.div>

            {/* Search Bar */}
            <motion.div
                className="max-w-2xl mx-auto mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <Input
                    type="search"
                    placeholder="Search AI Agents"
                    className="w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </motion.div>

            {/* Categories Tabs */}
            <Tabs
                defaultValue="all"
                className="mb-8"
                value={selectedCategory}
                onValueChange={setSelectedCategory}
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {/* <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent">
                        {categories.map((category) => (
                            <TabsTrigger
                                key={category.id}
                                value={category.id}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                onClick={() => {
                                    if (category.id === "all") {
                                        setSearchTerm("");
                                        setSelectedCategory("all")
                                    }
                                }}
                            >
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList> */}
                </motion.div>

                <TabsContent value={selectedCategory} className="mt-6 border-none">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-none"
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {[...Array(6)].map((_, index) => (
                                    <motion.div key={index} variants={item}>
                                        <ModelCardSkeleton />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : filteredModels.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-none"
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {filteredModels.map((model) => (
                                    <ModelCard key={model.id} model={model} />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
