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
            <DialogContent className="sm:max-w-[425px] bg-slate-950/90 border-white/10 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-white">{title}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-lg active:scale-95",
                            variant === 'danger'
                                ? "bg-red-600 hover:bg-red-500 shadow-red-600/20"
                                : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
