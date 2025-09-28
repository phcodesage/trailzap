# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Client (React Native/Expo)
- `npm run dev` - Start Expo development server
- `npm run android` - Run on Android device/emulator (requires Android setup)
- `npm run ios` - Run on iOS device/simulator (macOS only)
- `npm run build:web` - Build web version
- `npm run lint` - Run Expo linter

### Server (Node.js/Express)
- `npm run server` - Start development server with nodemon (auto-restart)
- `npm run server:prod` - Start production server

### Setup Commands
- `npm install` - Install all dependencies
- Copy `.env.example` to `.env` and configure environment variables
- Run database migration from `migrations/001_create_tables.sql` in Supabase dashboard

## Architecture Overview

### Technology Stack
- **Frontend**: React Native with Expo Router for navigation
- **Backend**: Node.js with Express.js API server
- **Database**: PostgreSQL via Supabase (migrated from MongoDB)
- **Authentication**: Supabase Auth with custom contexts
- **State Management**: React Context (AuthContext, ThemeContext)
- **UI Framework**: React Native Paper + Lucide React Native icons
- **Location Services**: Expo Location for GPS tracking

### Project Structure

#### Client Architecture (Root Level)
- `app/` - Expo Router file-based routing
  - `(auth)/` - Authentication screens (welcome, login, signup)
  - `(tabs)/` - Main app tabs (home, track, feed, profile)
  - `_layout.tsx` - Root layout with providers
- `components/` - Reusable UI components
- `contexts/` - React Context providers (Auth, Theme)
- `services/` - API clients and external service integrations
- `types/` - TypeScript type definitions
- `utils/` - Utility functions and helpers
- `constants/` - App constants (Colors, Spacing)
- `hooks/` - Custom React hooks

#### Server Architecture
- `server/index.js` - Express server entry point with middleware setup
- `server/routes/` - API route handlers (auth, users, activities, social)
- `migrations/` - PostgreSQL database schema migrations

### Key Architectural Patterns

#### Authentication Flow
- Uses Supabase Auth for user management
- `AuthContext` provides app-wide authentication state
- Protected routes redirect to authentication screens if not logged in
- Token management with AsyncStorage for persistence

#### Database Design
- PostgreSQL with UUID primary keys
- Relational design with proper foreign key constraints
- JSON columns for flexible data (routes, weather, equipment)
- Comprehensive indexing for performance

#### Navigation Structure
- File-based routing with Expo Router
- Two main route groups: `(auth)` and `(tabs)`
- Bottom tab navigation for main app functionality
- Automatic redirects based on authentication state

#### Location Tracking
- Expo Location for GPS coordinate collection
- Routes stored as GeoPoint arrays with timestamps
- Location permissions handled for both iOS and Android

### Environment Configuration

#### Required Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_API_URL` - Backend API base URL
- `DATABASE_URL` - PostgreSQL connection string (server)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (server)
- `JWT_SECRET` - JWT signing secret (server)

#### Development Setup Notes
- Client runs on Expo development server (default port 8081)
- Server runs on port 3000 (configurable via PORT env var)
- CORS configured for localhost origins in development
- Supabase handles database hosting and authentication

### Data Models

#### Core Entity Relationships
- `User` -> has many `Activity` records
- `Activity` -> has many `Comment` and `ActivityLike` records  
- `User` -> many-to-many relationship via `UserFollow` table
- Route data stored as JSONB with GeoPoint arrays

#### Activity Tracking
- GPS coordinates collected during activities
- Calculated metrics: distance, pace, elevation gain
- Support for multiple activity types (running, cycling, walking, hiking)
- Weather and equipment data stored as JSON

### Development Guidelines

#### File Conventions
- Use TypeScript for all new code
- Components use PascalCase naming
- Hooks use camelCase with `use` prefix
- Context files end with `Context.tsx`
- Type definitions in dedicated `types/` directory

#### API Integration
- Client uses Supabase SDK for auth and real-time features
- RESTful API endpoints for activity and social features
- Error handling with user-friendly messages
- Rate limiting and security middleware on server

#### Theming System
- `ThemeContext` provides light/dark/auto theme modes
- Color constants defined in `constants/Colors.ts`
- Theme preference persisted in AsyncStorage
- Automatic system theme detection

## Database Migration Notes

This project was recently migrated from MongoDB to PostgreSQL/Supabase. Key changes:
- ObjectIds replaced with UUIDs
- Document structure normalized into relational tables
- Geospatial data handling updated for PostGIS compatibility
- Authentication moved to Supabase Auth from custom JWT implementation

## Platform-Specific Considerations

### Android
- Location permissions configured in `app.json`
- Uses Android-specific navigation bar styling
- Setup script available: `setup-android.ps1`

### iOS  
- Location usage descriptions in Info.plist configuration
- Supports iPad layouts via `supportsTablet: true`

### Web
- Metro bundler configured for web builds
- Web-specific polyfills included for React Native components