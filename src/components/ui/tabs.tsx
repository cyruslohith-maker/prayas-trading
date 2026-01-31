"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // FIXED: Removed duplicate 'flex'. Kept 'inline-flex' as it's standard for TabsList
        "bg-[#1E1E1E] text-muted-foreground inline-flex h-14 w-full items-center justify-center rounded-xl p-1 border border-[#2A2A2A]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // FIXED: Cleaned up display logic.
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        // ACTIVE STATE: This creates that "container/pill" look you wanted
        "data-[state=active]:bg-[#2A2A2A] data-[state=active]:text-white text-gray-400",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none mt-4", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };