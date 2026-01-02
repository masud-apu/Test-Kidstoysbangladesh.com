export const metadata = {
    title: 'Legal Policies - Kids Toys Bangladesh',
    description: 'Returns & Refunds, Privacy Policy, and Terms of Service for Kids Toys Bangladesh.',
}

export default function PoliciesPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto max-w-7xl px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-16">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:sticky lg:top-24 h-fit">
                        <div className="space-y-1">
                            <h2 className="font-bold text-gray-900 mb-4 px-3">Legal & Policies</h2>
                            <a
                                href="#returns"
                                className="block px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-100 focus:text-brand-red transition-colors"
                            >
                                Returns & Refunds
                            </a>
                            <a
                                href="#privacy"
                                className="block px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-100 focus:text-brand-red transition-colors"
                            >
                                Privacy Policy
                            </a>
                            <a
                                href="#terms"
                                className="block px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-100 focus:text-brand-red transition-colors"
                            >
                                Terms of Service
                            </a>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="min-w-0 space-y-16">

                        {/* Returns & Refunds */}
                        <section id="returns" className="scroll-mt-24">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                Returns & Refunds Policy
                            </h1>
                            <div className="prose prose-gray max-w-none text-gray-600">
                                <p>
                                    At <strong>Kids Toys Bangladesh</strong>, we are committed to ensuring your complete satisfaction with every purchase. We understand that sometimes a product might not meet your expectations, or unforeseen issues may arise during delivery.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">Return Eligibility</h3>
                                <p>
                                    You may initiate a return within <strong>7 days</strong> of receiving your order if the item is defective, damaged, or incorrect. To be eligible for a return, the toy must be unused, in the same condition that you received it, and in its <strong>original packaging</strong> with all tags and seals intact. Please note that for hygiene and safety reasons, certain categories of items may not be eligible for return once opened.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">Refund Process</h3>
                                <p>
                                    Once we receive your returned item and inspect it, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed within <strong>5-7 business days</strong>. For Cash on Delivery orders, refunds will be issued via <strong>bKash, Nagad, or Bank Transfer</strong>.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">Damaged Items</h3>
                                <p>
                                    If you receive a damaged product, please take clear photos or videos of the damage immediately upon delivery and contact our support team at <strong>01337411948</strong> or via WhatsApp. We will arrange for a replacement or a full refund at no extra cost to you. We aim to make the process as seamless as possible for our valued parents and customers.
                                </p>
                            </div>
                        </section>

                        {/* Privacy Policy */}
                        <section id="privacy" className="scroll-mt-24">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                Privacy Policy
                            </h1>
                            <div className="prose prose-gray max-w-none text-gray-600">
                                <p>
                                    <strong>Kids Toys Bangladesh</strong> values your trust and is dedicated to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you visit our website or make a purchase.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">Information We Collect</h3>
                                <p>
                                    When you place an order, we collect essential information such as your <strong>name, shipping address, phone number, and email address</strong>. This data is strictly used to process your order, manage delivery, and communicate with you regarding your purchase status. We do not store your payment information on our servers; all financial transactions are handled securely through our trusted payment partners.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">How We Use Your Information</h3>
                                <p>
                                    Your information allows us to fulfill your orders effectively. We may share your delivery details with third-party courier services (e.g., Pathao, RedX, Sundarban Courier) solely for the purpose of delivering your products. We do <strong>not</strong> sell, trade, or rent your personal identification information to others.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">Cookies & Security</h3>
                                <p>
                                    Our website uses cookies to enhance your browsing experience, such as remembering items in your cart. We implement suitable security measures to protect against unauthorized access, alteration, or disclosure of your personal data. By using our site, you consent to the practices described in this policy.
                                </p>
                            </div>
                        </section>

                        {/* Terms of Service */}
                        <section id="terms" className="scroll-mt-24">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                Terms of Service
                            </h1>
                            <div className="prose prose-gray max-w-none text-gray-600">
                                <p>
                                    Welcome to <strong>Kids Toys Bangladesh</strong>. By accessing or using our website, you agree to comply with and be bound by the following Terms of Service. Please read them carefully before making a purchase.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">General Conditions</h3>
                                <p>
                                    We reserve the right to refuse service to anyone for any reason at any time. You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service, use of the Service, or access to the Service without express written permission by us.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">Product Accuracy</h3>
                                <p>
                                We strive to display the colors and images of our products as accurately as possible. However, we cannot guarantee that your computer monitor&apos;s display of any color will be accurate. We reserve the right to limit the sales of our products or Services to any person, geographic region, or jurisdiction.
                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">Pricing & Modifications</h3>
                                <p>
                                    Prices for our products are subject to change without notice. We aim to provide accurate pricing, but errors may occur. If we discover an error in the price of the goods you have ordered, we will inform you as soon as possible. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.
                                </p>

                                <h3 className="text-gray-900 font-semibold mt-6 mb-3">Governing Law</h3>
                                <p>
                                    These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of <strong>Bangladesh</strong>.
                                </p>
                            </div>
                        </section>

                    </main>
                </div>
            </div>
        </div>
    )
}
