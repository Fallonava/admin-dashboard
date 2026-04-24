import { Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { PortalManagerClient } from "@/features/portal-manager/components/PortalManagerClient";

export default function PortalManagerPage() {
  return (
    <Suspense fallback={<PortalManagerSkeleton />}>
      <PortalManagerClient />
    </Suspense>
  );
}

function PortalManagerSkeleton() {
  return (
    <div className="w-full h-full px-4 lg:px-8 flex flex-col overflow-hidden animate-pulse">
      <header className="flex items-center justify-between pt-4 mb-6 gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </header>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
