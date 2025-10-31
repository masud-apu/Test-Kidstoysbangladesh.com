# 🔧 Authentication Debugging Guide

## Changes Made to Debug OTP Verification Issue

### Issue Description
User receives OTP via SMS successfully, but when entering the code and clicking "Verify & Continue", they get redirected to an error page (`/api/auth/error`) instead of being logged in.

---

## 🛠️ Changes Implemented

### 1. **Fixed Next.js Configuration (CRITICAL FIX)** 🔥

#### Problem Identified:
- `output: 'export'` was enabled, which disables API routes (required for NextAuth)
- All `/api/*` requests were being proxied to admin backend, including NextAuth routes

#### Solution:
**`next.config.ts` changes:**

1. **Disabled static export:**
```typescript
// output: 'export', // COMMENTED OUT - NextAuth requires server-side rendering
```

2. **Fixed rewrites to exclude NextAuth routes:**
```typescript
// Before: ALL /api/* went to admin backend (WRONG!)
{ source: "/api/:path*", destination: "http://localhost:3001/api/:path*" }

// After: Only specific routes go to admin backend
{ source: "/api/products/:path*", destination: "..." }
{ source: "/api/orders/:path*", destination: "..." }
{ source: "/api/promo-codes/:path*", destination: "..." }
{ source: "/api/auth/customer/:path*", destination: "..." } // Admin's customer auth
// /api/auth/* stays on frontend (NextAuth)
```

**Why this matters:**
- NextAuth routes like `/api/auth/providers`, `/api/auth/error`, `/api/auth/session` were being sent to the admin backend which doesn't have them (404 errors)
- Static export mode completely disables Next.js API routes
- Now NextAuth routes are handled locally, admin routes are proxied

---

### 2. **Added Comprehensive Logging**

#### Frontend - `auth.ts` (NextAuth authorize function)
- ✅ Log incoming credentials (with code masked)
- ✅ Log Zod validation results
- ✅ Log API request details (URL, body)
- ✅ Log API response status and data
- ✅ Log final user object being returned

**Log Markers:**
- 🔍 = Starting/inspection
- ✅ = Success
- ❌ = Error
- 📤 = Outgoing request
- 📥 = Incoming response

#### Frontend - `components/auth/phone-auth-dialog.tsx`
- ✅ Log verification flow start
- ✅ Log current tab (login/signup)
- ✅ Log credentials being sent
- ✅ Log signIn result from NextAuth
- ✅ Better error messages for different error types

#### Backend - `app/api/auth/customer/verify-otp/route.ts`
- ✅ Log incoming request body
- ✅ Log validation success
- ✅ Log service call results
- ✅ Log final response being sent

---

### 2. **Improved Error Handling**

#### `auth.ts` - Relaxed Validation
**Before:**
```typescript
code: z.string().length(6) // Strict - fails immediately if not 6 chars
```

**After:**
```typescript
code: z.string().min(1, 'OTP code required') // Lenient first pass
// Then separate check:
if (parsedCredentials.data.code.length !== 6) {
  console.error('❌ [NextAuth] OTP code must be 6 digits, got:', parsedCredentials.data.code.length)
  return null
}
```

**Why:** Better error messages showing exact length received.

#### `phone-auth-dialog.tsx` - Specific Error Messages
```typescript
const errorMessage = result?.error === 'CredentialsSignin'
  ? 'Invalid or expired OTP code. Please try again.'
  : result?.error || 'Verification failed. Please try again.'
```

---

### 3. **Removed Rate Limiting for Localhost** ⭐

#### `lib/services/customer-auth-service.ts`

**Modified:** `checkOTPRateLimit()` function

**Now skips rate limiting when:**
- `NODE_ENV === 'development'`
- `NEXT_PUBLIC_ADMIN_URL` contains 'localhost'
- `NEXT_PUBLIC_ADMIN_URL` is not set (defaults to localhost)

```typescript
async function checkOTPRateLimit(phone: string): Promise<boolean> {
  // Skip rate limiting in development/localhost
  const isDevelopment = process.env.NODE_ENV === 'development' ||
                        process.env.NEXT_PUBLIC_ADMIN_URL?.includes('localhost') ||
                        !process.env.NEXT_PUBLIC_ADMIN_URL

  if (isDevelopment) {
    console.log('⚠️ [Rate Limit] Skipping rate limit check in development mode')
    return false
  }

  // ... normal rate limit logic for production
}
```

**Previous Limit:** Max 3 OTP requests per hour per phone
**Current Limit:** Unlimited in development, 3/hour in production

---

### 4. **Fixed Error Page Redirect**

#### `auth.config.ts`

**Added error page configuration:**
```typescript
pages: {
  signIn: '/auth/signin',
  error: '/auth/signin', // Redirect to signin page instead of 404
}
```

**Why:** When authentication fails, NextAuth was trying to redirect to `/api/auth/error` which didn't exist (404). Now it redirects back to signin page.

---

## 🧪 How to Test

### 1. **Start Both Servers**

Terminal 1 (Admin Backend):
```bash
cd /stuff/Study/projects/kids/admin
pnpm dev
```

Terminal 2 (Frontend):
```bash
cd /stuff/Study/projects/kids/Kidstoysbangladesh.com
pnpm dev
```

### 2. **Open Browser Console**

- Open http://localhost:3000
- Open Developer Tools (F12)
- Go to Console tab

### 3. **Try Authentication Flow**

1. Click "Sign In" button
2. Choose "Sign Up" or "Login" tab
3. Enter phone number and other details (if signup)
4. Click "Create Account" or "Continue"
5. Wait for SMS (or check terminal for OTP code)
6. Enter the 6-digit OTP code
7. Click "Verify & Continue"

### 4. **Check Logs**

#### Browser Console (Frontend):
Look for logs with emojis:
```
🔍 [Dialog] Starting OTP verification
📝 [Dialog] Signup credentials: {...}
🔐 [Dialog] Calling signIn with provider: otp
📥 [Dialog] SignIn result: {...}
✅ [Dialog] SignIn successful! Redirecting to: /
```

#### Terminal (Frontend Next.js):
Look for NextAuth logs:
```
🔍 [NextAuth] Starting authorize with credentials: {...}
✅ [NextAuth] Credentials parsed successfully: {...}
📤 [NextAuth] Sending request to: http://localhost:3001/api/auth/customer/verify-otp
📥 [NextAuth] Response status: 200 OK
✅ [NextAuth] Returning user object: {...}
```

#### Terminal (Backend Admin):
Look for API logs:
```
🔍 [API] Received verify-otp request: {...}
✅ [API] Request validated successfully
🔐 [API] Calling verifyOTPAndCreateSession
📥 [API] verifyOTPAndCreateSession result: {...}
✅ [API] Returning success response: {...}
```

---

## 🔍 Debugging Common Issues

### Issue: "Too many OTP requests"
**Solution:** Rate limiting is now disabled for localhost. Just restart the servers.

### Issue: "Invalid or expired OTP code"
**Possible causes:**
1. Wrong OTP code entered
2. OTP expired (5 minutes)
3. Too many verification attempts (3 max)

**Check:** Look for the actual OTP code in backend terminal when SMS is sent.

### Issue: Still redirecting to error page
**Check:**
1. Is `redirect: false` in signIn call?
2. Check browser console for the actual error
3. Check terminal logs to see where it's failing

### Issue: No logs appearing
**Check:**
1. Servers are running with latest code
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache

---

## 📋 Files Modified

1. `/stuff/Study/projects/kids/Kidstoysbangladesh.com/auth.ts`
2. `/stuff/Study/projects/kids/Kidstoysbangladesh.com/auth.config.ts`
3. `/stuff/Study/projects/kids/Kidstoysbangladesh.com/components/auth/phone-auth-dialog.tsx`
4. `/stuff/Study/projects/kids/admin/app/api/auth/customer/verify-otp/route.ts`
5. `/stuff/Study/projects/kids/admin/lib/services/customer-auth-service.ts`

---

## 🎯 Expected Flow (Success Case)

```
1. User clicks "Sign In" → Dialog opens
2. User fills form → OTP sent via SMS ✅
3. SMS received → User enters code
4. User clicks "Verify & Continue"
   ↓
5. Frontend: signIn('otp', credentials) called
   ↓
6. NextAuth: authorize(credentials) called
   ↓
7. Backend: POST /api/auth/customer/verify-otp
   ↓
8. Backend: Validate OTP, create session
   ↓
9. Backend: Return { success: true, customer, sessionToken }
   ↓
10. NextAuth: Create JWT with user data
   ↓
11. NextAuth: Return { ok: true }
   ↓
12. Frontend: Close dialog, redirect to callbackUrl
   ↓
13. User logged in! ✅
```

---

## 🚨 Next Steps

1. **Test the flow** with the new logging
2. **Share the console logs** (both browser and terminal) if it still fails
3. **Check the exact error** being returned in the logs

The detailed logging will now show exactly where the authentication is failing!

---

**Last Updated:** 2025-10-31
