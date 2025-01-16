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
import { Connection } from "@/utils/supabase/actions/user/connections";
import { toast } from "@/hooks/use-toast";

interface EditConnectionDialogProps {
    connection: Connection;
    onSave: (updatedConnection: Partial<Connection>) => Promise<void>;
}

export function EditConnectionDialog({ connection, onSave }: EditConnectionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [connectionName, setConnectionName] = useState(connection.connection_name || '');
    const [connectionValues, setConnectionValues] = useState<{ [key: string]: string }>(
        Object.fromEntries(
            (connection.parsedConnectionKeys || [])
                .map(({ key, value }) => [key, value || ''])
        )
    );
    const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when connection changes
    useEffect(() => {
        setConnectionName(connection.connection_name || '');
        setConnectionValues(
            Object.fromEntries(
                (connection.parsedConnectionKeys || [])
                    .map(({ key, value }) => [key, value || ''])
            )
        );
        setErrors({});
    }, [connection]);

    const validateForm = () => {
        const newErrors: { [key: string]: boolean } = {};
        let isValid = true;

        // Validate connection name
        if (!connectionName.trim()) {
            newErrors.connectionName = true;
            isValid = false;
        }

        // Validate all fields are filled
        if (connection.parsedConnectionKeys) {
            connection.parsedConnectionKeys.forEach(({ key }) => {
                if (!connectionValues[key]?.trim()) {
                    newErrors[key] = true;
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

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            // Convert the values to PostgreSQL array format
            const connectionKeyArray = Object.entries(connectionValues)
                .filter(([_, value]) => value !== undefined && value !== null)
                .map(([key, value]) => `${key}=${value}`)
                .map(str => `"${str}"`); // Wrap each element in quotes
            
            const connectionKeyString = `{${connectionKeyArray.join(',')}}`;  // PostgreSQL array format

            const updatedConnection = {
                connection_name: connectionName.trim(),
                connection_key: connectionKeyString,
                parsedConnectionKeys: Object.entries(connectionValues).map(([key, value]) => ({
                    key,
                    value
                }))
            };

            await onSave(updatedConnection);
            
            // Close dialog only on success
            setIsOpen(false);
            
            // Reset form state
            setConnectionName(connection.connection_name || '');
            setConnectionValues(
                Object.fromEntries(
                    (connection.parsedConnectionKeys || [])
                        .map(({ key, value }) => [key, value || ''])
                )
            );
        } catch (error) {
            console.error('Error updating connection:', error);
            toast({
                title: "Error",
                description: "Failed to update connection. Please try again.",
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
                <Button variant="outline" size="sm">
                    Edit
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Connection</AlertDialogTitle>
                    <AlertDialogDescription>
                        Update the connection values for {connection.application?.name}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="connection_name" className="required">Connection Name</Label>
                        <Input
                            id="connection_name"
                            value={connectionName}
                            onChange={(e) => {
                                setConnectionName(e.target.value);
                                setErrors(prev => ({ ...prev, connectionName: false }));
                            }}
                            placeholder="Enter a name for this connection"
                            className={errors.connectionName ? "border-red-500" : ""}
                        />
                    </div>
                    <div className="grid gap-4">
                        <Label>Connection Values</Label>
                        {connection.parsedConnectionKeys?.map(({ key }) => (
                            <div key={key} className="grid gap-2">
                                <Label className="required">{key}</Label>
                                <div className="relative">
                                    <Input
                                        type={showValues[key] ? "text" : "password"}
                                        placeholder={`Enter ${key}`}
                                        value={connectionValues[key] || ''}
                                        onChange={(e) => {
                                            setConnectionValues(prev => ({
                                                ...prev,
                                                [key]: e.target.value
                                            }));
                                            setErrors(prev => ({ ...prev, [key]: false }));
                                        }}
                                        className={errors[key] ? "border-red-500" : ""}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 p-0"
                                        onClick={() => toggleValueVisibility(key)}
                                    >
                                        {showValues[key] ? (
                                            <EyeOffIcon className="h-3 w-3" />
                                        ) : (
                                            <EyeIcon className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
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
                        onClick={handleSave} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save changes'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 