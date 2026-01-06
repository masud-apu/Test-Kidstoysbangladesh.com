import { Skeleton } from "@/components/ui/skeleton"

export function RecommendedProductsSkeleton() {
    return (
        <div className="mt-16">
            <Skeleton className="h-8 w-48 mb-6 mx-4 md:mx-0" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 px-2 md:px-0 [&>*:nth-child(6)]:xl:hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 space-y-3 border border-gray-100">
                        <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                            <Skeleton className="h-full w-full" />
                        </div>
                        <div className="space-y-1 pt-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-9 w-full rounded-md" />
                            <div className="hidden md:block">
                                <Skeleton className="h-9 w-9 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
