-- Sample products for testing
-- Run this in Drizzle Studio or your Neon database console

INSERT INTO products (handle, name, price, compare_price, tags, images, description) VALUES 
(
  'smartphone-latest-model', 
  'স্মার্টফোন - সর্বশেষ মডেল',
  '25000.00',
  '30000.00',
  '["electronics", "smartphone", "mobile"]',
  '["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"]',
  'এই স্মার্টফোনটি সর্বশেষ প্রযুক্তি সহ তৈরি। উন্নত ক্যামেরা, দ্রুত প্রসেসর এবং দীর্ঘস্থায়ী ব্যাটারি সহ।'
),
(
  'gaming-laptop-pro',
  'ল্যাপটপ - গেমিং এবং অফিস',
  '55000.00',
  '65000.00',
  '["electronics", "laptop", "gaming"]',
  '["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800"]',
  'উচ্চ কর্মক্ষমতার ল্যাপটপ যা গেমিং এবং অফিসের কাজ দুটোর জন্যই উপযুক্ত।'
),
(
  'wireless-earphones-premium',
  'ওয়্যারলেস ইয়ারফোন',
  '3500.00',
  NULL,
  '["audio", "wireless", "premium"]',
  '["https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800"]',
  'প্রিমিয়াম ওয়্যারলেস ইয়ারফোন যাতে রয়েছে নয়েজ ক্যান্সেলেশন এবং দীর্ঘস্থায়ী ব্যাটারি লাইফ।'
),
(
  'smart-watch-health',
  'স্মার্ট ওয়াচ',
  '8500.00',
  '10000.00',
  '["wearable", "smart", "health"]',
  '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"]',
  'স্বাস্থ্য পর্যবেক্ষণের বৈশিষ্ট্য সহ স্মার্ট ওয়াচ। হার্ট রেট, স্টেপ কাউন্টার এবং আরও অনেক ফিচার।'
);