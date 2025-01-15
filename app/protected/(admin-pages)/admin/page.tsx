"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getModels, deleteModel } from "@/utils/supabase/actions/assistant/assistant";
import { Model } from "./components/types";
import { ModelList } from "./components/ModelList";
import { UserConnections } from "./user-connections";
import { ApplicationList } from "./components/ApplicationList";

export default function AdminPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Get the current user and fetch their models
        const fetchUserAndModels = async () => {
            setIsLoading(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);
                try {
                    const models = await getModels(user.id);
                    setModels(models);
                } catch (error) {
                    console.error('Error fetching models:', error);
                    toast({
                        title: "Error",
                        description: "Failed to load models. Please try again.",
                        variant: "destructive",
                    });
                }
            }
            setIsLoading(false);
        };

        fetchUserAndModels();
    }, []);

    const handleDeleteModel = async (modelId: number) => {
        if (!userId) return;

        try {
            await deleteModel(modelId, userId);

            // Refresh the models list
            const updatedModels = await getModels(userId);
            setModels(updatedModels);

            toast({
                title: "Success",
                description: "Agent deleted successfully!",
            });
        } catch (error) {
            console.error('Error deleting model:', error);
            toast({
                title: "Error",
                description: "Failed to delete agent. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <motion.div
            className="container mx-auto py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="flex justify-between items-center mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </motion.div>

            <Tabs defaultValue="models" className="space-y-4">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <TabsList>
                        <TabsTrigger value="models">Agents</TabsTrigger>
                        <TabsTrigger value="connections">User Connections</TabsTrigger>
                        <TabsTrigger value="applications">Applications</TabsTrigger>
                    </TabsList>
                </motion.div>

                <TabsContent value="models" className="space-y-4">
                    <ModelList
                        models={models}
                        isLoading={isLoading}
                        userId={userId}
                        onModelsUpdate={setModels}
                        onDeleteModel={handleDeleteModel}
                    />
                </TabsContent>

                <TabsContent value="connections" className="space-y-4">
                    <motion.div
                        className="p-4 bg-background rounded-lg border"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <UserConnections />
                    </motion.div>
                </TabsContent>

                <TabsContent value="applications" className="space-y-4">
                    <motion.div
                        className="p-4 bg-background rounded-lg border"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <ApplicationList />
                    </motion.div>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
