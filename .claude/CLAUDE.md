# FelLaw Project - Claude Code Documentation

## Project Overview
FelLaw is a legal aid platform designed to connect clients seeking legal help with qualified lawyers. The platform features an urgent help workflow, case-specific intake forms, and lawyer matching capabilities.

## Architecture

### Backend (`/backend`)
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Key Features**:
  - User authentication and authorization
  - Case management system
  - Document upload handling
  - Lawyer-client matching

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + Radix UI components
- **Routing**: React Router v6
- **Key Pages**:
  - Urgent help workflow (UrgentSelect, UrgentAction, UrgentSummary)
  - Case intake forms (NewCase)
  - Lawyer finder (FindLawyer)

## Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks in React
- Keep components focused and single-responsibility
- Use proper error handling and validation

### File Organization
- Backend: Feature-based modules in `/backend/app/`
- Frontend: Page components in `/frontend/src/pages/`, reusable components in `/frontend/src/components/`

### Testing
- Write tests for critical business logic
- Test API endpoints thoroughly
- Ensure form validation works correctly

### Security
- Never commit `.env` files
- Validate all user inputs
- Use proper authentication/authorization
- Sanitize file uploads

## Current State
- Core urgent help workflow implemented
- Multiple case type intake forms created
- Simplified UI focusing on essential features
- Many unused components removed to streamline codebase

## Future Enhancements
- Enhanced lawyer matching algorithm
- Real-time chat functionality
- Document analysis features
- Mobile app support
