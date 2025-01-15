'use client';

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
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Connection } from "@/utils/supabase/actions/user/connections";
import { useToast } from "@/hooks/use-toast";
import { ConnectionKeysInput } from "./ConnectionKeysInput";

interface EditConnectionDialogProps {
    connection: Connection;
    onSave: (updatedConnection: Partial<Connection>) => Promise<void>;
}

export function EditConnectionDialog({ connection, onSave }: EditConnectionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [connectionName, setConnectionName] = useState(connection.connection_name || '');
    const [connectionKeys, setConnectionKeys] = useState(connection.parsedConnectionKeys || []);
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Reset form when connection changes
    useEffect(() => {
        setConnectionName(connection.connection_name || '');
        setConnectionKeys(connection.parsedConnectionKeys || []);
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

        // Validate connection keys
        connectionKeys.forEach((keyPair, index) => {
            if (!keyPair.key.trim()) {
                newErrors[`key-${index}`] = true;
                isValid = false;
            }
            if (!keyPair.value.trim()) {
                newErrors[`value-${index}`] = true;
                isValid = false;
            }
        });

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
            // Convert the connection keys to PostgreSQL array format
            const connectionKeyArray = connectionKeys
                .map(({ key, value }) => `${key}=${value}`)
                .map(str => `"${str}"`); // Wrap each element in quotes
            
            const connectionKeyString = `{${connectionKeyArray.join(',')}}`;  // PostgreSQL array format

            await onSave({
                connection_name: connectionName.trim(),
                connection_key: connectionKeyString,
            });
            
            // Close dialog only on success
            setIsOpen(false);
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Connection</DialogTitle>
                    <DialogDescription>
                        Update the connection values for {connection.application?.name}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
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
                    <ConnectionKeysInput
                        connectionKeys={connectionKeys}
                        onChange={setConnectionKeys}
                        errors={errors}
                    />
                </div>
                <style jsx global>{`
                    .required:after {
                        content: " *";
                        color: red;
                    }
                `}</style>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 