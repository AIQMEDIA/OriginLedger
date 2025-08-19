# ChainTrack - Supply Chain Blockchain Platform

## Overview

ChainTrack is a comprehensive supply chain blockchain platform that enables tracking of assets, management of participants, and ensures transparency across the entire supply chain network. The application provides a simple but functional blockchain implementation for tracking assets through various stages of the supply chain, from manufacturing to delivery.

The platform features a React-based frontend with a TypeScript Express backend, utilizing in-memory storage for blockchain data with the capability to upgrade to PostgreSQL using Drizzle ORM. The system supports participant management across different roles (manufacturers, shippers, retailers), asset tracking with metadata support, and comprehensive event logging with blockchain integrity verification.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript, implementing a modern component-based architecture:
- **UI Framework**: React with Vite for development and building
- **Styling**: Tailwind CSS with Shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Component Structure**: Modular component organization with separate pages, layouts, and UI components

### Backend Architecture
The backend follows a RESTful API design pattern:
- **Runtime**: Node.js with TypeScript Express server
- **API Structure**: RESTful endpoints for participant registration, event tracking, and blockchain operations
- **Storage Layer**: Abstracted storage interface with in-memory implementation, designed for easy database integration
- **Blockchain Logic**: Custom blockchain implementation with block creation, validation, and chain integrity verification
- **Development Setup**: Vite middleware integration for seamless development experience

### Data Storage Solutions
The application uses a flexible storage architecture:
- **Current Implementation**: In-memory storage using Maps for rapid prototyping and development
- **Database Ready**: Drizzle ORM configuration for PostgreSQL with complete schema definitions
- **Schema Design**: Normalized database structure with tables for blocks, participants, assets, and events
- **Migration Support**: Drizzle Kit for database migrations and schema management

### Core Business Logic
The platform implements a simplified blockchain for supply chain tracking:
- **Block Structure**: Sequential blocks containing supply chain event data with cryptographic hashing
- **Participant Management**: Role-based system supporting manufacturers, shippers, retailers, and other stakeholders
- **Asset Lifecycle**: Complete asset tracking from creation through delivery with status updates
- **Event Recording**: Immutable event logging with metadata support for detailed supply chain information

### User Interface Design
The frontend provides an intuitive dashboard-driven experience:
- **Dashboard**: Real-time statistics and recent activity overview
- **Blockchain Explorer**: Interactive visualization of the blockchain with block details
- **Asset Management**: Search and filter capabilities for asset tracking
- **Participant Portal**: User registration and management interface
- **Event Creation**: Form-based event logging with templates for common operations

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18 with TypeScript support
- **UI Components**: Radix UI primitives with Shadcn/ui component library
- **Styling**: Tailwind CSS for utility-first styling
- **Data Fetching**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Hookform Resolvers for Zod integration
- **Validation**: Zod for runtime type checking and validation
- **Date Handling**: date-fns for date formatting and manipulation

### Backend Dependencies
- **Web Framework**: Express.js for REST API development
- **Database ORM**: Drizzle ORM with PostgreSQL dialect support
- **Development Tools**: tsx for TypeScript execution, esbuild for production builds
- **Database Provider**: Neon Database serverless PostgreSQL (configured but not yet active)

### Development Tools
- **Build System**: Vite for frontend bundling and development server
- **TypeScript**: Full TypeScript support across frontend and backend
- **Code Quality**: ESLint and TypeScript compiler for code quality assurance
- **Database Management**: Drizzle Kit for schema management and migrations

### Third-Party Services
- **Database**: Neon PostgreSQL (configured via DATABASE_URL environment variable)
- **Development Environment**: Replit-specific plugins for development experience
- **Font Loading**: Google Fonts (Inter) for typography