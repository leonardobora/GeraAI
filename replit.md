# Gerador de Playlists com IA

## Overview

This is a full-stack web application that generates personalized Spotify playlists using AI. Users can describe their desired playlist in Portuguese, and the AI will create a custom playlist directly in their Spotify account. The application features dual authentication (Replit Auth + Spotify OAuth), AI-powered music recommendations via Perplexity API, and complete playlist management functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Radix UI components with shadcn/ui for consistent design
- **Styling**: TailwindCSS with custom Spotify-themed color palette
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Session Management**: Express session with PostgreSQL storage
- **Authentication**: Passport.js with OpenID Connect for Replit Auth
- **API Integration**: Custom services for Spotify Web API and Perplexity AI

### Database Architecture
- **Primary Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Centralized schema definition with Zod integration
- **Migration**: Drizzle Kit for database schema management

## Key Components

### Authentication System
- **Dual Authentication**: Replit Auth for user management + Spotify OAuth for music access
- **Session Storage**: PostgreSQL-backed sessions with automatic cleanup
- **Token Management**: Automatic Spotify token refresh and secure storage

### AI Integration
- **Provider**: Perplexity API with LLaMA 3.1 Sonar model
- **Functionality**: Natural language processing for music recommendations
- **Prompt Engineering**: Specialized prompts for Brazilian music preferences
- **Discovery Levels**: Configurable exploration vs. familiar music balance

### Spotify Integration
- **OAuth Flow**: Complete Spotify authorization with scope management
- **Playlist Creation**: Automatic playlist creation in user's Spotify account
- **Track Search**: Intelligent track matching with fallback strategies
- **Preview Support**: In-app music previews when available

### Data Management
- **User Profiles**: Complete user data with Spotify integration status
- **Playlist Storage**: Local playlist metadata with Spotify synchronization
- **Track Management**: Detailed track information with success tracking
- **CRUD Operations**: Full create, read, update, delete functionality

## Data Flow

1. **User Authentication**: User logs in via Replit Auth, then connects Spotify account
2. **Playlist Generation**: User submits prompt → AI generates recommendations → Spotify API creates playlist
3. **Content Delivery**: React frontend fetches data via TanStack Query → Express API → PostgreSQL database
4. **Real-time Updates**: Optimistic updates with server synchronization for responsive UX

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Perplexity API**: AI-powered music recommendations
- **Spotify Web API**: Music catalog and playlist management
- **Replit Auth**: User authentication and session management

### Development Tools
- **Vite**: Fast build tool with HMR support
- **TypeScript**: Type safety across the entire stack
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Production bundling for server-side code

## Deployment Strategy

### Platform
- **Hosting**: Replit platform with integrated development environment
- **Port Configuration**: Application serves on port 5000
- **Environment**: Development and production modes with environment-specific configurations

### Build Process
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied automatically on deployment

### Security
- **Environment Variables**: Secure storage of API keys and database credentials
- **Session Security**: HTTP-only cookies with secure flags in production
- **CORS**: Configured for Replit domain restrictions

## Changelog

Changelog:
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.