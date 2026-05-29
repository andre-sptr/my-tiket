export default function FlightCardSkeleton() {
  return (
    <div className="pass-card overflow-hidden">
      <div className="grid grid-cols-12">
        <div className="col-span-12 animate-pulse p-7 md:col-span-9">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-md bg-midnight-700/10" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-midnight-700/10" />
              <div className="h-2 w-20 rounded bg-midnight-700/10" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <div className="space-y-2">
              <div className="h-10 w-24 rounded bg-midnight-700/10" />
              <div className="h-2 w-16 rounded bg-midnight-700/10" />
            </div>
            <div className="h-px w-32 bg-midnight-700/10" />
            <div className="space-y-2 text-right">
              <div className="ml-auto h-10 w-24 rounded bg-midnight-700/10" />
              <div className="ml-auto h-2 w-16 rounded bg-midnight-700/10" />
            </div>
          </div>
        </div>
        <div className="col-span-12 animate-pulse space-y-3 border-t border-dashed border-midnight-700/15 bg-cream-100/60 p-7 md:col-span-3 md:border-l md:border-t-0">
          <div className="h-3 w-16 rounded bg-midnight-700/10" />
          <div className="h-8 w-32 rounded bg-midnight-700/10" />
          <div className="h-9 w-full rounded-full bg-midnight-700/10" />
          <div className="h-9 w-full rounded-full bg-midnight-700/10" />
        </div>
      </div>
    </div>
  );
}
