"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Brain,
    Bot,
    MessageSquare,
    Code2,
    FileText,
    GraduationCap,
    BarChart3,
    Sparkles,
    Zap,
    Database,
    Search,
    Settings,
    type LucideIcon,
    Plus,
    Copy,
    Wand2,
    X,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createModel, getModels, deleteModel, updateModel, getApplications } from "@/utils/supabase/actions/assistant/assistant";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import { Connection, getUserConnections, parseConnectionKey, updateUserConnection } from "@/utils/supabase/actions/user/connections";
import { format } from "date-fns";
import { EditConnectionDialog } from "../../(agent-pages)/connections/edit-connection-dialog";
import { UserConnections } from "./user-connections";

// Predefined icons
const availableIcons: { id: string; icon: LucideIcon; label: string }[] = [
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

// Updated mock data to use database schema property names
const mockModels = [
    {
        id: 1,
        name: "AI PDF Drive",
        description: "The ultimate document assistant.",
        icon: "document",
        is_auth: true,
        code: "// Sample code for PDF processing",
        created_by: "",
        created_at: new Date().toISOString(),
    },
    {
        id: 2,
        name: "Scholar GPT",
        description: "Enhance research with 200M+ resources.",
        icon: "education",
        is_auth: false,
        code: "// Sample code for research assistant",
        created_by: "",
        created_at: new Date().toISOString(),
    },
];

// Sample descriptions for different types of AI models
const sampleDescriptions = [
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

const MotionCard = motion(Card);
const MotionTableRow = motion(TableRow);

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

export default function AdminPage() {
    const [models, setModels] = useState(mockModels);
    const [searchTerm, setSearchTerm] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingModelId, setDeletingModelId] = useState<number | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeletingModel, setIsDeletingModel] = useState(false);
    const [editingModel, setEditingModel] = useState<any | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
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

    const filteredModels = models.filter((model) =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const AddModelDialog = () => {
        const [newModel, setNewModel] = useState({
            name: "",
            description: "",
            icon: availableIcons[0].id,
            is_auth: false,
            code: "",
            app_id: 0,
        });
        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const [appOptions, setAppOptions] = useState<Array<{ id: number; name: string; description: string; auth_required: boolean; fields: string[] }>>([]);
        const [isLoadingApps, setIsLoadingApps] = useState(true);

        useEffect(() => {
            const loadApplications = async () => {
                if (!isDialogOpen) return; // Only load when dialog is open
                try {
                    setIsLoadingApps(true);
                    const apps = await getApplications();
                    setAppOptions(apps);
                } catch (error) {
                    console.error('Error loading applications:', error);
                    toast({
                        title: "Error",
                        description: "Failed to load application types.",
                        variant: "destructive",
                    });
                } finally {
                    setIsLoadingApps(false);
                }
            };

            loadApplications();
        }, [isDialogOpen]);

        const resetForm = () => {
            setNewModel({
                name: "",
                description: "",
                icon: availableIcons[0].id,
                is_auth: false,
                code: "",
                app_id: 0,
            });
        };

        const handleSubmit = async () => {
            if (!userId) {
                toast({
                    title: "Error",
                    description: "You must be logged in to create a model.",
                    variant: "destructive",
                });
                return;
            }

            if (newModel.app_id === 0) {
                toast({
                    title: "Error",
                    description: "Please select an app type.",
                    variant: "destructive",
                });
                return;
            }

            try {
                setIsSubmitting(true);
                await createModel(newModel, userId);

                // Refresh the models list
                const updatedModels = await getModels(userId);
                setModels(updatedModels);

                toast({
                    title: "Success",
                    description: "Model created successfully!",
                });
                resetForm();
                setIsDialogOpen(false);
            } catch (error: any) {
                console.error('Error creating model:', error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to create model. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsSubmitting(false);
            }
        };

        // Update icon selection
        const handleIconSelect = (iconId: string) => {
            setNewModel({ ...newModel, icon: iconId });
        };

        return (
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    if (isSubmitting) return; // Prevent closing during submission
                    if (!open) resetForm();
                    setIsDialogOpen(open);
                }}
            >
                <DialogTrigger asChild>
                    <Button className="mb-4" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Agent
                    </Button>
                </DialogTrigger>
                <DialogContent
                    className="sm:max-w-[800px] p-0 flex flex-col h-[90vh]"
                    onPointerDownOutside={(e) => {
                        if (isSubmitting) {
                            e.preventDefault();
                        }
                    }}
                    onEscapeKeyDown={(e) => {
                        if (isSubmitting) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader className="p-6 pb-0 flex-shrink-0">
                        <DialogTitle>Create New Agent</DialogTitle>
                        <DialogDescription>
                            Configure your AI agent's settings and behavior.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 pt-4 flex-shrink-0">
                            <TabsList className="w-full grid grid-cols-3 gap-2 bg-muted p-1 rounded-md">
                                <TabsTrigger
                                    value="basic"
                                    className="w-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm h-9 px-2 text-sm"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Basic Info
                                </TabsTrigger>
                                <TabsTrigger
                                    value="api"
                                    className="w-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm h-9 px-2 text-sm"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    API Config
                                </TabsTrigger>
                                <TabsTrigger
                                    value="code"
                                    className="w-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm h-9 px-2 text-sm"
                                >
                                    <Code2 className="w-4 h-4 mr-2" />
                                    Code
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 min-h-0">
                            <TabsContent value="basic" className="data-[state=active]:flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Agent Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="Enter agent name"
                                                    value={newModel.name}
                                                    onChange={(e) =>
                                                        setNewModel({ ...newModel, name: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor="description">Description</Label>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const randomIndex = Math.floor(Math.random() * sampleDescriptions.length);
                                                            setNewModel({
                                                                ...newModel,
                                                                description: sampleDescriptions[randomIndex]
                                                            });
                                                        }}
                                                        type="button"
                                                    >
                                                        <Wand2 className="h-4 w-4 mr-2" />
                                                        Generate
                                                    </Button>
                                                </div>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Describe what your model does"
                                                    className="h-40 resize-none font-mono text-sm"
                                                    value={newModel.description}
                                                    onChange={(e) =>
                                                        setNewModel({ ...newModel, description: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Agent Icon</Label>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {availableIcons.map((icon) => {
                                                        const IconComponent = icon.icon;
                                                        const isSelected = newModel.icon === icon.id;
                                                        return (
                                                            <button
                                                                key={icon.id}
                                                                className={`p-2 border rounded-lg hover:border-primary transition-colors ${isSelected ? 'border-primary bg-primary/10' : ''
                                                                    }`}
                                                                onClick={() => handleIconSelect(icon.id)}
                                                                type="button"
                                                            >
                                                                <IconComponent className="h-6 w-6" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="api" className="data-[state=active]:flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="app_id">App Type</Label>
                                                {isLoadingApps ? (
                                                    <Skeleton className="h-10 w-full" />
                                                ) : (
                                                    <select
                                                        id="app_id"
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        value={newModel.app_id}
                                                        onChange={(e) => {
                                                            const selectedApp = appOptions.find(app => app.id === parseInt(e.target.value));
                                                            setNewModel({
                                                                ...newModel,
                                                                app_id: parseInt(e.target.value),
                                                                is_auth: selectedApp?.auth_required || false
                                                            });
                                                        }}
                                                        required
                                                    >
                                                        <option value="0" disabled>Select app type</option>
                                                        {appOptions.map((app) => (
                                                            <option key={app.id} value={app.id}>
                                                                {app.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {appOptions.find(app => app.id === newModel.app_id)?.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {appOptions.find(app => app.id === newModel.app_id)?.description}
                                                    </p>
                                                )}
                                            </div>

                                            {appOptions.find(app => app.id === newModel.app_id)?.fields && newModel.is_auth && (
                                                <div className="space-y-2">
                                                    <Label>Required Fields</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {appOptions.find(app => app.id === newModel.app_id)?.fields.map((field, index) => (
                                                            <Badge key={index} className="text-xs">
                                                                {field}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="is_auth">Authentication Required</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Enable if your API requires authentication
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="is_auth"
                                                    checked={newModel.is_auth}
                                                    onCheckedChange={(checked) => {
                                                        setNewModel({
                                                            ...newModel,
                                                            is_auth: checked,
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="code" className="data-[state=active]:flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        <div className="rounded-lg border p-4 space-y-4 bg-muted/5">
                                            <div className="space-y-2">
                                                <h4 className="font-medium">Accessible Variables</h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <code className="bg-muted px-1 py-0.5 rounded">user.id</code>
                                                        <span className="text-muted-foreground">User's ID</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <code className="bg-muted px-1 py-0.5 rounded">user.email</code>
                                                        <span className="text-muted-foreground">User's email</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {newModel.is_auth && appOptions.find(app => app.id === newModel.app_id)?.fields && (
                                                <div className="space-y-2">
                                                    <h4 className="font-medium">Connection Variables</h4>
                                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                                        {appOptions.find(app => app.id === newModel.app_id)?.fields.map((field, index) => (
                                                            <div key={index} className="flex items-center space-x-2">
                                                                <code className="bg-muted px-1 py-0.5 rounded">vars.{field}</code>
                                                                <span className="text-muted-foreground">Connection {field}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border rounded-md">
                                            <Editor
                                                height="400px"
                                                defaultLanguage="javascript"
                                                theme="vs-dark"
                                                value={newModel.code}
                                                onChange={(value) => {
                                                    setNewModel({
                                                        ...newModel,
                                                        code: value || "",
                                                    });
                                                }}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    lineNumbers: "on",
                                                    scrollBeyondLastLine: false,
                                                    automaticLayout: true,
                                                    tabSize: 2,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>

                        <div className="p-6 border-t flex-shrink-0">
                            <div className="flex justify-end gap-4">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        if (!isSubmitting) {
                                            setIsDialogOpen(false);
                                            resetForm();
                                        }
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Agent'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog >
        );
    };

    const handleDeleteModel = async (modelId: number) => {
        if (!userId) return;

        try {
            setIsDeletingModel(true);
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
        } finally {
            setIsDeletingModel(false);
            setShowDeleteDialog(false);
            setDeletingModelId(null);
        }
    };

    const DeleteConfirmDialog = ({ modelId }: { modelId: number }) => {
        const model = models.find(m => m.id === modelId);

        return (
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete Agent
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold">{model?.name}</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingModel}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeleteModel(modelId)}
                            disabled={isDeletingModel}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingModel ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Agent'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    };

    const ModelSkeletonCard = () => (
        <MotionTableRow
            variants={item}
            initial="hidden"
            animate="show"
            exit="hidden"
        >
            <TableCell><Skeleton className="h-10 w-10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-64" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-8 w-24" /></TableCell>
        </MotionTableRow>
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
                className="mt-2 mb-4 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                Get started by creating your first AI model.
            </motion.p>
            <AddModelDialog />
        </motion.div>
    );

    const EditModelDialog = () => {
        const [modelData, setModelData] = useState({
            name: editingModel?.name || "",
            description: editingModel?.description || "",
            icon: editingModel?.icon || availableIcons[0].id,
            is_auth: editingModel?.is_auth || false,
            code: editingModel?.code || "",
            app_id: editingModel?.app_id || 0,
        });
        const [isEditSubmitting, setIsEditSubmitting] = useState(false);
        const [appOptions, setAppOptions] = useState<Array<{ id: number; name: string; description: string; auth_required: boolean; fields: string[] }>>([]);
        const [isLoadingApps, setIsLoadingApps] = useState(true);

        useEffect(() => {
            const loadApplications = async () => {
                if (!showEditDialog) return; // Only load when dialog is open
                try {
                    setIsLoadingApps(true);
                    const apps = await getApplications();
                    setAppOptions(apps);
                } catch (error) {
                    console.error('Error loading applications:', error);
                    toast({
                        title: "Error",
                        description: "Failed to load application types.",
                        variant: "destructive",
                    });
                } finally {
                    setIsLoadingApps(false);
                }
            };

            loadApplications();
        }, [showEditDialog]);

        useEffect(() => {
            if (editingModel) {
                setModelData({
                    name: editingModel.name,
                    description: editingModel.description,
                    icon: editingModel.icon,
                    is_auth: editingModel.is_auth,
                    code: editingModel.code,
                    app_id: editingModel.app_id,
                });
            }
        }, [editingModel]);

        const handleSubmit = async () => {
            if (!userId || !editingModel) {
                toast({
                    title: "Error",
                    description: "You must be logged in to edit a model.",
                    variant: "destructive",
                });
                return;
            }

            if (modelData.app_id === 0) {
                toast({
                    title: "Error",
                    description: "Please select an app type.",
                    variant: "destructive",
                });
                return;
            }

            try {
                setIsEditSubmitting(true);
                await updateModel(editingModel.id, modelData, userId);

                // Refresh the models list
                const updatedModels = await getModels(userId);
                setModels(updatedModels);

                toast({
                    title: "Success",
                    description: "Agent updated successfully!",
                });
                setShowEditDialog(false);
                setEditingModel(null);
            } catch (error: any) {
                console.error('Error updating model:', error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to update agent. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsEditSubmitting(false);
            }
        };

        const generateRandomDescription = () => {
            const randomIndex = Math.floor(Math.random() * sampleDescriptions.length);
            setModelData({
                ...modelData,
                description: sampleDescriptions[randomIndex]
            });
        };

        // Update icon selection
        const handleIconSelect = (iconId: string) => {
            setModelData({ ...modelData, icon: iconId });
        };

        return (
            <Dialog
                open={showEditDialog}
                onOpenChange={(open) => {
                    if (isEditSubmitting) return; // Prevent closing during submission
                    if (!open) {
                        setEditingModel(null);
                        setModelData({
                            name: "",
                            description: "",
                            icon: availableIcons[0].id,
                            is_auth: false,
                            code: "",
                            app_id: 0,
                        });
                    }
                    setShowEditDialog(open);
                }}
            >
                <DialogContent
                    className="sm:max-w-[800px] p-0 flex flex-col h-[90vh]"
                    onPointerDownOutside={(e) => {
                        if (isEditSubmitting) {
                            e.preventDefault();
                        }
                    }}
                    onEscapeKeyDown={(e) => {
                        if (isEditSubmitting) {
                            e.preventDefault();
                        }
                    }}
                >
                    <DialogHeader className="p-6 pb-0 flex-shrink-0">
                        <DialogTitle>Edit Agent</DialogTitle>
                        <DialogDescription>
                            Update your AI agent's settings and behavior.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 pt-4 flex-shrink-0">
                            <TabsList className="w-full grid grid-cols-3 gap-2 bg-muted p-1 rounded-md">
                                <TabsTrigger
                                    value="basic"
                                    className="w-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm h-9 px-2 text-sm"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Basic Info
                                </TabsTrigger>
                                <TabsTrigger
                                    value="api"
                                    className="w-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm h-9 px-2 text-sm"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    API Config
                                </TabsTrigger>
                                <TabsTrigger
                                    value="code"
                                    className="w-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-sm h-9 px-2 text-sm"
                                >
                                    <Code2 className="w-4 h-4 mr-2" />
                                    Code
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 min-h-0">
                            <TabsContent value="basic" className="data-[state=active]:flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Agent Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="Enter agent name"
                                                    value={modelData.name}
                                                    onChange={(e) =>
                                                        setModelData({ ...modelData, name: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor="description">Description</Label>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={generateRandomDescription}
                                                        type="button"
                                                    >
                                                        <Wand2 className="h-4 w-4 mr-2" />
                                                        Generate
                                                    </Button>
                                                </div>
                                                <Textarea
                                                    id="description"
                                                    placeholder="Describe what your agent does"
                                                    className="h-40 resize-none font-mono text-sm"
                                                    value={modelData.description}
                                                    onChange={(e) =>
                                                        setModelData({ ...modelData, description: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Agent Icon</Label>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {availableIcons.map((icon) => {
                                                        const IconComponent = icon.icon;
                                                        const isSelected = modelData.icon === icon.id;
                                                        return (
                                                            <button
                                                                key={icon.id}
                                                                className={`p-2 border rounded-lg hover:border-primary transition-colors ${isSelected ? 'border-primary bg-primary/10' : ''
                                                                    }`}
                                                                onClick={() => handleIconSelect(icon.id)}
                                                                type="button"
                                                            >
                                                                <IconComponent className="h-6 w-6" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="api" className="data-[state=active]:flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="app_id">App Type</Label>
                                                {isLoadingApps ? (
                                                    <Skeleton className="h-10 w-full" />
                                                ) : (
                                                    <select
                                                        id="app_id"
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        value={modelData.app_id}
                                                        onChange={(e) => {
                                                            const selectedApp = appOptions.find(app => app.id === parseInt(e.target.value));
                                                            setModelData({
                                                                ...modelData,
                                                                app_id: parseInt(e.target.value),
                                                                is_auth: selectedApp?.auth_required || false
                                                            });
                                                        }}
                                                        required
                                                    >
                                                        <option value="0" disabled>Select app type</option>
                                                        {appOptions.map((app) => (
                                                            <option key={app.id} value={app.id}>
                                                                {app.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {appOptions.find(app => app.id === modelData.app_id)?.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {appOptions.find(app => app.id === modelData.app_id)?.description}
                                                    </p>
                                                )}
                                            </div>

                                            {appOptions.find(app => app.id === modelData.app_id)?.fields && modelData.is_auth && (
                                                <div className="space-y-2">
                                                    <Label>Required Fields</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {appOptions.find(app => app.id === modelData.app_id)?.fields.map((field, index) => (
                                                            <Badge key={index} className="text-xs">
                                                                {field}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="is_auth">Authentication Required</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Enable if your API requires authentication
                                                    </p>
                                                </div>
                                                <Switch
                                                    id="is_auth"
                                                    checked={modelData.is_auth}
                                                    onCheckedChange={(checked) => {
                                                        setModelData({
                                                            ...modelData,
                                                            is_auth: checked,
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="code" className="data-[state=active]:flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        <div className="rounded-lg border p-4 space-y-4 bg-muted/5">
                                            <div className="space-y-2">
                                                <h4 className="font-medium">Accessible Variables</h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <code className="bg-muted px-1 py-0.5 rounded">user.id</code>
                                                        <span className="text-muted-foreground">User's ID</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <code className="bg-muted px-1 py-0.5 rounded">user.email</code>
                                                        <span className="text-muted-foreground">User's email</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {modelData.is_auth && appOptions.find(app => app.id === modelData.app_id)?.fields && (
                                                <div className="space-y-2">
                                                    <h4 className="font-medium">Connection Variables</h4>
                                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                                        {appOptions.find(app => app.id === modelData.app_id)?.fields.map((field, index) => (
                                                            <div key={index} className="flex items-center space-x-2">
                                                                <code className="bg-muted px-1 py-0.5 rounded">vars.{field}</code>
                                                                <span className="text-muted-foreground">Connection {field}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border rounded-md">
                                            <Editor
                                                height="400px"
                                                defaultLanguage="javascript"
                                                theme="vs-dark"
                                                value={modelData.code}
                                                onChange={(value) => {
                                                    setModelData({
                                                        ...modelData,
                                                        code: value || "",
                                                    });
                                                }}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    lineNumbers: "on",
                                                    scrollBeyondLastLine: false,
                                                    automaticLayout: true,
                                                    tabSize: 2,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>

                        <div className="p-6 border-t flex-shrink-0">
                            <div className="flex justify-end gap-4">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => {
                                        setShowEditDialog(false);
                                        setEditingModel(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isEditSubmitting}
                                >
                                    {isEditSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Agent'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>
        );
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
                {!isLoading && filteredModels.length > 0 && <AddModelDialog />}
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
                    </TabsList>
                </motion.div>

                <TabsContent value="models" className="space-y-4">
                    <MotionCard
                        className="p-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <motion.div
                            className="flex justify-between items-center mb-4"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Input
                                placeholder="Search models..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </motion.div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Icon</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Auth Required</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="wait">
                                    {isLoading ? (
                                        <>
                                            <ModelSkeletonCard />
                                            <ModelSkeletonCard />
                                            <ModelSkeletonCard />
                                        </>
                                    ) : filteredModels.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6}>
                                                <EmptyState />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {filteredModels.map((model) => {
                                                const IconComponent = availableIcons.find(
                                                    (i) => i.id === model.icon
                                                )?.icon;
                                                return (
                                                    <motion.tr
                                                        key={model.id}
                                                        variants={item}
                                                        initial="hidden"
                                                        animate="show"
                                                        exit="hidden"
                                                        layout
                                                        className="group hover:bg-accent/5 transition-colors"
                                                    >
                                                        <TableCell>
                                                            <Link
                                                                href={`/agents/explore-agents?id=${model.id}`}
                                                                target="_blank"
                                                                className="flex items-center"
                                                            >
                                                                <motion.div
                                                                    className="p-2 border rounded-lg w-fit"
                                                                    whileHover={{ scale: 1.1 }}
                                                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                                                >
                                                                    {IconComponent && <IconComponent className="h-6 w-6" />}
                                                                </motion.div>
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            <Link
                                                                href={`/protected/agents/explore-agents?id=${model.id}`}
                                                                target="_blank"
                                                                className="hover:underline"
                                                            >
                                                                {model.name}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link
                                                                href={`/protected/agents/explore-agents?id=${model.id}`}
                                                                target="_blank"
                                                                className="block"
                                                            >
                                                                {model.description}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link
                                                                href={`/protected/agents/explore-agents?id=${model.id}`}
                                                                target="_blank"
                                                                className="block"
                                                            >
                                                                <Switch checked={model.is_auth} disabled />
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm max-w-[200px] truncate">
                                                            <Link
                                                                href={`/protected/agents/explore-agents?id=${model.id}`}
                                                                target="_blank"
                                                                className="block"
                                                            >
                                                                {model.code}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                            <motion.div
                                                                className="flex gap-2"
                                                                initial={{ opacity: 0.8 }}
                                                                whileHover={{ opacity: 1 }}
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingModel(model);
                                                                        setShowEditDialog(true);
                                                                    }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setDeletingModelId(model.id);
                                                                        setShowDeleteDialog(true);
                                                                    }}
                                                                    disabled={isDeletingModel && deletingModelId === model.id}
                                                                >
                                                                    {isDeletingModel && deletingModelId === model.id ? (
                                                                        <>
                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                            Deleting...
                                                                        </>
                                                                    ) : (
                                                                        'Delete'
                                                                    )}
                                                                </Button>
                                                            </motion.div>
                                                        </TableCell>
                                                    </motion.tr>
                                                );
                                            })}
                                        </>
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </MotionCard>
                </TabsContent>

                <TabsContent value="connections" className="space-y-4">
                    <MotionCard
                        className="p-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <UserConnections />
                    </MotionCard>
                </TabsContent>
            </Tabs>
            {deletingModelId && <DeleteConfirmDialog modelId={deletingModelId} />}
            <EditModelDialog />
        </motion.div>
    );
}
