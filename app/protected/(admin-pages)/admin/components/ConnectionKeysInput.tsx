"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { ConnectionKeyPair } from "@/utils/supabase/actions/user/connections";

interface ConnectionKeysInputProps {
    connectionKeys: ConnectionKeyPair[];
    onChange: (keys: ConnectionKeyPair[]) => void;
    errors?: { [key: string]: boolean };
}

export function ConnectionKeysInput({ connectionKeys, onChange, errors = {} }: ConnectionKeysInputProps) {
    const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});

    const updateKey = (index: number, field: 'key' | 'value', value: string) => {
        const newKeys = [...connectionKeys];
        newKeys[index] = { ...newKeys[index], [field]: value };
        onChange(newKeys);
    };

    const toggleValueVisibility = (index: number) => {
        setShowValues(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <div className="space-y-4">
            <Label>Connection Keys</Label>
            <div className="space-y-4">
                {connectionKeys.map((keyPair, index) => (
                    <div key={index} className="grid grid-cols-[1fr,1fr] gap-4">
                        <div>
                            <Input
                                placeholder="Key name"
                                value={keyPair.key}
                                disabled // Disable key editing to preserve structure
                                className="bg-muted"
                            />
                        </div>
                        <div className="relative">
                            <Input
                                type={showValues[index] ? "text" : "password"}
                                placeholder="Value"
                                value={keyPair.value}
                                onChange={(e) => updateKey(index, 'value', e.target.value)}
                                className={errors[`value-${index}`] ? "border-red-500" : ""}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 p-0"
                                onClick={() => toggleValueVisibility(index)}
                            >
                                {showValues[index] ? (
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
    );
} 