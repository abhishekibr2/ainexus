'use client';

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Code2, Check } from "lucide-react";

interface Model {
    id: number;
    name: string;
    is_auth: boolean;
    fields?: string[];
}

interface AccessibleVariablesDialogProps {
    model: Model;
    user: User | null;
    connectionKeys: any;
}

export function AccessibleVariablesDialog({
    model,
    user,
    connectionKeys
}: AccessibleVariablesDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Code2 className="h-4 w-4 mr-2" />
                    Variables
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Accessible Variables</AlertDialogTitle>
                    <AlertDialogDescription>
                        Available variables for this agent
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">User Variables</h4>
                            <div className="gap-2 text-sm">
                                <div className="flex items-center space-x-2">
                                    <code className="bg-muted px-1 py-0.5 rounded">user.id</code>
                                    <span className="text-muted-foreground">{user?.id}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <code className="bg-muted px-1 py-0.5 rounded">user.email</code>
                                    <span className="text-muted-foreground">{user?.email}</span>
                                </div>
                            </div>
                        </div>
                        {model.is_auth && model.fields && model.fields.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Connection Variables</h4>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    {model.fields.map((field, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <code className="bg-muted px-1 py-0.5 rounded">vars.{field}</code>
                                            <span className="text-muted-foreground">{connectionKeys?.[field]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setOpen(false)}>Close</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 