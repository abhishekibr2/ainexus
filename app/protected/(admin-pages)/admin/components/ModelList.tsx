"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Model, availableIcons } from "./types";
import { AddModelDialog } from "./AddModelDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EditModelDialog } from "./EditModelDialog";

const MotionCard = motion(Card);
const MotionTableRow = motion(TableRow);

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

interface ModelListProps {
    models: Model[];
    isLoading: boolean;
    userId: string | null;
    onModelsUpdate: (models: Model[]) => void;
    onDeleteModel: (modelId: number) => Promise<void>;
}

const ModelSkeletonCard = () => (
    <MotionTableRow
        variants={item}
        initial="hidden"
        animate="show"
        exit="hidden"
    >
        <TableCell><Skeleton className="h-10 w-10" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
    </MotionTableRow>
);

const EmptyState = () => (
    <motion.div
        className="text-center py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <motion.div
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
        >
            <Bot className="h-5 w-5 text-muted-foreground" />
        </motion.div>
        <motion.h3
            className="mt-4 text-lg font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            No models found
        </motion.h3>
        <motion.p
            className="mt-2 mb-4 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
            Get started by creating your first AI model.
        </motion.p>
    </motion.div>
);

export function ModelList({
    models,
    isLoading,
    userId,
    onModelsUpdate,
    onDeleteModel
}: ModelListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [deletingModelId, setDeletingModelId] = useState<number | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeletingModel, setIsDeletingModel] = useState(false);
    const [editingModel, setEditingModel] = useState<Model | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const filteredModels = models.filter((model) =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteConfirm = async () => {
        if (deletingModelId) {
            setIsDeletingModel(true);
            await onDeleteModel(deletingModelId);
            setIsDeletingModel(false);
            setShowDeleteDialog(false);
            setDeletingModelId(null);
        }
    };

    return (
        <MotionCard
            className="p-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
        >
            <motion.div
                className="flex justify-between items-center mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <Input
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                {!isLoading && filteredModels.length > 0 && (
                    <AddModelDialog
                        userId={userId}
                        onModelCreated={onModelsUpdate}
                    />
                )}
            </motion.div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Icon</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Auth Required</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <>
                                <ModelSkeletonCard />
                                <ModelSkeletonCard />
                                <ModelSkeletonCard />
                            </>
                        ) : filteredModels.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <EmptyState />
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {filteredModels.map((model) => {
                                    const IconComponent = availableIcons.find(
                                        (i) => i.id === model.icon
                                    )?.icon;
                                    return (
                                        <motion.tr
                                            key={model.id}
                                            variants={item}
                                            initial="hidden"
                                            animate="show"
                                            exit="hidden"
                                            layout
                                            className="group hover:bg-accent/5 transition-colors"
                                        >
                                            <TableCell>
                                                <Link
                                                    href={`/agents/explore-agents?id=${model.id}`}
                                                    target="_blank"
                                                    className="flex items-center"
                                                >
                                                    <motion.div
                                                        className="p-2 border rounded-lg w-fit"
                                                        whileHover={{ scale: 1.1 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                                    >
                                                        {IconComponent && <IconComponent className="h-6 w-6" />}
                                                    </motion.div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/protected/agents/explore-agents?id=${model.id}`}
                                                    target="_blank"
                                                    className="hover:underline"
                                                >
                                                    {model.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/protected/agents/explore-agents?id=${model.id}`}
                                                    target="_blank"
                                                    className="block"
                                                >
                                                    {model.description}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/protected/agents/explore-agents?id=${model.id}`}
                                                    target="_blank"
                                                    className="block"
                                                >
                                                    <Switch checked={model.is_auth} disabled />
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm max-w-[200px] truncate">
                                                <Link
                                                    href={`/protected/agents/explore-agents?id=${model.id}`}
                                                    target="_blank"
                                                    className="block"
                                                >
                                                    {model.code}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <motion.div
                                                    className="flex gap-2"
                                                    initial={{ opacity: 0.8 }}
                                                    whileHover={{ opacity: 1 }}
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingModel(model);
                                                            setShowEditDialog(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            setDeletingModelId(model.id);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                        disabled={isDeletingModel && deletingModelId === model.id}
                                                    >
                                                        {isDeletingModel && deletingModelId === model.id ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            'Delete'
                                                        )}
                                                    </Button>
                                                </motion.div>
                                            </TableCell>
                                        </motion.tr>
                                    );
                                })}
                            </>
                        )}
                    </AnimatePresence>
                </TableBody>
            </Table>

            {deletingModelId && (
                <DeleteConfirmDialog
                    model={models.find(m => m.id === deletingModelId)}
                    showDialog={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    onConfirm={handleDeleteConfirm}
                    isDeleting={isDeletingModel}
                />
            )}

            <EditModelDialog
                model={editingModel}
                showDialog={showEditDialog}
                onOpenChange={setShowEditDialog}
                userId={userId}
                onModelUpdated={onModelsUpdate}
            />
        </MotionCard>
    );
} 