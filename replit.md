# 3PL Dashboard Application

## Overview

This is a full-stack web application designed for managing and monitoring Key Performance Indicators (KPIs) in a Third-Party Logistics (3PL) environment. Its main purpose is to provide real-time dashboard capabilities, offering role-based access for administrators and clients to view performance metrics, receive timely alerts, and generate comprehensive reports. The project aims to enhance operational visibility and efficiency within 3PL operations.

## User Preferences

Preferred communication style: Simple, everyday language.
Project preference: Keep KPI descriptions visible by default with option to collapse (user requested to maintain descriptions).
Development approach: Systematic indicator-by-indicator UX improvements with user confirmation at each step.
UI preferences: Clean interfaces without unnecessary support messages or debug elements.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS with shadcn/ui component library, using Radix UI primitives
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Authentication**: JWT-based with bcrypt password hashing
- **Email Service**: Nodemailer for alert notifications

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Migration Tool**: Drizzle Kit
- **Schema**: Shared TypeScript types between frontend and backend

### Core Features
- **Authentication**: JWT token-based authentication with role-based access (admin, client).
- **KPI Management**: Real-time monitoring of 10 configurable KPIs (e.g., DOH, DAMAGES, IRA, OTD, PICKING) with status tracking (good, warning, critical) and historical trend analysis.
- **Alert System**: Automated threshold-based alert generation with email notifications for critical KPI breaches.
- **Dashboard Features**: Interactive KPI cards with drill-down capabilities, real-time data updates, filtering options, and export functionality.
- **User Management**: Comprehensive CRUD operations for user administration with role-based access control.
- **Report Export**: Functionality to export detailed reports in CSV/Excel format.
- **Responsive Design**: Optimized for both mobile and desktop devices.
- **UI/UX Decisions**: Emphasis on clean interfaces, intuitive navigation, consistent badge styling, contextual alert messages, and enhanced trend charts with gradients and target-based color coding. Specific UX improvements include detailed views for each KPI with SKU-level breakdowns, timeline visualizations, and performance tables.

## External Dependencies

- **Database**: `@neondatabase/serverless`
- **ORM**: `drizzle-orm`
- **UI Components**: `radix-ui` (underlying shadcn/ui)
- **Charts**: `recharts`
- **Authentication**: `jsonwebtoken`, `bcryptjs`
- **Email**: `nodemailer`
- **Development Tools**: TypeScript, ESBuild, Tailwind CSS, PostCSS