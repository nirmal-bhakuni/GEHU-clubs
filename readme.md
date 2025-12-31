# College Club Events Platform

## Overview
A modern, cloud-powered college club website that enables students to discover clubs and events while allowing club admins to manage their content through a secure dashboard. The platform features a modern, minimal design with dark mode support and smooth animations.

## Project Goals
- Provide students with an intuitive interface to browse clubs and events
- Enable club admins to create and manage events with photo uploads
- Implement secure authentication for admin access
- Support cloud-based file storage for event posters and photos
- Deliver a modern, responsive design with dark mode support

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TanStack Query, Wouter
- **Backend**: Express.js, Node.js
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Forms**: React Hook Form with Zod validation
- **File Uploads**: Multer (local storage, ready for cloud integration)
- **Authentication**: Express session with bcrypt password hashing
- **Database**: In-memory storage (MemStorage)

## Project Architecture

### Data Models (shared/schema.ts)
- **Admin**: User accounts for club administrators
- **Club**: College club information with categories and member counts
- **Event**: Events/bootcamps with details, dates, and images

### Backend Structure
- **Storage Layer**: In-memory storage implementing CRUD operations
- **Authentication**: Session-based auth with secure password hashing
- **API Routes**:
  - `/api/auth/*` - Login, logout, session management
  - `/api/clubs/*` - Club CRUD operations
  - `/api/events/*` - Event CRUD operations with file upload
  
### Frontend Pages
- **Home**: Hero section, featured events, and clubs
- **Clubs**: Searchable/filterable club directory
- **Events**: Searchable/filterable event listings
- **Login**: Admin authentication page
- **Dashboard**: Protected admin panel for event management

### Key Features
1. **Authentication System**
   - Session-based authentication with bcrypt
   - Protected admin routes
   - Default admin credentials: admin/admin123

2. **Event Management**
   - Create events with title, description, date, time, location
   - Upload event posters/photos (via multer)
   - Categorize events (Workshop, Bootcamp, Seminar, etc.)
   - Associate events with clubs

3. **Club Management**
   - Categorized club listings (Technology, Academic, Arts, etc.)
   - Club profiles with logos and member counts

4. **Search & Filter**
   - Real-time search across events and clubs
   - Category-based filtering
   - Responsive filter controls

## Design System (design_guidelines.md)
- **Typography**: Inter (headings), Plus Jakarta Sans (body)
- **Color Scheme**: Vibrant blue/purple accents on dark backgrounds
- **Dark Mode**: Full dark mode support with system preference detection
- **Components**: Consistent shadcn/ui components throughout
- **Interactions**: Subtle hover/active states with elevation effects

## Recent Changes
- 2025-10-14: Completed full-stack integration
  - Connected all frontend pages to backend APIs
  - Implemented authentication flow with login/logout
  - Added protected dashboard with event management
  - Created file upload system for event images
  - Fixed UI issues and integrated real data fetching

## File Upload Notes
Currently using Multer for local file storage. The system is designed to easily integrate cloud storage providers (AWS S3, Cloudinary, etc.) by updating the upload middleware in server/routes.ts.

## Authentication Flow
1. User navigates to /login
2. Enters credentials (validated against bcrypt hash)
3. Session created on successful login
4. Dashboard protected - redirects to login if not authenticated
5. Logout destroys session and redirects to login

## Default Credentials (Development Only)
⚠️ **IMPORTANT**: These credentials are for development/testing only
- Username: `admin`
- Password: `admin123`
- Assigned to: Tech Club

**Production Security Checklist:**
1. ❌ Change or remove default admin credentials
2. ❌ Implement proper admin provisioning (invite-based or super-admin)
3. ❌ Add rate limiting for login attempts
4. ❌ Implement CSRF protection
5. ❌ Rotate SESSION_SECRET to a secure random value
6. ❌ Enable HTTPS in production
7. ❌ Implement audit logging for admin actions

## Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t gehu-clubs .

# Run container
docker run -p 12346:12346 -e NODE_ENV=production gehu-clubs
```

### Docker Compose (Recommended)
```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables
Create a `.env` file with:
```env
NODE_ENV=production
PORT=12346
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_random_secret
```

### Server Requirements
- Node.js 18+
- MongoDB database
- 512MB RAM minimum
- 1GB storage for uploads

## Next Steps / Future Enhancements
- Cloud storage integration (AWS S3, Cloudinary)
- Real PostgreSQL database setup
- User registration system
- Event RSVP functionality
- Email notifications
- Advanced analytics dashboard
