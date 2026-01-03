"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Baby, Wallet, Search, TrendingUp, Sparkles } from "lucide-react";

interface Product {
    id: number;
    title: string;
    variants: Array<{
        price: string;
        compareAtPrice?: string | null;
    }>;
    tags?: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface FilteredProductSectionProps {
    products: Product[];
}

export function FilteredProductSection({ products }: FilteredProductSectionProps) {
    const ageFilters = [
        { label: '0-6m', val: '0-6' },
        { label: '6m-1y', val: '6-12' },
        { label: '1y-2y', val: '12-24' },
        { label: '2y-3y', val: '24-36' },
        { label: '3y-4y', val: '36-48' },
        { label: '4y-5y', val: '48-60' },
    ];

    const budgetFilters = [
        { label: '< 300', min: 0, max: 300 },
        { label: '300-700', min: 300, max: 700 },
        { label: '700-1k', min: 700, max: 1000 },
        { label: '1k-2k', min: 1000, max: 2000 },
        { label: '2k-5k', min: 2000, max: 5000 },
        { label: '> 5k', min: 5000, max: 100000 }
    ];

    return (
        <section id="all-products" className="py-12 bg-gradient-to-b from-white to-gray-50/50 scroll-mt-24 rounded-[2.5rem] my-8 mx-4 lg:mx-8 shadow-sm border border-gray-100/50">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-navy text-sm font-bold mb-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
                        <Sparkles className="w-4 h-4 text-brand-yellow" />
                        <span>Curated Just For You</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-4 font-display">
                        Find the Perfect <span className="text-brand-red">Toy</span>
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                        Discover our extensive collection filtered by age or budget.
                        <br className="hidden md:block" /> The best toys for every milestone.
                    </p>
                </div>

                {/* Stylish Filter Container */}
                <div className="mb-8 relative z-10 px-2 md:px-0">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100/40 border border-gray-100 p-3 md:p-4 max-w-fit mx-auto relative overflow-hidden">

                        <div className="relative flex flex-wrap items-center justify-center gap-3 md:gap-6">

                            {/* Age Group */}
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-red/20 bg-white text-brand-red shadow-sm shrink-0">
                                    <Baby className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Age</span>
                                </div>

                                <div className="flex flex-wrap justify-center gap-1.5">
                                    {ageFilters.map((age, i) => (
                                        <Link
                                            key={age.label}
                                            href={`/products?age_min=${age.val.split('-')[0]}&age_max=${age.val.split('-')[1]}`}
                                            className="px-4 py-2 rounded-full bg-gray-50 border border-transparent text-xs font-semibold text-gray-600 transition-all duration-300 hover:bg-brand-red hover:text-white hover:shadow-md hover:shadow-brand-red/20 hover:-translate-y-0.5 active:scale-95"
                                        >
                                            {age.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Divider - functional but subtle */}
                            <div className="hidden lg:block w-px h-8 bg-gray-100"></div>

                            {/* Budget Group */}
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-brand-blue/20 bg-white text-brand-blue shadow-sm shrink-0">
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Budget</span>
                                </div>

                                <div className="flex flex-wrap justify-center gap-1.5">
                                    {budgetFilters.map((budget, i) => (
                                        <Link
                                            key={budget.label}
                                            href={`/products?min_price=${budget.min}&max_price=${budget.max}`}
                                            className="px-4 py-2 rounded-full bg-gray-50 border border-transparent text-xs font-semibold text-gray-600 transition-all duration-300 hover:bg-brand-blue hover:text-white hover:shadow-md hover:shadow-brand-blue/20 hover:-translate-y-0.5 active:scale-95"
                                        >
                                            {budget.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {products.slice(0, 20).map((product) => (
                            <div key={product.id} className="h-full">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                            <Search className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-gray-900">No products found</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">We couldn't find any products in this collection. Please check back later!</p>
                        <Button variant="outline" className="h-11 border-gray-200 hover:bg-white hover:text-brand-navy hover:border-brand-navy transition-colors">
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
