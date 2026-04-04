# FelLaw - Legal Aid Platform

**Legal Power, Simplified** | **Rechtsmacht, Vereinfacht**

A comprehensive legal aid platform connecting clients with qualified legal professionals. FelLaw provides urgent legal help, case-specific intake forms, lawyer matching, and document management capabilities.

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- At least 4GB RAM available
- Existing PostgreSQL and Adminer containers (for shared database setup)

### Start the Application

1. **Setup Environment**
   ```bash
   cp .env.example .env
   ```

2. **Start All Services**
   ```bash
   docker-compose up -d
   ```

3. **Access the Application**
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **Database Management (Adminer)**: http://localhost:8080

4. **Stop Services**
   ```bash
   docker-compose down
   ```

---

## 📁 Project Structure

```
fellaw/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── models/      # Database models
│   │   ├── core/        # Core configuration
│   │   └── main.py      # Application entry point
│   ├── alembic/         # Database migrations
│   ├── uploads/         # File uploads
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable UI components
│   │   ├── contexts/   # React contexts (Auth, Language)
│   │   ├── lib/        # Utilities & translations
│   │   └── index.css   # Design system (Tailwind)
│   ├── public/         # Static assets
│   ├── dist/           # Build output
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml   # Docker orchestration
├── .env.example        # Environment variables template
└── README.md           # This file
---
```
## 🏗️ Architecture

FelLaw uses a shared PostgreSQL database instance for efficient resource management:

```mermaid
flowchart LR
    U[Users] --> F[Frontend React + TypeScript + Vite]
    F --> B[Backend API FastAPI + SQLAlchemy]
    B --> D[(PostgreSQL)]
    A[Adminer] --> D

    subgraph Repo [fellaw repository]
        F
        B
        D
        A
        C[Docker Compose]
    end

    C --> F
    C --> B
    C --> D
    C --> A
```

```mermaid
flowchart TD
    R[fellaw]

    R --> FE[frontend/]
    R --> BE[backend/]
    R --> ENV[.env.example]
    R --> DC[docker-compose.yml]
    R --> RD[README.md]

    FE --> FE1[src/pages]
    FE --> FE2[src/components]
    FE --> FE3[src/contexts]
    FE --> FE4[src/lib]
    FE --> FE5[index.css]
    FE --> FE6[public/]
    FE --> FE7[package.json]

    BE --> BE1[app/api]
    BE --> BE2[app/models]
    BE --> BE3[app/core]
    BE --> BE4[main.py]
    BE --> BE5[alembic/]
    BE --> BE6[uploads/]
    BE --> BE7[requirements.txt]

    FE -. UI requests .-> API[FastAPI backend]
    API -. ORM auth business logic .-> DB[(PostgreSQL)]
    ADM[Adminer :8080] -. DB admin .-> DB
```

---

## ✨ Features
### Client-Facing Features
- **Urgent Legal Help Workflow**: Crisis-driven intake with immediate routing
- **Case-Specific Intake Forms**: Tailored forms for 6 different legal areas
  - Rent Increase Disputes
  - Employment Termination
  - Contract Disputes
  - Family Law (Divorce/Custody)
  - Debt Collection
  - Consumer Protection
- **Legal Options Assessment**: AI-powered case analysis with three pathways:
  - Self-Service Legal Tools
  - Lawyer Consultation
  - Full Legal Representation
- **Lawyer Matching**: Intelligent matching based on case type and expertise
- **Document Management**: Secure upload and storage
- **Multi-language Support**: English and German translations
- **Dark Mode**: Full dark theme support

### Lawyer-Facing Features
- **Dedicated Dashboard**: Separate lawyer portal
- **Case Management**: View and manage client cases
- **Consultation Scheduling**: Integrated booking system

### Technical Features
- **Responsive Design**: Mobile-first, works on all devices
- **Accessibility**: WCAG AA compliant
- **Real-time Updates**: WebSocket support for notifications
- **Secure Authentication**: JWT-based auth with role-based access
- **File Upload**: Support for documents and evidence

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Radix UI (shadcn/ui)
- **Routing**: React Router v6
- **State Management**: React Context API
- **Internationalization**: Custom i18n system with useLanguage hook

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Authentication**: JWT tokens
- **Async**: Python asyncio/await
- **Validation**: Pydantic models

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (frontend)
- **ASGI Server**: Uvicorn (backend)
- **Database Admin**: Adminer

---

## 💻 Local Development (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database (update .env first)
alembic upgrade head

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Access at http://localhost:5173
```

---

## 🐳 Docker Setup Details

### Network Configuration

All services communicate via the `psql_default` bridge network:
- `postgres` - Shared PostgreSQL instance
- `adminer` - Database management UI
- `fellaw-backend` - FastAPI application  
- `fellaw-frontend` - React application

### Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and adjust as needed:

```env
# Backend
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/fellaw
SECRET_KEY=your-secret-key-here
DEBUG=true

# Frontend
VITE_API_URL=http://localhost:8000

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=80
```

### Database Management

#### Using Adminer

Access Adminer at http://localhost:8080:

- **System**: PostgreSQL
- **Server**: postgres
- **Username**: postgres
- **Password**: postgres
- **Database**: fellaw

#### Direct Database Access

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d fellaw

# List tables
\dt

# Exit
\q
```

---

## 🔧 Common Tasks

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Database logs
docker logs postgres -f
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild After Code Changes

```bash
# Rebuild and restart (no cache)
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or rebuild specific service
docker-compose build --no-cache frontend
docker-compose up -d
```

### Database Migrations

```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback one migration
docker-compose exec backend alembic downgrade -1
```

### Database Backup & Restore

```bash
# Backup
docker exec postgres pg_dump -U postgres fellaw > fellaw_backup.sql

# Restore
docker exec -i postgres psql -U postgres fellaw < fellaw_backup.sql
```

### Update Dependencies

**Frontend:**
```bash
cd frontend
npm update
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt --upgrade
```

---

## 🎨 Design System

### Color Palette

The application uses a semantic color system with light/dark mode support:

```jsx
// Primary Actions (Blue)
className="bg-primary text-primary-foreground"

// Success Messages (Green)
className="bg-success text-success-foreground"

// Warnings (Yellow)
className="bg-warning text-warning-foreground"

// Errors/Emergency (Red)
className="bg-destructive text-destructive-foreground"

// Accent (Purple)
className="bg-accent text-accent-foreground"

// Cards
className="bg-card text-card-foreground border-2"

// Muted/Secondary
className="text-muted-foreground"
```

### Common Component Patterns

```jsx
// Card Component
<Card className="bg-card border-2 hover:shadow-xl hover:border-primary transition-all">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Button with Icon
<Button className="bg-primary text-primary-foreground">
  <Icon className="h-4 w-4 mr-2" />
  Button Text
</Button>

// Alert Banner
<Alert className="border-2 border-warning bg-warning/10">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning Title</AlertTitle>
  <AlertDescription>Warning message</AlertDescription>
</Alert>
```

---

## 🔒 Security

### Authentication

- JWT-based authentication
- Separate user and lawyer login endpoints
- Token stored in localStorage
- Protected routes with authentication middleware

### Data Protection

- Input validation using Pydantic
- SQL injection protection via SQLAlchemy
- XSS protection in React
- CORS configuration
- Secure file upload handling

### Best Practices

- Never commit `.env` files
- Use strong SECRET_KEY in production
- Enable HTTPS in production
- Regular dependency updates
- Database backups

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

1. **Update Environment Variables**
   ```env
   ENVIRONMENT=production
   DEBUG=false
   SECRET_KEY=<strong-random-key>
   DATABASE_URL=<production-db-url>
   CORS_ORIGINS=["https://yourdomain.com"]
   ```

2. **Build Production Images**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
   ```

3. **Database Migration**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

### Deployment Considerations

- Use reverse proxy (nginx, Traefik) for SSL/TLS
- Configure proper CORS origins
- Use external managed database for persistence
- Set up monitoring and logging
- Configure automated backups
- Use Docker Swarm or Kubernetes for orchestration
- Implement rate limiting
- Set up CDN for static assets

---

## 🐛 Troubleshooting

### Port Already in Use

Update ports in `.env`:

```env
BACKEND_PORT=8001
FRONTEND_PORT=8080
POSTGRES_PORT=5433
```

### Database Connection Issues

```bash
# Check if PostgreSQL is healthy
docker-compose ps
docker-compose logs postgres

# Verify database exists
docker exec -it postgres psql -U postgres -c "\l"
```

### Frontend Not Loading

- Clear browser cache with `Ctrl + F5`
- Check if backend is running: http://localhost:8000/docs
- Check logs: `docker-compose logs frontend`
- Verify environment variables

### Permission Issues

```bash
# Linux/Mac
sudo chown -R $USER:$USER ./backend ./frontend

# Windows
# Run Docker Desktop as Administrator
```

### Reset Everything (WARNING: Deletes all data)

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

### Hot Reload Not Working

For frontend development with hot reload:

```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:5173
```

Backend hot reload is enabled by default when running via Docker Compose.

---

## 📚 API Documentation

When the backend is running, access interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/lawyer/login` - Lawyer login

#### Cases
- `GET /api/v1/cases` - List user's cases
- `POST /api/v1/cases` - Create new case
- `GET /api/v1/cases/{id}` - Get case details
- `PUT /api/v1/cases/{id}` - Update case

#### Lawyers
- `GET /api/v1/lawyers` - Search lawyers
- `GET /api/v1/lawyers/{id}` - Lawyer profile

---

## 🌍 Internationalization

The application supports multiple languages:

- **English** (default)
- **German** (Deutsch)

Language can be switched using the globe icon in the navigation bar. The preference is saved to localStorage.

### Adding New Translations

Edit `frontend/src/lib/translations.ts`:

```typescript
export const translations = {
  en: {
    yourKey: "English text",
    // ...
  },
  de: {
    yourKey: "Deutscher Text",
    // ...
  }
};
```

Use in components:

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

const MyComponent = () => {
  const { t } = useLanguage();
  return <h1>{t('yourKey')}</h1>;
};
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm run test
```

---

## 📄 License

This project is part of a thesis on Legal Aid platforms.

---

## 👥 Contributing

This is a thesis project. For questions or collaboration inquiries, please contact the project maintainer.

---

## 📞 Support

### For Development Issues
- Check the logs: `docker-compose logs -f`
- Review this documentation
- Check API documentation at http://localhost:8000/docs

### For Production Issues
- Review deployment checklist
- Check production logs
- Verify environment variables
- Ensure database connectivity

---

**Remember to clear browser cache (`Ctrl + F5`) after rebuilding the frontend to see changes!**
