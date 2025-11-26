# ⚡ AtalJudge Backend

> RESTful API for a modern online judge platform, built with TypeScript, Express, and PostgreSQL.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-black?style=flat&logo=express)](https://expressjs.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-red?style=flat&logo=typeorm)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?style=flat&logo=postgresql)](https://www.postgresql.org/)

## ✨ Features

- 🔐 **JWT Authentication** - Secure access & refresh tokens
- 👥 **Role-Based Access** - Student, Assistant, Professor
- 📝 **Question Management** - Local test case execution
- 🎯 **Code Judging** - Judge0 multi-language support
- 📊 **Submission Tracking** - Real-time results
- 🏫 **Class System** - Organize students and assignments
- ️🌐 **IP Whitelisting** - Restrict access for exams
-  **Email Service** - Password reset & notifications

## 🚀 Tech Stack

- **[Node.js 20](https://nodejs.org/)** & **[TypeScript 5.3](https://www.typescriptlang.org/)** - Runtime & type safety
- **[Express 4.18](https://expressjs.com/)** - Web framework
- **[PostgreSQL 14+](https://www.postgresql.org/)** & **[TypeORM 0.3](https://typeorm.io/)** - Database & ORM
- **[Judge0](https://judge0.com/)** - Code execution engine
- **[class-validator](https://github.com/typestack/class-validator)** - DTO validation

## 📁 Project Structure

```
src/
├── app.ts                # Express app setup
├── server.ts             # Entry point
├── config/               # Configuration & DI
│   ├── database.ts
│   ├── di.ts
│   └── environment.ts
├── controllers/          # HTTP handlers (11)
├── services/             # Business logic (16)
├── repositories/         # Data access (15)
├── models/               # TypeORM entities (18)
├── dtos/                 # Data validation
├── middlewares/          # Request processing
├── enums/                # Type enumerations
├── migrations/           # Database migrations (11)
└── utils/                # Helper functions
```

## 🏗️ Architecture

```
Controllers → Services → Repositories → Database
```

- **Controllers** - HTTP logic, routing
- **Services** - Business logic
- **Repositories** - Data access
- **DTOs** - Validated input/output
- **Middleware** - Auth, validation, errors

## 🚦 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Judge0 instance (optional)

### Setup

```bash
# Clone repository
git clone https://github.com/elipcs/ataljudge-backend.git
cd ataljudge-backend

# Install dependencies
npm install

# Configure environment
# Create .env file with your settings

# Run migrations
npm run migration:run

# Start development server
npm run dev
```

Open [http://localhost:3333](http://localhost:3333)

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run migration:generate` | Generate migration |
| `npm run migration:run` | Run migrations |
| `npm run migration:revert` | Revert last migration |
| `npm test` | Run tests |

##  User Roles

- **Student** - Submit solutions, view grades
- **Assistant** - Help manage classes, grade students  
- **Professor** - Full access, create questions/classes

## � Key Features

### TypeORM Entities
```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  email: string;
}
```

### DTO Validation
```typescript
export class CreateQuestionDto {
  @IsString()
  @Length(1, 200)
  title: string;
}
```

### Dependency Injection
```typescript
const authService = container.getAuthService();
```

---

**Built with ❤️ for education**

