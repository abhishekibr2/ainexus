'use client';

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface AddConnectionDialogProps {
    onAdd: (newConnection: {
        app_id: number;
        connection_name: string;
        connection_key: string;
    }) => Promise<void>;
    applications: { id: number; name: string; fields: string[] }[];
}

export function AddConnectionDialog({ onAdd, applications }: AddConnectionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [connectionName, setConnectionName] = useState("");
    const [selectedAppId, setSelectedAppId] = useState<string>("");
    const [connectionValues, setConnectionValues] = useState<{ [key: string]: string }>({});
    const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-select application if there's only one option
    useEffect(() => {
        if (applications.length === 1) {
            const app = applications[0];
            setSelectedAppId(app.id.toString());
            setConnectionName(`${app.name} Connection`);
        }
    }, [applications]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setConnectionName("");
            // Only reset selectedAppId if there are multiple applications
            if (applications.length > 1) {
                setSelectedAppId("");
            }
            setConnectionValues({});
            setShowValues({});
            setErrors({});
        }
    }, [isOpen, applications.length]);

    const selectedApp = applications.find(app => app.id.toString() === selectedAppId);

    // Set default connection name when app is selected
    useEffect(() => {
        if (selectedApp && !connectionName) {
            setConnectionName(`${selectedApp.name} Connection`);
        }
    }, [selectedApp, connectionName]);

    const validateForm = () => {
        const newErrors: { [key: string]: boolean } = {};
        let isValid = true;

        // Validate application selection
        if (!selectedAppId) {
            isValid = false;
            toast({
                title: "Error",
                description: "Please select an application",
                variant: "destructive",
            });
            return false;
        }

        // Validate connection name
        if (!connectionName.trim()) {
            newErrors.connectionName = true;
            isValid = false;
        }

        // Validate all fields are filled
        if (selectedApp?.fields) {
            selectedApp.fields.forEach(field => {
                if (!connectionValues[field]?.trim()) {
                    newErrors[field] = true;
                    isValid = false;
                }
            });
        }

        setErrors(newErrors);

        if (!isValid) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
        }

        return isValid;
    };

    const handleAdd = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            // Convert the values to PostgreSQL array format
            const connectionKeyArray = Object.entries(connectionValues)
                .filter(([_, value]) => value !== undefined && value !== null)
                .map(([key, value]) => `${key}=${value}`)
                .map(str => `"${str}"`); // Wrap each element in quotes

            const connectionKeyString = `{${connectionKeyArray.join(',')}}`;  // PostgreSQL array format

            await onAdd({
                app_id: parseInt(selectedAppId),
                connection_name: connectionName.trim(),
                connection_key: connectionKeyString,
            });

            // Reset form and close dialog only on success
            setIsOpen(false);
        } catch (error) {
            console.error('Error adding connection:', error);
            toast({
                title: "Error",
                description: "Failed to add connection. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleValueVisibility = (field: string) => {
        setShowValues(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button>Add New Connection</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Add New Connection</AlertDialogTitle>
                    <AlertDialogDescription>
                        Create a new connection for your AI agent
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="app" className="required">Application</Label>
                        <Select 
                            value={selectedAppId} 
                            onValueChange={(value) => {
                                setSelectedAppId(value);
                                const app = applications.find(app => app.id.toString() === value);
                                if (app) {
                                    setConnectionName(`${app.name} Connection`);
                                }
                                setConnectionValues({});
                                setShowValues({});
                                setErrors({});
                            }}
                            disabled={applications.length === 1}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an application" />
                            </SelectTrigger>
                            <SelectContent>
                                {applications.map((app) => (
                                    <SelectItem key={app.id} value={app.id.toString()}>
                                        {app.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="connection_name" className="required">Connection Name</Label>
                        <Input
                            id="connection_name"
                            value={connectionName}
                            onChange={(e) => {
                                setConnectionName(e.target.value);
                                setErrors(prev => ({ ...prev, connectionName: false }));
                            }}
                            placeholder={selectedApp ? `${selectedApp.name} Connection` : "Enter a name for this connection"}
                            className={errors.connectionName ? "border-red-500" : ""}
                        />
                    </div>
                    {selectedApp && selectedApp.fields && (
                        <div className="grid gap-4">
                            <Label>Connection Values</Label>
                            {selectedApp.fields.map((field) => (
                                <div key={field} className="grid gap-2">
                                    <Label className="required">{field}</Label>
                                    <div className="relative">
                                        <Input
                                            type={showValues[field] ? "text" : "password"}
                                            placeholder={`Enter ${field}`}
                                            value={connectionValues[field] || ''}
                                            onChange={(e) => {
                                                setConnectionValues(prev => ({
                                                    ...prev,
                                                    [field]: e.target.value || ''
                                                }));
                                                setErrors(prev => ({ ...prev, [field]: false }));
                                            }}
                                            className={errors[field] ? "border-red-500" : ""}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 p-0"
                                            onClick={() => toggleValueVisibility(field)}
                                        >
                                            {showValues[field] ? (
                                                <EyeOffIcon className="h-3 w-3" />
                                            ) : (
                                                <EyeIcon className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <style jsx global>{`
                    .required:after {
                        content: " *";
                        color: red;
                    }
                `}</style>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleAdd}
                        disabled={isSubmitting || !selectedAppId}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Connection'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 