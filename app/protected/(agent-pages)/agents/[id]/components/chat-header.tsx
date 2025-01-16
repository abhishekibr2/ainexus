'use client';

import { Bot, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ModelSettingsDialog } from "./model-settings-dialog";
import { AccessibleVariablesDialog } from "./accessible-variables-dialog";
import { User } from "@supabase/supabase-js";

interface Model {
    id: number;
    name: string;
    description: string;
    icon: string;
    is_auth: boolean;
    app_id: number;
    fields?: string[];
}

interface ChatHeaderProps {
    model: Model;
    user: User | null;
    connectionKeys: any;
    isAdmin: boolean;
    isFavorite: boolean;
    onFavoriteToggle: () => Promise<void>;
    onDelete: () => Promise<void>;
    onSave: (settings: any) => Promise<void>;
    onConnectionKeysChange: (keys: any) => void;
    availableIcons: { [key: string]: any };
    showFullHeader?: boolean;
}

export function ChatHeader({
    model,
    user,
    connectionKeys,
    isAdmin,
    isFavorite,
    onFavoriteToggle,
    onDelete,
    onSave,
    onConnectionKeysChange,
    availableIcons,
    showFullHeader = false
}: ChatHeaderProps) {
    return (
        <motion.div
            key={showFullHeader ? "full-header" : "minimal-header"}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${!showFullHeader ? 'shadow-sm' : 'h-[calc(100vh-65px-180px)]'}`}
        >
            <div className={`max-w-4xl mx-auto p-4 ${showFullHeader ? 'h-full flex flex-col' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {(() => {
                                const IconComponent = model.icon ? availableIcons[model.icon] || Bot : Bot;
                                return <IconComponent className="w-6 h-6" />;
                            })()}
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">{model.name}</h1>
                            {!showFullHeader && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{model.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onFavoriteToggle}
                            className={`${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                        </Button>
                        {isAdmin && <AccessibleVariablesDialog user={user} model={model} connectionKeys={connectionKeys} />}
                        <ModelSettingsDialog
                            model={model}
                            connectionKeys={connectionKeys}
                            onDelete={onDelete}
                            onSave={onSave}
                            isAdmin={isAdmin}
                            onConnectionKeysChange={onConnectionKeysChange}
                        />
                    </div>
                </div>
                {showFullHeader && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="flex-1 flex flex-col items-center justify-center"
                    >
                        {model.icon && (
                            <div className="flex justify-center mb-6">
                                {(() => {
                                    const IconComponent = availableIcons[model.icon] || Bot;
                                    return (
                                        <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center">
                                            <IconComponent className="w-14 h-14" />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        <div className="space-y-3 max-w-2xl mx-auto text-center">
                            <h1 className="text-4xl font-bold tracking-tight">
                                {model.name}
                            </h1>
                            <p className="text-lg text-muted-foreground">{model.description}</p>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
} 