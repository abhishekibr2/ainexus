"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { searchUsers, getUsers, User } from "@/utils/supabase/actions/user/users";
import { useDebounce } from "@/hooks/use-debounce";

interface UserSearchProps {
    selectedUserIds: string[];
    onUserSelect: (users: string[]) => void;
}

export function UserSearch({ selectedUserIds, onUserSelect }: UserSearchProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        const loadSelectedUsers = async () => {
            if (selectedUserIds.length > 0) {
                const users = await getUsers(selectedUserIds);
                setSelectedUsers(users);
            }
        };
        loadSelectedUsers();
    }, [selectedUserIds]);

    useEffect(() => {
        const performSearch = async () => {
            if (debouncedSearch.trim()) {
                setIsLoading(true);
                try {
                    const results = await searchUsers(debouncedSearch);
                    // Filter out already selected users
                    const filteredResults = results.filter(
                        user => !selectedUserIds.includes(user.id)
                    );
                    setSearchResults(filteredResults);
                } catch (error) {
                    console.error('Error searching users:', error);
                    setSearchResults([]);
                }
                setIsLoading(false);
            } else {
                setSearchResults([]);
            }
        };

        performSearch();
    }, [debouncedSearch, selectedUserIds]);

    const handleUserSelect = (user: User) => {
        const newSelectedUsers = [...selectedUsers, user];
        setSelectedUsers(newSelectedUsers);
        onUserSelect(newSelectedUsers.map(u => u.id));
        setSearchResults(searchResults.filter(u => u.id !== user.id));
    };

    const handleUserRemove = (userId: string) => {
        const newSelectedUsers = selectedUsers.filter(u => u.id !== userId);
        setSelectedUsers(newSelectedUsers);
        onUserSelect(newSelectedUsers.map(u => u.id));
    };

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-medium">Search Users</Label>
                <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1.5"
                />
            </div>

            {/* Search Results */}
            {searchQuery.trim() && searchResults.length > 0 && (
                <div className="border rounded-md mt-2">
                    <ul className="divide-y">
                        {searchResults.map((user) => (
                            <li
                                key={user.id}
                                className="p-2 cursor-pointer"
                                onClick={() => handleUserSelect(user)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{user.email}</div>
                                        {user.name && (
                                            <div className="text-sm">{user.name}</div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUsers.map((user) => (
                        <Badge
                            key={user.id}
                            variant="outline"
                            className="flex items-center gap-1"
                        >
                            {user.email}
                            {user.name && (
                                <span className="text-xs ml-1">
                                    ({user.name})
                                </span>
                            )}
                            <button
                                onClick={() => handleUserRemove(user.id)}
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