import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, PlusCircle } from "lucide-react";
import { createApplication } from "@/utils/supabase/actions/application";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AddApplicationDialogProps {
    onApplicationAdded: () => void;
}

export function AddApplicationDialog({ onApplicationAdded }: AddApplicationDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        logo: "",
        auth_required: false,
        fields: "",
        o_auth: false,
        provider: "google",
    });

    const getProviderFields = (provider: string) => {
        switch (provider) {
            case "google":
                return ["refreshToken", "accessToken", "email", "profile"];
            default:
                return ["refreshToken", "accessToken"];
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const fields = formData.o_auth 
                ? getProviderFields(formData.provider)
                : formData.fields.split(',').map(field => field.trim()).filter(Boolean);

            await createApplication({
                name: formData.name,
                description: formData.description.trim() || null,
                logo: formData.logo.trim() || null,
                auth_required: formData.auth_required,
                fields: fields,
                o_auth: formData.auth_required ? formData.o_auth : false,
                provider: (formData.auth_required && formData.o_auth) ? formData.provider : null,
            });

            toast({
                title: "Success",
                description: "Application created successfully!",
            });

            setOpen(false);
            onApplicationAdded();
            setFormData({
                name: "",
                description: "",
                logo: "",
                auth_required: false,
                fields: "",
                o_auth: false,
                provider: "google",
            });
        } catch (error) {
            console.error('Error creating application:', error);
            toast({
                title: "Error",
                description: "Failed to create application. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Application
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Create Application</DialogTitle>
                        <DialogDescription className="text-base pt-2.5">
                            Add a new application to your platform. Fill in the details below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Application Name</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>The name of your application as it will appear in the system.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter application name"
                                className="h-11"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>A brief description of what your application does.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your application"
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="logo" className="text-sm font-semibold">Logo URL</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>A URL pointing to your application's logo image.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Input
                                id="logo"
                                value={formData.logo}
                                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                placeholder="https://example.com/logo.png"
                                className="h-11"
                            />
                        </div>
                        {!formData.o_auth && (
                            <div className="grid gap-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="fields" className="text-sm font-semibold">Required Fields</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Comma-separated list of fields required for this application (e.g., api_key, secret_key).</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Input
                                    id="fields"
                                    value={formData.fields}
                                    onChange={(e) => setFormData({ ...formData, fields: e.target.value })}
                                    placeholder="api_key, secret_key, etc."
                                    className="h-11"
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="auth_required" className="text-sm font-semibold">Authentication Required</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Toggle if this application requires user authentication.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Switch
                                id="auth_required"
                                checked={formData.auth_required}
                                onCheckedChange={(checked) => {
                                    // Reset OAuth settings when auth is disabled
                                    if (!checked) {
                                        setFormData({
                                            ...formData,
                                            auth_required: checked,
                                            o_auth: false,
                                            provider: "google"
                                        });
                                    } else {
                                        setFormData({
                                            ...formData,
                                            auth_required: checked
                                        });
                                    }
                                }}
                            />
                        </div>
                        {formData.auth_required && (
                            <div className="flex items-center justify-between pb-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="o_auth" className="text-sm font-semibold">OAuth</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Toggle if this application uses OAuth.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Switch
                                    id="o_auth"
                                    checked={formData.o_auth}
                                    onCheckedChange={(checked) => setFormData({ ...formData, o_auth: checked })}
                                />
                            </div>
                        )}
                    </div>
                    {formData.o_auth && (
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="provider" className="text-sm font-semibold">OAuth Provider</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Select the OAuth provider for this application.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Select
                                value={formData.provider}
                                onValueChange={(value) => setFormData({ ...formData, provider: value })}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="google">Google</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="mt-4">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-semibold">Required OAuth Fields</Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>These fields will be automatically collected during OAuth.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="mt-2 space-y-2">
                                    {getProviderFields(formData.provider).map((field) => (
                                        <div key={field} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>•</span>
                                            <span>{field}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-11"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "h-11 px-8",
                                isLoading && "opacity-80"
                            )}
                        >
                            {isLoading ? "Creating..." : "Create Application"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 