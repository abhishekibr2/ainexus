"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { searchWorkspaces, getWorkspaces, Workspace } from "@/utils/supabase/actions/workspace/workspace-search";
import { useDebounce } from "@/hooks/use-debounce";

interface WorkspaceSearchProps {
    selectedWorkspaceIds: number[];
    onWorkspaceSelect: (workspaces: number[]) => void;
}

export function WorkspaceSearch({ selectedWorkspaceIds, onWorkspaceSelect }: WorkspaceSearchProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Workspace[]>([]);
    const [selectedWorkspaces, setSelectedWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        const loadSelectedWorkspaces = async () => {
            if (selectedWorkspaceIds.length > 0) {
                const workspaces = await getWorkspaces(selectedWorkspaceIds);
                setSelectedWorkspaces(workspaces);
            }
        };
        loadSelectedWorkspaces();
    }, [selectedWorkspaceIds]);

    useEffect(() => {
        const performSearch = async () => {
            if (debouncedSearch.trim()) {
                setIsLoading(true);
                try {
                    const results = await searchWorkspaces(debouncedSearch);
                    // Filter out already selected workspaces
                    const filteredResults = results.filter(
                        workspace => !selectedWorkspaceIds.includes(workspace.id)
                    );
                    setSearchResults(filteredResults);
                } catch (error) {
                    console.error('Error searching workspaces:', error);
                    setSearchResults([]);
                }
                setIsLoading(false);
            } else {
                setSearchResults([]);
            }
        };

        performSearch();
    }, [debouncedSearch, selectedWorkspaceIds]);

    const handleWorkspaceSelect = (workspace: Workspace) => {
        const newSelectedWorkspaces = [...selectedWorkspaces, workspace];
        setSelectedWorkspaces(newSelectedWorkspaces);
        onWorkspaceSelect(newSelectedWorkspaces.map(w => w.id));
        setSearchResults(searchResults.filter(w => w.id !== workspace.id));
    };

    const handleWorkspaceRemove = (workspaceId: number) => {
        const newSelectedWorkspaces = selectedWorkspaces.filter(w => w.id !== workspaceId);
        setSelectedWorkspaces(newSelectedWorkspaces);
        onWorkspaceSelect(newSelectedWorkspaces.map(w => w.id));
    };

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-medium">Search Workspaces</Label>
                <Input
                    type="text"
                    placeholder="Search by workspace name or owner email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1.5"
                />
            </div>

            {/* Search Results */}
            {searchQuery.trim() && searchResults.length > 0 && (
                <div className="border rounded-md mt-2">
                    <ul className="divide-y">
                        {searchResults.map((workspace) => (
                            <li
                                key={workspace.id}
                                className="p-2 cursor-pointer"
                                onClick={() => handleWorkspaceSelect(workspace)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{workspace.name}</div>
                                        {workspace.description && (
                                            <div className="text-sm text-muted-foreground">
                                                {workspace.owner_email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Selected Workspaces */}
            {selectedWorkspaces.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedWorkspaces.map((workspace) => (
                        <Badge
                            key={workspace.id}
                            variant="outline"
                            className="flex items-center gap-1"
                        >
                            {workspace.name}
                            {workspace.description && (
                                <span className="text-xs ml-1">
                                    ({workspace.description})
                                </span>
                            )}
                            <button
                                onClick={() => handleWorkspaceRemove(workspace.id)}
                                className="ml-1 rounded-full p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {isLoading && (
                <div className="text-sm text-muted-foreground">
                    Searching...
                </div>
            )}
        </div>
    );
} 