import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { updateUserConnection } from "@/utils/supabase/actions/user/connections";
import { useToast } from "@/hooks/use-toast";

interface SheetTab {
    title: string;
    index: number;
}

interface SheetSettingsDialogProps {
    modelId: number;
    sheets: { id: string; name: string }[];
    selectedSheetId?: string;
    selectedTab?: string;
    accessToken?: string;
    onSheetChange: (sheetId: string) => void;
    onTabChange: (tab: string) => void;
    connectionId?: number;
}

async function fetchSheetTabs(sheetId: string, accessToken: string): Promise<SheetTab[]> {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch sheet tabs');
        }

        const data = await response.json();
        return data.sheets.map((sheet: any) => ({
            title: sheet.properties.title,
            index: sheet.properties.index
        }));
    } catch (error) {
        console.error('Error fetching sheet tabs:', error);
        return [];
    }
}

export function SheetSettingsDialog({
    modelId,
    sheets,
    selectedSheetId,
    selectedTab,
    accessToken,
    onSheetChange,
    onTabChange,
    connectionId
}: SheetSettingsDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [sheetTabs, setSheetTabs] = useState<SheetTab[]>([]);
    const [isLoadingTabs, setIsLoadingTabs] = useState(false);
    const [currentSheetId, setCurrentSheetId] = useState<string | undefined>(selectedSheetId);
    const [currentTab, setCurrentTab] = useState<string | undefined>(selectedTab);
    const [isSaving, setIsSaving] = useState(false);


    // Update current values when props change
    useEffect(() => {
        setCurrentSheetId(selectedSheetId);
        setCurrentTab(selectedTab);
    }, [selectedSheetId, selectedTab]);

    useEffect(() => {
        if (currentSheetId && accessToken && open) {
            setIsLoadingTabs(true);
            fetchSheetTabs(currentSheetId, accessToken)
                .then(tabs => {
                    setSheetTabs(tabs);
                    // Only set default tab if no tab is selected AND there are tabs available
                    if (!currentTab && tabs.length > 0) {
                        const firstTab = tabs[0].title;
                        setCurrentTab(firstTab);
                    }
                })
                .finally(() => {
                    setIsLoadingTabs(false);
                });
        }
    }, [currentSheetId, accessToken, open, currentTab]);

    const handleSheetChange = (sheetId: string) => {
        setCurrentSheetId(sheetId);
        // Reset tab when changing sheets
        setCurrentTab(undefined);
        setSheetTabs([]);
    };

    const handleTabChange = (tab: string) => {
        setCurrentTab(tab);
    };

    const handleSave = async () => {
        if (!connectionId || !currentSheetId || !currentTab) {
            return;
        }
        setIsSaving(true);

        try {
            const selectedSheet = sheets.find(s => s.id === currentSheetId);
            if (!selectedSheet) {
                console.error('Selected sheet not found:', currentSheetId);
                throw new Error('Selected sheet not found');
            }

            // Update both sheet ID and tab in one call
            const { error } = await updateUserConnection(
                connectionId,
                undefined,
                undefined,
                currentSheetId,
                selectedSheet.name,
                currentTab
            );
            
            if (error) throw error;
            
            // Notify parent components
            onSheetChange(currentSheetId);
            onTabChange(currentTab);
            
            toast({
                title: "Success",
                description: "Sheet settings updated successfully",
            });
            setOpen(false);
        } catch (error) {
            console.error('Error updating sheet settings:', error);
            toast({
                title: "Error",
                description: "Failed to update sheet settings",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Manage Sheet Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sheet Settings</DialogTitle>
                    <DialogDescription>
                        Configure your Google Sheet settings
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="sheet">Google Sheet</Label>
                        <Select
                            defaultValue={selectedSheetId}
                            value={currentSheetId}
                            onValueChange={handleSheetChange}
                        >
                            <SelectTrigger id="sheet">
                                <SelectValue>
                                    {sheets.find(s => s.id === currentSheetId)?.name || "Select a sheet"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {sheets.map((sheet) => (
                                    <SelectItem key={sheet.id} value={sheet.id}>
                                        {sheet.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {currentSheetId && (
                        <div className="grid gap-2">
                            <Label htmlFor="tab">Sheet Tab</Label>
                            <Select
                                defaultValue={selectedTab}
                                value={currentTab}
                                onValueChange={handleTabChange}
                                disabled={isLoadingTabs}
                            >
                                <SelectTrigger id="tab">
                                    {isLoadingTabs ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Loading tabs...</span>
                                        </div>
                                    ) : (
                                        <SelectValue>
                                            {currentTab || "Select a tab"}
                                        </SelectValue>
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    {sheetTabs.map((tab) => (
                                        <SelectItem key={tab.index} value={tab.title}>
                                            {tab.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleSave} 
                        disabled={isLoadingTabs || isSaving || !currentSheetId || !currentTab}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 