"use client";
import { ConnectionKeyPair } from "@/utils/supabase/actions/user/connections";
import { formatConnectionKeysForDisplay, parseStoredConnectionKeys } from "./utils/connection-utils";

interface ConnectionKeysDisplayProps {
    connectionKeys: string | ConnectionKeyPair[];
}

export function ConnectionKeysDisplay({ connectionKeys }: ConnectionKeysDisplayProps) {
    let parsedKeys: ConnectionKeyPair[];
    
    if (typeof connectionKeys === 'string') {
        parsedKeys = parseStoredConnectionKeys(connectionKeys);
    } else {
        parsedKeys = connectionKeys;
    }

    const formattedKeys = formatConnectionKeysForDisplay(parsedKeys);

    return (
        <div className="font-mono text-sm whitespace-pre-wrap break-all">
            {formattedKeys}
        </div>
    );
} 