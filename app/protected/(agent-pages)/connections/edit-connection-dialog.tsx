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
import { Connection } from "@/utils/supabase/actions/user/connections";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditConnectionDialogProps {
    connection: Connection;
    onSave: (updatedConnection: Partial<Connection>) => Promise<void>;
}

export function EditConnectionDialog({ connection, onSave }: EditConnectionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [connectionKeys, setConnectionKeys] = useState<{ key: string; value: string }[]>(
        connection.parsedConnectionKeys || []
    );

    const handleSave = async () => {
        // Create an object with the original keys and updated values
        const updatedKeyValuePairs = connectionKeys.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        await onSave({
            connection_key: JSON.stringify(updatedKeyValuePairs),
        });
        setIsOpen(false);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Edit
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Edit Connection</AlertDialogTitle>
                    <AlertDialogDescription>
                        Update the connection values for {connection.application?.name}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    {connectionKeys.map((keyPair, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`key-${index}`}>Key</Label>
                                <Input
                                    id={`key-${index}`}
                                    value={keyPair.key}
                                    readOnly
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`value-${index}`}>Value</Label>
                                <Input
                                    id={`value-${index}`}
                                    value={keyPair.value}
                                    onChange={(e) => {
                                        const newKeys = [...connectionKeys];
                                        newKeys[index].value = e.target.value;
                                        setConnectionKeys(newKeys);
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave}>Save changes</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 