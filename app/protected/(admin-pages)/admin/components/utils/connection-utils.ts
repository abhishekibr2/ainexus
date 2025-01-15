import { ConnectionKeyPair } from "@/utils/supabase/actions/user/connections";

export function formatConnectionKeys(connectionKeys: ConnectionKeyPair[] | undefined): string {
    if (!connectionKeys || connectionKeys.length === 0) return '';

    // Format each key-value pair and join them with newlines
    return connectionKeys
        .map(pair => `${pair.key}=${pair.value}`)
        .join('\n');
}

export function parseConnectionKeys(input: string): string[] {
    // If input is a string array representation (e.g., "["key1=value1", "key2=value2"]")
    if (input.trim().startsWith('[') && input.trim().endsWith(']')) {
        try {
            // Parse the string array and clean it up
            const arrayContent = input.slice(1, -1).trim();
            if (!arrayContent) return [];

            return arrayContent
                .split(',')
                .map(item => item.trim().replace(/^"|"$/g, '')) // Remove quotes
                .filter(item => item.length > 0);
        } catch (error) {
            console.error('Error parsing array format:', error);
            return [];
        }
    }

    // Otherwise, treat as newline-separated format
    return input
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

export function validateConnectionKeys(keys: string[]): boolean {
    // Check if each line follows the format "key=value"
    return keys.every(key => {
        const parts = key.split('=');
        return parts.length === 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0;
    });
}

export function formatConnectionKeysForDisplay(connectionKeys: ConnectionKeyPair[] | undefined): string {
    if (!connectionKeys || connectionKeys.length === 0) return 'No connection keys';

    return connectionKeys
        .map(pair => `${pair.key}=${pair.value}`)
        .join('\n');
}

export function formatConnectionKeysForStorage(keys: string[]): string {
    // Format as a text array representation
    return JSON.stringify(keys);
}

export function parseStoredConnectionKeys(storedValue: string | null): ConnectionKeyPair[] {
    if (!storedValue) return [];

    try {
        // If it's already an array of strings
        if (Array.isArray(storedValue)) {
            return storedValue
                .map(item => {
                    const [key, value] = item.split('=').map((s: string) => s.trim());
                    return { key, value };
                })
                .filter(pair => pair.key && pair.value);
        }

        // If it's a string representation of an array
        if (storedValue.trim().startsWith('[') && storedValue.trim().endsWith(']')) {
            const parsed = JSON.parse(storedValue);
            return parsed
                .map((item: string) => {
                    const [key, value] = item.split('=').map(s => s.trim());
                    return { key, value };
                })
                .filter((pair: ConnectionKeyPair) => pair.key && pair.value);
        }

        // If it's a single key=value pair
        if (storedValue.includes('=')) {
            const [key, value] = storedValue.split('=').map(s => s.trim());
            if (key && value) {
                return [{ key, value }];
            }
        }

        return [];
    } catch (error) {
        console.error('Error parsing stored connection keys:', error);
        return [];
    }
} 