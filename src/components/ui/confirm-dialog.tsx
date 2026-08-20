"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'default';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Continue",
    cancelText = "Cancel",
    variant = "default",
    isLoading = false
}: ConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[420px] clay-surface border-0 p-0 overflow-hidden">
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-base font-black text-zinc-900 dark:text-zinc-100">{title}</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 mt-2">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black clay-button text-zinc-600 dark:text-zinc-300 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all active:scale-95 shadow-md",
                                variant === 'danger'
                                    ? "clay-pill-rose"
                                    : "clay-pill-blue",
                                isLoading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? "Memproses..." : confirmText}
                        </button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
