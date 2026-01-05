# Authentication Fix - University Admin vs Club Admin

## Problem
The university admin login was accepting club admin credentials, allowing club admins to log in to the university admin dashboard.

## Root Cause
- Both university and club admins were using the same `/api/auth/login` endpoint
- There was no validation to check if the logging-in admin was a university admin or club admin
- The `clubId` field wasn't being checked - null for university admins, and a UUID for club admins

## Solution
Created separate login endpoints with proper validation:

### Backend Changes (server/routes.ts)

1. **`POST /api/auth/login`** (University Admin Only)
   - Validates that `admin.clubId === null`
   - Returns `403 Forbidden` if a club admin tries to use this endpoint
   - Error: "Club admins must use the club admin login"

2. **`POST /api/auth/club-login`** (Club Admin Only)
   - Validates that `admin.clubId !== null`
   - Returns `403 Forbidden` if a university admin tries to use this endpoint
   - Error: "University admins must use the university admin login"

### Frontend Changes

1. **Login.tsx** (University Admin Login)
   - Uses `/api/auth/login` endpoint
   - Checks that returned `admin.clubId` is null
   - Shows error if club admin credentials are used

2. **ClubAdminLogin.tsx** (Club Admin Login)
   - Uses `/api/auth/club-login` endpoint (changed from `/api/auth/login`)
   - Removed "admin" from static admins (university admin)
   - Only accepts credentials with a clubId

## Security Improvements
- ✅ University admins cannot access club admin dashboard
- ✅ Club admins cannot access university admin dashboard
- ✅ Proper error messages guide users to the correct login page
- ✅ Server-side validation prevents unauthorized access

## Admin Types
- **University Admin**: username="admin", clubId=null
- **Club Admins**: 
  - aryavrat_admin (clubId: 484c2b24-6193-42c1-879b-185457a9598f)
  - rangmanch_admin (clubId: ff82f1ca-01be-4bff-b0f5-8a1e44dcf951)
  - ieee_admin (clubId: f54a2526-787b-4de5-9582-0a42f4aaa61b)
  - papertech_admin (clubId: 181d3e7d-d6cd-4f40-b712-7182fcd77154)
  - entrepreneurship_admin (clubId: cc71501e-1525-4e3b-959c-f3874db96396)
  - codehunters_admin (clubId: 485300f0-e4cc-4116-aa49-d60dd19070d8)

## Testing
Test scenarios have been validated:
1. University admin can log in with their credentials → /dashboard ✅
2. University admin cannot use club login endpoint → 403 Error ✅
3. Club admin can log in with their credentials → /club-admin ✅
4. Club admin cannot use university login endpoint → 403 Error ✅
