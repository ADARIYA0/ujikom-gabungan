'use client';

import { useState } from 'react';
import { AnimatedDialog, AnimatedDialogContent, AnimatedDialogDescription, AnimatedDialogHeader, AnimatedDialogTitle } from './animated-dialog';
import AnimatedEventForm from '../AnimatedEventForm';

interface EventFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateEvent: (eventData: any) => void;
}

export default function EventFormDialog({ open, onOpenChange, onCreateEvent }: EventFormDialogProps) {
    const [isClosingDialog, setIsClosingDialog] = useState(false);

    const handleCloseDialog = () => {
        setIsClosingDialog(true);
        setTimeout(() => {
            onOpenChange(false);
            setIsClosingDialog(false);
        }, 300);
    };

    const handleCreateEvent = (eventData: any) => {
        onCreateEvent(eventData);
        handleCloseDialog();
    };

    return (
        <AnimatedDialog
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    handleCloseDialog();
                } else {
                    onOpenChange(true);
                }
            }}
        >
            <AnimatedDialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <AnimatedDialogHeader className="flex-shrink-0 relative">
                    <button
                        onClick={handleCloseDialog}
                        className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-200 hover:scale-110 hover:rotate-90"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <AnimatedDialogTitle className="pr-10">Buat Event Baru</AnimatedDialogTitle>
                    <AnimatedDialogDescription>
                        Lengkapi informasi event yang akan diselenggarakan
                    </AnimatedDialogDescription>
                </AnimatedDialogHeader>
                <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <AnimatedEventForm
                        onSubmit={handleCreateEvent}
                        onCancel={handleCloseDialog}
                    />
                </div>
            </AnimatedDialogContent>
        </AnimatedDialog>
    );
}
