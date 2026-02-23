import { Skeleton } from "@/components/ui/skeleton";

export function RecipeCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm h-full">
      {/* Image Placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Skeleton className="h-full w-full" />
      </div>

      {/* Content Placeholder */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        
        {/* Description (2 lines) */}
        <div className="space-y-1.5 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Footer (Time, Servings, Rating) */}
        <div className="mt-auto flex items-center gap-3 pt-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="ml-auto h-4 w-10" />
        </div>
      </div>
    </div>
  );
}