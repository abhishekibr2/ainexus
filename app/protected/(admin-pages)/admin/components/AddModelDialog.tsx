"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Code2, Settings, Plus, Wand2, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { getApplications, getModels, createModel } from "@/utils/supabase/actions/assistant/assistant";
import { NewModel, availableIcons, sampleDescriptions } from "./types";

interface AddModelDialogProps {
    userId: string | null;
    onModelCreated: (models: any[]) => void;
}

export function AddModelDialog({ userId, onModelCreated }: AddModelDialogProps) {
    const [newModel, setNewModel] = useState<NewModel>({
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const loadApplications = async () => {
            if (!isDialogOpen) return;
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
            newModel.app_id = null;
        }

        try {
            setIsSubmitting(true);
            await createModel(newModel, userId);

            // Refresh the models list
            const updatedModels = await getModels(userId);
            onModelCreated(updatedModels);

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

    const handleIconSelect = (iconId: string) => {
        setNewModel({ ...newModel, icon: iconId });
    };

    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
                if (isSubmitting) return;
                if (!open) resetForm();
                setIsDialogOpen(open);
            }}
        >
            <DialogTrigger asChild>
                <Button className="mb-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Agent
                </Button>
            </DialogTrigger>
            <DialogContent
                className="max-w-[1200px] p-0 flex flex-col h-[90vh]"
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

                <div className="flex-1 p-6 overflow-y-auto min-h-0">
                    <div className="grid grid-cols-12 gap-6">
                        {/* Left Column - Basic Info & API Config */}
                        <div className="col-span-5 space-y-6">
                            {/* Basic Info Section */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold">Basic Information</h2>
                                </div>
                                
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
                                            className="h-32 resize-none font-mono text-sm"
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

                            {/* API Configuration Section */}
                            <div className="space-y-6 pt-6 border-t">
                                <div className="flex items-center space-x-2">
                                    <Settings className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold">API Configuration</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/5">
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
                                                    app_id: checked ? newModel.app_id : 0,
                                                });
                                            }}
                                        />
                                    </div>

                                    {newModel.is_auth && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="app_id">App Type</Label>
                                                {isLoadingApps ? (
                                                    <Skeleton className="h-10 w-full" />
                                                ) : (
                                                    <select
                                                        id="app_id"
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        value={newModel.app_id?.toString() || ''}
                                                        onChange={(e) => {
                                                            setNewModel({
                                                                ...newModel,
                                                                app_id: parseInt(e.target.value),
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

                                            {appOptions.find(app => app.id === newModel.app_id)?.fields && (
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
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Code Section */}
                        <div className="col-span-7 space-y-6">
                            <div className="flex items-center space-x-2">
                                <Code2 className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-semibold">Code</h2>
                            </div>

                            <div className="space-y-4">
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

                                <div className="border rounded-md h-[500px]">
                                    <Editor
                                        height="100%"
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
                    </div>
                </div>

                <div className="p-6 border-t mt-auto">
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
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Agent'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 