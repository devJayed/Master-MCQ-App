const items = (count) => Array.from({ length: count }, (_, index) => index);

export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

export function SkeletonStatus({ label = 'Loading content', children, className = '' }) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function CardGridSkeleton({ count = 4, className = '' }) {
  return (
    <SkeletonStatus className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {items(count).map((index) => (
        <div key={index} className="rounded-box border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="mt-5 h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-20" />
        </div>
      ))}
    </SkeletonStatus>
  );
}

export function ListSkeleton({ count = 4, rowClassName = 'h-16', className = '' }) {
  return (
    <SkeletonStatus className={`space-y-3 ${className}`}>
      {items(count).map((index) => <Skeleton key={index} className={`w-full ${rowClassName}`} />)}
    </SkeletonStatus>
  );
}

export function TableRowsSkeleton({ rows = 5, columns = 5 }) {
  return (
    <>
      {items(rows).map((row) => (
        <tr key={row} aria-hidden="true">
          {items(columns).map((column) => (
            <td key={column}>
              <Skeleton className={`h-4 ${column === 0 ? 'w-48 max-w-full' : 'w-20'}`} />
              {column < 2 && <Skeleton className="mt-2 h-3 w-28 max-w-full" />}
            </td>
          ))}
        </tr>
      ))}
      <tr className="sr-only"><td colSpan={columns} role="status">Loading table data</td></tr>
    </>
  );
}

export function PageSkeleton() {
  return (
    <SkeletonStatus className="mx-auto max-w-7xl p-5 md:p-10">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-10 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <CardGridSkeleton className="mt-8" />
      <Skeleton className="mt-6 h-72 w-full" />
    </SkeletonStatus>
  );
}

export function TestSkeleton() {
  return (
    <SkeletonStatus className="mx-auto max-w-3xl p-5 md:p-10" label="Preparing test">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-6 w-14" />
      </div>
      <div className="rounded-box border border-base-300 bg-base-100 p-6 md:p-10">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-5 h-8 w-5/6" />
        <Skeleton className="mt-3 h-8 w-2/3" />
        <ListSkeleton count={4} rowClassName="h-14" className="mt-8" />
      </div>
    </SkeletonStatus>
  );
}

export function ResultSkeleton() {
  return (
    <SkeletonStatus className="mx-auto max-w-5xl p-5 md:p-10" label="Loading result">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-80 max-w-full" />
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-8 space-y-4">
        {items(3).map((index) => (
          <div key={index} className="rounded-box border border-base-300 bg-base-100 p-6">
            <Skeleton className="h-6 w-3/4" />
            <ListSkeleton count={4} rowClassName="h-12" className="mt-5" />
          </div>
        ))}
      </div>
    </SkeletonStatus>
  );
}
