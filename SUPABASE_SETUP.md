# TrailZap - Supabase PostgreSQL Migration Guide

This guide will help you migrate your TrailZap app from MongoDB to PostgreSQL using Supabase.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `trailzap-fitness`
   - Database Password: Choose a strong password
   - Region: Select closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your Connection Details

Once your project is ready:

1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format)
3. Go to **Settings** → **API**
4. Copy your **Project URL**
5. Copy your **anon/public** key
6. Copy your **service_role** key (keep this secret!)

## Step 3: Set Up Your Environment Variables

1. Copy `.env.example` to `.env`
2. Replace the placeholder values with your Supabase details:

```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# Use a strong, random secret in production
JWT_SECRET=your_jwt_secret_here

# Expo (client)
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

## Step 4: Run Database Migrations

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `server/migrations/001_create_tables.sql`
4. Click **Run** to execute the migration
5. Verify that all tables were created in the **Table Editor**

## Step 5: Install Dependencies

Run the following command to install the new PostgreSQL dependencies:

```bash
npm install
```

## Step 6: Test the Migration

1. Start your server:
   ```bash
   npm run server
   ```

2. You should see:
   ```
   ✅ Connected to PostgreSQL database at: [timestamp]
   🚀 TrailZap server running on port 3000
   ```

3. Test the health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

## Step 7: Update Your Client Code (Optional)

If you want to use Supabase features on the client side (like real-time subscriptions), you can initialize the Supabase client in your React Native app:

```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Key Changes Made

### Database Schema
- Migrated from MongoDB collections to PostgreSQL tables
- Used UUIDs instead of ObjectIds
- Normalized relationships with foreign keys
- Added proper indexes for performance

### Models
- Replaced Mongoose schemas with PostgreSQL query classes
- Maintained the same API interface for compatibility
- Added proper error handling and validation

### Server Configuration
- Removed MongoDB/Mongoose dependencies
- Added PostgreSQL connection pooling
- Updated environment variables

## Benefits of PostgreSQL + Supabase

1. **ACID Compliance**: Better data consistency and reliability
2. **SQL Queries**: More powerful and flexible querying
3. **Real-time Features**: Built-in real-time subscriptions
4. **Authentication**: Integrated auth system (optional)
5. **Storage**: File storage capabilities
6. **Edge Functions**: Serverless functions at the edge
7. **Dashboard**: Beautiful admin interface
8. **Backup & Recovery**: Automated backups

## Troubleshooting

### Connection Issues
- Verify your DATABASE_URL is correct
- Check that your Supabase project is active
- Ensure your IP is whitelisted (Supabase allows all by default)

### Migration Errors
- Make sure you're using the SQL Editor in Supabase dashboard
- Check for syntax errors in the migration file
- Verify all extensions are enabled

### Runtime Errors
- Check server logs for detailed error messages
- Verify environment variables are loaded correctly
- Test database connection with the health endpoint

## Next Steps

1. Test all API endpoints to ensure they work correctly
2. Migrate any existing data from MongoDB (if needed)
3. Update your deployment configuration
4. Consider using Supabase Auth for user authentication
5. Explore real-time features for live activity tracking

Your TrailZap app is now running on PostgreSQL with Supabase! 🎉
