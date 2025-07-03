# PseudoCode to MIT App Inventor 2 Converter

## Overview

This is a web application that converts pseudocode into MIT App Inventor 2 AIA (App Inventor Archive) files. The application allows educators and developers to write simple pseudocode describing mobile app behavior and automatically generate MIT App Inventor 2 project files that can be imported directly into the MIT App Inventor development environment.

The application features a code editor for writing pseudocode, real-time parsing and validation, and the ability to download the generated AIA files containing the converted App Inventor components and event handlers.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components via shadcn/ui
- **Code Editor**: Monaco Editor integration for syntax highlighting and code editing
- **State Management**: React hooks and TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Development**: tsx for TypeScript execution
- **Production**: esbuild for bundling

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with Zod schema validation
- **Connection**: Neon serverless PostgreSQL driver
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Frontend Components
1. **Converter Page** (`client/src/pages/converter.tsx`)
   - Main interface for pseudocode input and AIA generation
   - Monaco Editor integration for code editing
   - Real-time parsing and error display
   - File download functionality

2. **Monaco Editor** (`client/src/components/ui/monaco-editor.tsx`)
   - Custom wrapper around Monaco Editor
   - TypeScript integration and syntax highlighting
   - Imperative API for programmatic control

3. **UI Components** (`client/src/components/ui/`)
   - Complete shadcn/ui component library
   - Consistent design system with Tailwind CSS
   - Accessible components using Radix UI primitives

### Backend Components
1. **Express Server** (`server/index.ts`)
   - Development and production server setup
   - Vite integration for development
   - Static file serving for production
   - Request logging middleware

2. **Storage Interface** (`server/storage.ts`)
   - Abstract storage interface for CRUD operations
   - In-memory implementation for development
   - Database-ready architecture for production scaling

3. **Routes** (`server/routes.ts`)
   - API route registration
   - HTTP server creation
   - Placeholder for application-specific endpoints

### Core Logic Components
1. **Pseudo Parser** (`client/src/lib/pseudo-parser.ts`)
   - Parses pseudocode syntax into structured data
   - Supports "When [Component].[Event]" syntax
   - Validates component references and event handlers
   - Error reporting with line numbers

2. **AIA Generator** (`client/src/lib/aia-generator.ts`)
   - Converts parsed pseudocode to MIT App Inventor 2 format
   - Generates ZIP files containing project structure
   - Maps components to App Inventor component types
   - Handles color conversion and property mapping

## Data Flow

1. **User Input**: Users write pseudocode in the Monaco Editor
2. **Real-time Parsing**: Code is parsed as the user types, with immediate feedback
3. **Validation**: Parser identifies syntax errors and component issues
4. **Conversion**: Valid pseudocode is converted to MIT App Inventor 2 format
5. **File Generation**: AIA files are generated as downloadable ZIP archives
6. **Download**: Users can download the generated AIA files for import into MIT App Inventor

### Pseudocode Syntax
The application supports a simple pseudocode syntax:
```
// Comments are supported
When Button1.Click
    Set Screen1.BackgroundColor to Red
    Set Label1.Text to "Hello World"
```

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router (wouter)
- **TypeScript**: Full TypeScript support across frontend and backend
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **UI Components**: Radix UI primitives, Lucide React icons
- **Database**: Drizzle ORM, Neon serverless, PostgreSQL drivers
- **Development**: Vite, tsx, esbuild
- **File Processing**: JSZip for AIA file generation

### Development Tools
- **Replit Integration**: Replit-specific plugins for development environment
- **Code Quality**: TypeScript compiler, ESLint configuration ready
- **Build System**: Vite for frontend, esbuild for backend bundling

## Deployment Strategy

### Development
- Frontend: Vite dev server with HMR
- Backend: tsx with auto-reload
- Database: Development database connection via DATABASE_URL

### Production
- Frontend: Static build via `vite build`
- Backend: Bundled via esbuild with external dependencies
- Database: Production PostgreSQL via Neon serverless
- Deployment: Single process serving both API and static files

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment setting (development/production)
- **Build Commands**: Separate build steps for frontend and backend

## Recent Changes

- **July 02, 2025**: Added Windows environment support
  - Created `start.bat` file for one-click startup on Windows
  - Added comprehensive Windows setup guide (WINDOWS_SETUP.md)
  - Batch file automatically checks Node.js and installs dependencies
  - Enhanced user experience for Windows users with error handling

- **July 02, 2025**: Fixed MIT App Inventor 2 compatibility issues
  - Updated AIA file generator to use correct XML format for blocks
  - Fixed project.properties file structure
  - Corrected form file format with proper component definitions
  - Added proper MIT App Inventor metadata and directory structure
  - Resolved JavaScript error "Cannot read properties of undefined (reading 'gk')"

## Changelog

Changelog:
- July 02, 2025. Initial setup
- July 02, 2025. Fixed AIA generation for MIT App Inventor 2 compatibility

## User Preferences

Preferred communication style: Simple, everyday language.