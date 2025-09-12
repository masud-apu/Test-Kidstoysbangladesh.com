// Quick test for PDF generation
const { generatePDFBuffer } = require('./lib/pdf-generator.ts');

const testOrderData = {
  customerName: "Test Customer",
  customerPhone: "01700000000",
  customerAddress: "Test Address, Dhaka, Bangladesh",
  items: [
    {
      id: "test-1",
      name: "Test Product 1",
      price: "1000",
      quantity: 2,
      images: []
    },
    {
      id: "test-2", 
      name: "Test Product 2",
      price: "500",
      quantity: 1,
      images: []
    }
  ],
  itemsTotal: 2500,
  shippingCost: 60,
  totalAmount: 2560,
  orderId: "KTB" + Date.now()
};

console.log('Testing PDF generation...');

generatePDFBuffer(testOrderData)
  .then(() => {
    console.log('✅ PDF generation successful!');
  })
  .catch((error) => {
    console.error('❌ PDF generation failed:', error);
  });