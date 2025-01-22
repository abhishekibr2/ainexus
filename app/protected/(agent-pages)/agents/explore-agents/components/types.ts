import { LucideIcon } from "lucide-react";
import { z } from "zod";

export interface ConnectionKey {
    key: string;
    value: string;
}

export interface Connection {
    id: number;
    user_id: string;
    app_id: number;
    connection_name: string;
    connection_key: string[];
    parsedConnectionKeys?: ConnectionKey[];
}

export interface Model {
    id: number;
    name: string;
    description?: string;
    icon: string;
    instruction?: string;
    created_at: string;
    is_public: boolean;
    is_auth: boolean;
    override_config: any;
    created_by: {
        name: string;
    };
    app_id: number;
    permission?: {
        type: 'global' | 'restricted';
        restricted_to?: ('user' | 'workspace')[];
        restricted_users?: string[];
        restricted_workspaces?: number[];
    };
    chatflow_id: string;
    fields: string[];
    o_auth: boolean;
    provider?: string;
}

// Step form schema
export const modelConfigSchema = z.object({
    // Step 1: Basic Configuration
    basic: z.object({
        override_name: z.string().optional(),
        override_description: z.string().optional().or(z.string().min(10, "Description must be at least 10 characters")),
    }),
    // Step 2: Authentication (if required)
    auth: z.object({
        user_connection_id: z.number().optional(),
        config_keys: z.record(z.string(), z.string()).optional()
    }).optional(),
    // Step 3: Advanced Settings
    advanced: z.object({
        override_instructions: z.string().optional(),
        permission_scope: z.enum(["public", "private", "team"]).default("private"),
    }),
});

export type ModelConfigValues = z.infer<typeof modelConfigSchema>;

// Default model config
export const defaultModelConfig: ModelConfigValues = {
    basic: {
        override_name: "",
        override_description: "",
    },
    auth: {
        user_connection_id: undefined,
        config_keys: {},
    },
    advanced: {
        override_instructions: "",
        permission_scope: "private",
    },
};

export interface IconType {
    id: string;
    icon: LucideIcon;
    label: string;
}

export const availableIcons = [
    { id: "brain", icon: "Brain", label: "Brain" },
    { id: "robot", icon: "Bot", label: "Robot" },
    { id: "chat", icon: "MessageSquare", label: "Chat" },
    { id: "code", icon: "Code2", label: "Code" },
    { id: "document", icon: "FileText", label: "Document" },
    { id: "education", icon: "GraduationCap", label: "Education" },
    { id: "analytics", icon: "BarChart3", label: "Analytics" },
    { id: "ai", icon: "Sparkles", label: "AI" },
    { id: "power", icon: "Zap", label: "Power" },
    { id: "database", icon: "Database", label: "Database" },
    { id: "search", icon: "Search", label: "Search" },
    { id: "settings", icon: "Settings", label: "Settings" },
] as const;

export const categories = [
    { id: "all", name: "All" },
    { id: "writing", name: "Writing" },
    { id: "analysis", name: "Analysis" },
    { id: "coding", name: "Coding" },
    { id: "image", name: "Image" },
    { id: "audio", name: "Audio" },
    { id: "video", name: "Video" },
    { id: "other", name: "Other" }
] as const; 