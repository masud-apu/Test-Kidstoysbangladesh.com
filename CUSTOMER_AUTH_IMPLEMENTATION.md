# Customer Authentication Implementation

## 🎉 Implementation Complete!

This document provides a comprehensive guide to the phone-based customer authentication system implemented for KidsToys Bangladesh.

---

## ✅ What Has Been Implemented

### **Backend (Admin Project - `/admin`)**

1. **Database Schema**
   - `customers` table - Customer accounts with phone as primary identifier
   - `customer_sessions` table - Session management for customer logins
   - `customer_otp_codes` table - OTP codes for verification
   - Updated `orders` table with `customerId` field for linking orders to customers

2. **Services**
   - `lib/services/sms-service.ts` - BulkSMSBD integration for OTP delivery
   - `lib/services/customer-auth-service.ts` - Authentication logic (OTP, sessions)

3. **API Routes**
   - `POST /api/auth/customer/send-otp` - Send OTP to phone
   - `POST /api/auth/customer/verify-otp` - Verify OTP and create session
   - `GET /api/auth/customer/session` - Validate session
   - `POST /api/auth/customer/logout` - Logout (delete session)
   - `GET /api/customer/profile` - Get customer profile
   - `PUT /api/customer/profile` - Update customer profile
   - `GET /api/customer/orders` - Get customer orders

4. **Updated Features**
   - Order creation API now supports customer linking (authenticated + phone matching)

### **Frontend (Customer Site - `/Kidstoysbangladesh.com`)**

1. **NextAuth v5 Configuration**
   - `auth.config.ts` - NextAuth configuration
   - `auth.ts` - Authentication handlers with OTP provider
   - `middleware.ts` - Route protection
   - `types/next-auth.d.ts` - TypeScript types

2. **Authentication UI**
   - `components/auth/phone-auth-dialog.tsx` - Phone + OTP authentication modal
   - `components/auth/user-account-dropdown.tsx` - User account menu

3. **Customer Account Pages**
   - `/account` - Dashboard with order summary
   - `/account/profile` - Edit profile (name, email, default address)
   - `/account/orders` - View all orders with tracking
   - `/auth/signin` - Sign-in page

4. **API Client**
   - `lib/api/auth-api.ts` - Client-side functions for backend communication

---

## 🚀 How It Works

### **Authentication Flow**

#### **1. Sign Up (New Customer)**
```
User enters phone → Clicks "Sign Up"
  ↓
Frontend calls /api/auth/customer/send-otp (purpose: signup)
  ↓
Backend checks: Phone doesn't exist? ✅
  ↓
Generate 6-digit OTP → Store in database (5 min expiry)
  ↓
Send OTP via BulkSMSBD
  ↓
User enters OTP
  ↓
Frontend calls NextAuth signIn('otp')
  ↓
Backend verifies OTP → Creates customer account + session
  ↓
User logged in ✅
```

#### **2. Login (Existing Customer)**
```
User enters phone → Clicks "Login"
  ↓
Frontend calls /api/auth/customer/send-otp (purpose: login)
  ↓
Backend checks: Phone exists? ✅
  ↓
Generate OTP → Send via SMS
  ↓
User enters OTP → Verify → Login ✅
```

#### **3. Order-First Account Creation**
```
Guest user places order with phone: 01712345678
  ↓
Order API checks: Does customer exist with this phone?
  ↓
  Yes → Link order to existing customer (auto)
  No → Create guest order (no customer account)
```

**Future Enhancement**: After guest order, send SMS:
"Order confirmed! Create account to track: [link with OTP]"

---

## 📋 Customer Account Features

### **Profile Management**
- ✅ View/edit name
- ✅ View/edit email (optional)
- ✅ View/edit default shipping address
- ✅ Phone number (read-only, cannot be changed)

### **Order Management**
- ✅ View all orders
- ✅ Order details (items, totals, status)
- ✅ Track order status
- ✅ Filter by authenticated customer

### **Session Management**
- ✅ 7-day session expiry
- ✅ Secure JWT tokens (HTTP-only cookies)
- ✅ Logout functionality
- ✅ Session validation middleware

---

## 🔐 Security Features

1. **OTP Security**
   - 6-digit codes (100,000 - 999,999)
   - 5-minute expiry
   - Max 3 verification attempts per code
   - Prevent code reuse after verification
   - Rate limiting: Max 3 OTP requests per phone per hour

2. **Session Security**
   - HTTP-only cookies (XSS protection)
   - 7-day expiry
   - Server-side validation
   - CSRF protection via NextAuth

3. **Phone Validation**
   - Bangladesh mobile format validation
   - Normalization to 8801XXXXXXXXX format
   - Supports all BD operators (GP, Robi, Banglalink, Teletalk, Airtel)

---

## 🔧 Configuration

### **Environment Variables**

#### Admin Backend (`.env.local`)
```bash
# SMS Service
BULK_SMS_API_KEY=W0OwURcX6rpj3O0bW6JW
BULK_SMS_SENDER_ID=8809648904732

# Customer Auth
CUSTOMER_SESSION_EXPIRY_DAYS=7
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
```

#### Frontend (`.env.local`)
```bash
# Admin Backend URL
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3001

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production-min-32-chars"
NEXTAUTH_URL=http://localhost:3000
```

---

## 📱 Usage Examples

### **Using the Phone Auth Dialog**

```typescript
import { PhoneAuthDialog } from '@/components/auth/phone-auth-dialog'

// In your component
<PhoneAuthDialog
  open={showAuth}
  onOpenChange={setShowAuth}
  callbackUrl="/checkout"
  defaultTab="login"
/>
```

### **Accessing Customer Session**

```typescript
import { auth } from '@/auth'

// Server component
const session = await auth()
const customer = session?.user

// Client component
import { useSession } from 'next-auth/react'
const { data: session } = useSession()
```

### **Calling Customer APIs**

```typescript
import { getProfile, updateProfile, getOrders } from '@/lib/api/auth-api'

// Get profile
const profile = await getProfile(sessionToken)

// Update profile
const result = await updateProfile(sessionToken, {
  name: 'Customer Name',
  email: 'customer@example.com'
})

// Get orders
const orders = await getOrders(sessionToken)
```

---

## 🧪 Testing Checklist

### **Authentication**
- [ ] Send OTP to valid BD phone number
- [ ] Send OTP to invalid phone number (should fail)
- [ ] Verify correct OTP code (should succeed)
- [ ] Verify wrong OTP code (should fail)
- [ ] Verify expired OTP (5+ minutes old)
- [ ] Try 4 wrong OTP attempts (should lock out)
- [ ] Request 4 OTPs within 1 hour (should rate limit)
- [ ] Sign up with new phone number
- [ ] Login with existing phone number
- [ ] Logout and verify session cleared

### **Profile Management**
- [ ] View profile
- [ ] Update name
- [ ] Update email
- [ ] Update default address
- [ ] Try to edit phone number (should be disabled)

### **Order Linking**
- [ ] Place order while authenticated (should link to customerId)
- [ ] Place order while guest with existing phone (should link to customer)
- [ ] Place order while guest with new phone (should be guest order)
- [ ] View orders in account dashboard

### **Session Management**
- [ ] Login and verify session persists after page refresh
- [ ] Access /account without login (should redirect to signin)
- [ ] Access /account after logout (should redirect)

---

## 🐛 Troubleshooting

### **OTP Not Received**
- Check SMS balance in BulkSMSBD account
- Verify `BULK_SMS_API_KEY` and `BULK_SMS_SENDER_ID` are correct
- Check backend logs for SMS API response
- Ensure phone number is in correct format (8801XXXXXXXXX)

### **Authentication Fails**
- Check `NEXTAUTH_SECRET` is set in frontend `.env.local`
- Verify `NEXTAUTH_URL` matches your frontend URL
- Check browser console for errors
- Verify backend APIs are running on port 3001

### **Session Not Persisting**
- Ensure cookies are enabled in browser
- Check `NEXTAUTH_URL` is correct
- Verify no CORS issues between frontend and backend

### **Database Errors**
- Run `pnpm db:push` in admin project to ensure schema is updated
- Check database connection string in admin `.env.local`

---

## 🔄 Future Enhancements

1. **Post-Order Account Creation**
   - Send SMS after guest order: "Create account to track your order"
   - Include OTP in SMS for instant account claiming

2. **Email OTP Option**
   - If customer has email, allow OTP via email as alternative to SMS
   - Reduce SMS costs for customers who prefer email

3. **Trusted Devices**
   - Remember device after first login
   - Skip OTP on trusted devices for faster login

4. **Order History Export**
   - Download order history as PDF
   - Email order receipts

5. **Wishlist & Favorites**
   - Save products for later
   - Get notifications on price drops

6. **Referral System**
   - Share referral code with friends
   - Get discounts on successful referrals

---

## 📚 Key Files Reference

### Backend
- `lib/schema.ts:189-218` - Customer tables
- `lib/services/sms-service.ts` - SMS integration
- `lib/services/customer-auth-service.ts` - Auth logic
- `app/api/auth/customer/*/route.ts` - Auth endpoints
- `app/api/orders/route.ts:26-56` - Customer linking in orders

### Frontend
- `auth.config.ts` - NextAuth config
- `auth.ts` - Auth handlers
- `middleware.ts` - Route protection
- `components/auth/phone-auth-dialog.tsx` - Auth UI
- `app/account/**` - Customer account pages
- `lib/api/auth-api.ts` - API client

---

## 🎯 Summary

You now have a complete phone-based authentication system with:
- ✅ OTP verification via SMS
- ✅ Customer accounts with profiles
- ✅ Order tracking and history
- ✅ Automatic order linking
- ✅ Secure session management
- ✅ Protected account pages
- ✅ Guest checkout still available

**Next Steps:**
1. Test the authentication flow end-to-end
2. Customize the UI to match your brand
3. Add the auth UI to your header/navigation
4. Consider implementing post-order account creation SMS
5. Monitor SMS costs and optimize OTP delivery

**Need Help?**
- Check this documentation
- Review backend logs for errors
- Test with a real Bangladesh phone number
- Ensure both dev servers are running (frontend:3000, admin:3001)

---

Generated: 2025-10-31
