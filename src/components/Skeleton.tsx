import React from "react";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
      {...props}
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function DetailedPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Banner Skeleton */}
      <div className="h-48 md:h-64 rounded-2xl bg-slate-100 dark:bg-slate-950 p-6 flex flex-col justify-end space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64 md:w-96" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Tabs Skeleton */}
      <div className="flex gap-2 pb-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800">
        <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
        <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
        <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
        <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
      </div>
      {/* Layout Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      <td className="py-3 px-4"><Skeleton className="h-5 w-32" /></td>
      <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
      <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
      <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
      <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
    </tr>
  );
}
