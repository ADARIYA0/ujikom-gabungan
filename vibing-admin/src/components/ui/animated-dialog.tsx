"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const AnimatedDialog = DialogPrimitive.Root;

const AnimatedDialogTrigger = DialogPrimitive.Trigger;

const AnimatedDialogPortal = DialogPrimitive.Portal;

const AnimatedDialogClose = DialogPrimitive.Close;

const AnimatedDialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            className
        )}
        {...props}
    />
));
AnimatedDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const AnimatedDialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AnimatedDialogPortal>
        <AnimatedDialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-150 sm:max-w-lg",
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </AnimatedDialogPortal>
));
AnimatedDialogContent.displayName = DialogPrimitive.Content.displayName;

const AnimatedDialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className
        )}
        {...props}
    />
);
AnimatedDialogHeader.displayName = "AnimatedDialogHeader";

const AnimatedDialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
);
AnimatedDialogFooter.displayName = "AnimatedDialogFooter";

const AnimatedDialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
));
AnimatedDialogTitle.displayName = DialogPrimitive.Title.displayName;

const AnimatedDialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
AnimatedDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    AnimatedDialog,
    AnimatedDialogPortal,
    AnimatedDialogOverlay,
    AnimatedDialogClose,
    AnimatedDialogTrigger,
    AnimatedDialogContent,
    AnimatedDialogHeader,
    AnimatedDialogFooter,
    AnimatedDialogTitle,
    AnimatedDialogDescription,
};
