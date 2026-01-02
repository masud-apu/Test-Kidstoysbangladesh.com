"use client";

import Marquee from "react-fast-marquee";
import {
    Truck,
    Banknote,
    ShieldCheck,
    Gift,
    PackageCheck,
    Ship,
    BanknoteX,
    Baby,
    Replace,
} from "lucide-react";

export function FeaturesMarquee() {
    const features = [
        {
            icon: Truck,
            title: "Super Fast Delivery",
            description: "Order now, get it tomorrow in Dhaka",
            color: "text-brand-green bg-brand-green/10",
        },
        {
            icon: Banknote,
            title: "Cash on Delivery",
            description: "No advance needed. Pay on delivery",
            color: "text-brand-blue bg-brand-blue/10",
        },
        {
            icon: ShieldCheck,
            title: "Verified Orders",
            description: "We verify every order personally",
            color: "text-brand-green bg-brand-green/10",
        },
        {
            icon: Ship,
            title: "Premium Quality",
            description: "Top quality China exported toys",
            color: "text-brand-yellow bg-brand-yellow/10",
        },
        {
            icon: BanknoteX,
            title: "Free Shipping",
            description: "Free shipping on orders over 1000 Taka",
            color: "text-brand-red bg-brand-red/10",
        },
        {
            icon: Baby,
            title: "Child Safe",
            description: "Non-toxic and safe for all kids",
            color: "text-brand-navy bg-brand-navy/10",
        },
        {
            icon: Replace,
            title: "Easy Replacement",
            description: "Damaged item? We replace instantly",
            color: "text-brand-navy bg-brand-navy/10",
        },
        {
            icon: PackageCheck,
            title: "Secure Packing",
            description: "Secure packing for safe delivery",
            color: "text-brand-blue bg-brand-blue/10",
        },
    ];

    return (
        <div className="relative z-10 bg-white border-b border-gray-100 shadow-sm overflow-hidden">
            <div className="py-2">
                <Marquee pauseOnHover={true} gradient={false} speed={15}>
                    {features.map((feature, index) => (
                        <div
                            key={`feature-${index}`}
                            className="flex items-center gap-3 p-2 pr-6 rounded-lg min-w-[280px] border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors bg-white shadow-sm mx-2"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${feature.color}`}
                            >
                                <feature.icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm text-brand-navy leading-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-500 text-xs leading-none mt-1 truncate">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </Marquee>
            </div>
        </div>

    );
}
