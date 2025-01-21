import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { getApplications, deleteApplication } from "@/utils/supabase/actions/application";
import { AddApplicationDialog } from "./AddApplicationDialog";
import { EditApplicationDialog } from "./EditApplicationDialog";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Application {
    id: number;
    created_at: string;
    name: string;
    description: string;
    logo: string;
    auth_required: boolean;
    fields: string[];
}

export function ApplicationList() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
    const { toast } = useToast();

    const fetchApplications = async () => {
        try {
            const apps = await getApplications();
            setApplications(apps);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast({
                title: "Error",
                description: "Failed to fetch applications",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleDelete = async (application: Application) => {
        setApplicationToDelete(application);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!applicationToDelete) return;

        try {
            await deleteApplication(applicationToDelete.id);
            toast({
                title: "Success",
                description: "Application deleted successfully",
            });
            fetchApplications();
        } catch (error) {
            console.error('Error deleting application:', error);
            toast({
                title: "Error",
                description: "Failed to delete application",
                variant: "destructive",
            });
        } finally {
            setDeleteDialogOpen(false);
            setApplicationToDelete(null);
        }
    };

    if (isLoading) {
        return <TableSkeleton columnCount={8} rowCount={3} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Applications</h2>
                <AddApplicationDialog onApplicationAdded={fetchApplications} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-md border"
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Logo URL</TableHead>
                            <TableHead>Auth Required</TableHead>
                            <TableHead>Fields</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    No applications found
                                </TableCell>
                            </TableRow>
                        ) : (
                            applications.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell>{app.name}</TableCell>
                                    <TableCell>{app.description}</TableCell>
                                    <TableCell>{app.logo || '-'}</TableCell>
                                    <TableCell>{app.auth_required ? "Yes" : "No"}</TableCell>
                                    <TableCell>{app.fields?.join(", ") || "-"}</TableCell>
                                    <TableCell>
                                        {new Date(app.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <EditApplicationDialog
                                                application={app}
                                                onApplicationUpdated={fetchApplications}
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDelete(app)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </motion.div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the application
                            "{applicationToDelete?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 