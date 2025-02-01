
export interface ConnectionKey {
    key: string;
    value: string;
}

export interface Connection {
    id: number;
    user_id: string;
    app_id: number;
    connection_name: string;
    connection_key: string[];
    parsedConnectionKeys?: ConnectionKey[];
}