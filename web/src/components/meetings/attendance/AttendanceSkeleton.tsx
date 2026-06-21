'use client';

export function AttendanceSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-inset-border [&>*+*]:border-t [&>*+*]:border-divider">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-200" style={{ maxWidth: `${60 + Math.random() * 30}%` }} />
            <div className="ml-auto h-[26px] w-[26px] shrink-0 animate-pulse rounded-[7px] bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
