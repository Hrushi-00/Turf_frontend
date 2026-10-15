type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

export function TurfCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04]">
      <Skeleton className="h-48 rounded-none" />
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-white/10 bg-white/[.04] p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/2" /><div className="flex gap-2"><Skeleton className="h-7 w-24" /><Skeleton className="h-7 w-20" /></div></div>
        <div className="space-y-3 md:w-40"><Skeleton className="h-7 w-24" /><Skeleton className="h-10 w-full" /></div>
      </div>
    </div>
  );
}
