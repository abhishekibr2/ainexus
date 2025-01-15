import { LucideIcon, Brain, Bot, MessageSquare, Code2, FileText, GraduationCap, BarChart3, Sparkles, Zap, Database, Search, Settings } from "lucide-react";

export interface NewModel {
    name: string;
    description: string;
    icon: string;
    is_auth: boolean;
    code: string;
    app_id: number | null;
}

export interface Model extends NewModel {
    id: number;
    created_by: string;
    created_at: string;
}

export interface AppOption {
    id: number;
    name: string;
    description: string;
    auth_required: boolean;
    fields: string[];
}

// Predefined icons
export const availableIcons: { id: string; icon: LucideIcon; label: string }[] = [
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

// Sample descriptions for different types of AI models
export const sampleDescriptions = [
    "An advanced AI model that leverages state-of-the-art natural language processing to understand and respond to user queries with high accuracy and contextual awareness.",
    "A powerful machine learning model designed to analyze and process complex data patterns, providing actionable insights and predictive analytics in real-time.",
    "An intelligent assistant that combines multiple AI capabilities to help users streamline their workflow and enhance productivity through automated task management.",
    "A sophisticated neural network that excels at understanding and generating human-like text, perfect for content creation and communication tasks.",
    "A cutting-edge AI solution that processes and analyzes documents with high precision, extracting key information and insights automatically.",
    "An innovative model that leverages deep learning to understand and generate creative content, helping users explore new ideas and possibilities.",
    "A versatile AI assistant that adapts to user needs, providing personalized recommendations and solutions based on learning patterns.",
    "A robust machine learning model optimized for performance and accuracy, delivering reliable results for complex computational tasks.",
    "An AI-powered analysis tool that transforms raw data into meaningful insights, helping users make data-driven decisions.",
    "A next-generation language model that understands context and nuance, enabling natural and engaging conversations.",
]; 