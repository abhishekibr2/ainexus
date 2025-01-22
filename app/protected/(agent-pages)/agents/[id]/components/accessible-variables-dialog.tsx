'use client';

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Code2, Check } from "lucide-react";
import { getUserTimezone } from "@/utils/supabase/actions/user/onboarding";

interface Model {
    id: number;
    name: string;
    is_auth: boolean;
    override_config?: string;
    chatflow_id: string;
    fields?: string[];
    o_auth: boolean;
}

interface AccessibleVariablesDialogProps {
    model: Model;
    user: User | null;
    connectionKeys: any;
    instruction: string;
}

export function AccessibleVariablesDialog({
    model,
    user,
    instruction,
    connectionKeys
}: AccessibleVariablesDialogProps) {
    const [open, setOpen] = useState(false);
    const [timezone, setTimezone] = useState<string | null>(null);

    useEffect(() => {
        const fetchTimezone = async () => {
            const timezone = await getUserTimezone(user?.id ?? '')
            setTimezone(timezone)
        }
        fetchTimezone()
        console.log(model)
    }, [user])

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Code2 className="h-4 w-4 mr-2" />
                    Variables
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[600px] max-h-[85vh] grid grid-rows-[auto,1fr,auto]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl">Accessible Variables</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                        Available variables for this agent
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="overflow-y-auto pr-2 my-4">
                    <div className="rounded-lg border bg-card p-4 space-y-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg">User Variables</h4>
                            <div className="grid gap-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm">user.id</code>
                                    <span className="text-muted-foreground truncate">{user?.id}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm">user.email</code>
                                    <span className="text-muted-foreground truncate">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm">timezone</code>
                                    <span className="text-muted-foreground truncate">{timezone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm">name</code>
                                    <span className="text-muted-foreground truncate">{user?.user_metadata?.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm">model.chatflow_id</code>
                                    <span className="text-muted-foreground truncate">{model.chatflow_id}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm">model.override_config</code>
                                    <span className="text-muted-foreground break-all text-xs">
                                        {model.override_config
                                            ? JSON.stringify(model.override_config, null, 2)
                                            : ''}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm">instruction</code>
                                    <span className="text-muted-foreground break-words">{instruction}</span>
                                </div>
                            </div>
                        </div>
                        {(model.is_auth || model.o_auth) && model.fields && model.fields.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg">Connection Variables</h4>
                                <div className="grid gap-3 text-sm">
                                    {model.fields.map((field, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <code className="bg-muted px-2 py-1 rounded-md font-mono text-sm">vars.{field}</code>
                                            <span className="text-muted-foreground truncate">{connectionKeys?.[field]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction 
                        onClick={() => setOpen(false)}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Close
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 