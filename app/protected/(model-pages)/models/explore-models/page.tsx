'use client';

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getModels } from "@/utils/supabase/actions/assistant/assistant";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Brain, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings, Clock, Key, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Predefined icons - same as admin page
const availableIcons: { id: string; icon: any; label: string }[] = [
    { id: "brain", icon: Brain, label: "Brain" },
    { id: "robot", icon: Bot, label: "Robot" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "code", icon: Code2, label: "Code" },
    { id: "document", icon: FileText, label: "Document" },
    { id: "education", icon: GraduationCap, label: "Education" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "ai", icon: Sparkles, label: "AI" },
    { id: "power", icon: Zap, label: "Power" },
    { id: "database", icon: Database, label: "Database" },
    { id: "search", icon: Search, label: "Search" },
    { id: "settings", icon: Settings, label: "Settings" },
];

const categories = [
    { id: "all", name: "All Models" },
    { id: "chat", name: "Chat" },
    { id: "code", name: "Code" },
  { id: "research", name: "Research & Analysis" },
  { id: "education", name: "Education" },
    { id: "productivity", name: "Productivity" },
    { id: "document", name: "Document" },
];

interface Model {
    id: number;
    name: string;
    description: string;
    icon: string;
    is_auth: boolean;
    api_endpoint: string;
    created_by: string;
    created_at: string;
}

const MotionCard = motion(Card);

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

const ModelCard = ({ model }: { model: Model }) => {
    const IconComponent = availableIcons.find(i => i.id === model.icon)?.icon || Bot;
    
    return (
        <Link href={`/protected/models/${model.id}`} className="block">
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
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-background border border-border group-hover:border-primary/25 group-0 transition-all duration-300"
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
                                    <span className="absolute inset-0 rounded-full bg-yellow-400 border-2 border-background" />
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
                        className="mt-4 pt-4 border-t border-border group-hover:border-border/50 flex items-center justify-between text-xs text-muted-foreground transition-colors duration-300"
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
        </Link>
    );
};

const ModelCardSkeleton = () => (
    <Card className="p-6">
      <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </Card>
);

const EmptyState = () => (
    <motion.div 
        className="text-center py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <motion.div 
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
        >
            <Bot className="h-5 w-5 text-muted-foreground" />
        </motion.div>
        <motion.h3 
            className="mt-4 text-lg font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            No models found
        </motion.h3>
        <motion.p 
            className="mt-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
            We couldn't find any models matching your criteria.
        </motion.p>
    </motion.div>
);

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
                    const models = await getModels(user.id);
                    setModels(models);

                    // If modelId is present in URL, scroll to that model and highlight it
                    if (modelId) {
                        const targetModel = models.find(m => m.id === parseInt(modelId));
                        if (targetModel) {
                            // Set the category of the target model
                            setSelectedCategory(targetModel.icon || "all");
                            // Set search term to match the model name for easy finding
                            setSearchTerm(targetModel.name);
                        }
                    }
                }
            } catch (error) {
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
    }, [modelId]);

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
        <h1 className="text-4xl font-bold mb-4">AI Models</h1>
        <p className="text-muted-foreground">
          Discover and use custom AI models that combine different capabilities,
          knowledge, and skills.
        </p>
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
          placeholder="Search AI Models"
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
        <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
                </motion.div>

                <TabsContent value={selectedCategory} className="mt-6">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div 
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
