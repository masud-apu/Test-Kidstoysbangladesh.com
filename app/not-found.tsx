import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gray-50 text-center px-4">
            <h1 className="text-9xl font-bold text-gray-200">404</h1>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8">
                <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Page not found</h2>
                <p className="mt-4 text-gray-600">
                    Sorry, we couldn&apos;t find the page you&apos;re looking for.
                </p>
                <Link href="/" className="mt-8 inline-block">
                    <Button size="lg">
                        Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    )
}
