# GEHU Clubs Platform - AI Coding Guidelines

## Architecture Overview
Full-stack TypeScript application with React frontend and Express backend using MongoDB.

**Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + Wouter routing
**Backend**: Express + Node.js + TypeScript + Mongoose + Multer file uploads + express-session auth
**Database**: MongoDB with Mongoose ODM
**Key Files**: `client/src/App.tsx` (routing), `server/index.ts` (server setup), `server/routes.ts` (API), `server/storage.ts` (data layer)

## Development Workflow
- **Start dev server**: `npm run dev` (runs frontend + backend concurrently)
- **Frontend only**: `cd client && vite --host`
- **Backend only**: `npm run dev-backend` (tsx watch server/index.ts)
- **Build**: `npm run build` (builds client + server)
- **Production**: `npm start`
- **Database**: Auto-connects via `server/config/db.ts`, seeds sample data in dev mode

## Component Patterns
- **Routing**: Use wouter `<Switch>` and `<Route>` in `App.tsx`
- **Data Fetching**: TanStack Query hooks (e.g., `useQuery`, `useMutation`) in components
- **Forms**: React Hook Form + Zod validation (see `RegistrationForm.tsx`)
- **UI Components**: shadcn/ui from `client/src/components/ui/`
- **Styling**: Tailwind classes, dark mode via `ThemeProvider`
- **Auth**: Check `req.session.adminId` in backend, redirect unauthenticated users in frontend

## API Conventions
- **Auth routes**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- **Clubs**: `/api/clubs` (GET/POST), `/api/clubs/:id` (GET/PUT/DELETE)
- **Events**: `/api/events` (GET/POST), `/api/events/:id` (GET/PUT/DELETE)
- **File uploads**: POST to `/api/events` with `multer` middleware, files stored in `uploads/` directory
- **Response format**: JSON with `success/error` fields, data in response body

## Data Models
- **Admin**: `{id, username, password (bcrypt hash), clubId}`
- **Club**: `{id, name, description, category, memberCount, logoUrl?, createdAt}`
- **Event**: `{id, title, description, date, time, location, category, clubId, clubName, imageUrl?, createdAt}`
- **Student**: `{name, email, enrollment, branch, password}` (for future student auth)

## File Uploads
- Use `multer` with disk storage to `uploads/` directory
- Serve static files via `/uploads` route
- Ready for cloud migration (AWS S3/Cloudinary)

## Authentication Flow
- Session-based auth with `express-session` + `connect-mongo`
- Login sets `req.session.adminId`
- Protected routes use `requireAuth` middleware
- Default admin: username `admin`, password `admin123`

## Code Organization
- **Frontend pages**: `client/src/pages/` (e.g., `Home.tsx`, `Dashboard.tsx`)
- **Components**: `client/src/components/` (reusable UI)
- **Backend models**: `server/models/` (Mongoose schemas)
- **Shared types**: `shared/schema.ts` (TypeScript interfaces)
- **Utils**: `client/src/lib/` (queryClient, utils), `server/` (storage, routes)

## Common Patterns
- **Error handling**: Try/catch in API routes, return 500 with error message
- **Validation**: Zod schemas for form validation, Mongoose for DB
- **State management**: TanStack Query for server state, local component state for UI
- **Navigation**: `useLocation` from wouter for programmatic navigation
- **Theming**: CSS variables in `global.d.ts`, toggle via `ThemeProvider`

## Deployment Notes
- CORS configured for `localhost:5173` and production domain
- Session cookies secure in production
- Static files served from `dist/public/` in prod
- Environment variables: `MONGO_URI`, `SESSION_SECRET`, `PORT`</content>
<parameter name="filePath">d:/GEHU-clubs/.github/copilot-instructions.md