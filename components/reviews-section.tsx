'use client'

import { Star, User, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Mock data for reviews
const REVIEWS = [
    {
        id: 1,
        author: "Fatima Begum",
        rating: 5,
        date: "2 days ago",
        content: "Excellent quality toy! My son loves it very much. Delivery was super fast within Dhaka."
    },
    {
        id: 2,
        author: "Rahul Das",
        rating: 4,
        date: "1 week ago",
        content: "Good product, exactly as shown in the picture. Packaging could be better though."
    },
    {
        id: 3,
        author: "Sadia Khan",
        rating: 5,
        date: "2 weeks ago",
        content: "Highly recommended! The build quality is amazing for this price. Will order again from here."
    },
    {
        id: 4,
        author: "Tanvir Ahmed",
        rating: 5,
        date: "3 weeks ago",
        content: "Best toy shop in BD. Authentic products and great customer service."
    }
]

export function ReviewsSection() {
    return (
        <div className="mt-16 px-4 md:px-0">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Customer Reviews</h2>
                <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquarePlus className="w-4 h-4" />
                    Write a Review
                </Button>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                <div className="space-y-8">
                    {REVIEWS.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 last:border-0 last:pb-0 pb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-brand-yellow/10 p-2 rounded-full">
                                    <User className="w-5 h-5 text-brand-navy" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{review.author}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{review.date}</span>
                                        <span>•</span>
                                        <span className="text-green-600 font-medium">Verified Purchase</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center mb-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-gray-600 leading-relaxed">{review.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
