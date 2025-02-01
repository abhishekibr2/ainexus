export interface Model {
    id: number;
    name: string;
    description?: string;
    icon: string;
    instruction?: string;
    created_at: string;
    is_public: boolean;
    is_auth: boolean;
    override_config: any;
    user_connection_id: string;
    created_by: {
        name: string;
    };
    app_id: number;
    permission?: {
        type: 'global' | 'restricted';
        restricted_to?: ('user' | 'workspace')[];
        restricted_users?: string[];
        restricted_workspaces?: number[];
    };
    chatflow_id: string;
    fields: string[];
    o_auth: boolean;
    provider?: string;
}