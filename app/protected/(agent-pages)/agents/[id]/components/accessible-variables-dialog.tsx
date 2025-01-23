'use client';

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    }, [user])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Code2 className="h-4 w-4 mr-2" />
                    Variables
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle>Accessible Variables</DialogTitle>
                    <DialogDescription>
                        Available variables for this agent
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">User Variables</h4>
                            <div className="grid gap-2">
                                <VariableItem label="user.id" value={user?.id} />
                                <VariableItem label="user.email" value={user?.email} />
                                <VariableItem label="timezone" value={timezone} />
                                <VariableItem label="name" value={user?.user_metadata?.name} />
                                <VariableItem label="model.chatflow_id" value={model.chatflow_id} />
                                <VariableItem 
                                    label="model.override_config" 
                                    value={model.override_config ? JSON.stringify(model.override_config, null, 2) : ''} 
                                    isCode 
                                />
                                <VariableItem 
                                    label="instruction" 
                                    value={instruction} 
                                    isMultiline 
                                />
                            </div>
                        </div>

                        {(model.is_auth || model.o_auth) && model.fields && model.fields.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Connection Variables</h4>
                                <div className="grid gap-2">
                                    {model.fields.map((field, index) => (
                                        <VariableItem 
                                            key={index}
                                            label={`vars.${field}`}
                                            value={connectionKeys?.[field]}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {model.o_auth && connectionKeys?.sheet_id && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Google Sheet Variables</h4>
                                <div className="grid gap-2">
                                    <VariableItem 
                                        label="vars.sheet_id"
                                        value={connectionKeys.sheet_id}
                                    />
                                    <VariableItem 
                                        label="vars.sheet_tab"
                                        value={connectionKeys.sheet_tab}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button 
                        onClick={() => setOpen(false)}
                        className="w-full sm:w-auto"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface VariableItemProps {
    label: string;
    value: string | undefined | null;
    isCode?: boolean;
    isMultiline?: boolean;
}

function VariableItem({ label, value, isCode, isMultiline }: VariableItemProps) {
    if (!value) return null;
    
    return (
        <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex flex-col gap-2">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded-md w-fit">
                    {label}
                </code>
                <div className={`text-sm ${isMultiline ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
                    {isCode ? (
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                            {value}
                        </pre>
                    ) : (
                        <span className="">{value}</span>
                    )}
                </div>
            </div>
        </div>
    );
}