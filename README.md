# Notification API

A Node.js API for notification workflows, built with Express, RabbitMQ, MySQL, and Prisma.

## Features

- Express 5.x API server
- RabbitMQ integration for messaging
- MySQL development database
- Prisma ORM
- TypeScript support
- Health check endpoint
- Error handling middleware

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (pre-installed in dev container)
- npm (pre-installed in dev container)

### Development Setup

1. **Clone the repository**

   ```sh
   git clone <repo-url>
   cd ticket-processing-api
   ```

2. **Start the dev container**  
   Open in VS Code and use "Reopen in Container" (if not already in the dev container).

3. **Start services**

   ```sh
   docker-compose -f .devcontainer/docker-compose.yml up
   ```

4. **Install dependencies**

   ```sh
   npm install
   ```

5. **Run the API in development mode**
   ```sh
   npm run dev
   ```

### API Endpoints

- `GET /health` — Health check endpoint

## Project Structure

```
src/
  application/    # Use-case handlers
  config/         # Configuration files (Express, RabbitMQ)
  controllers/    # Route controllers
  domain/         # Domain entities, enums, repositories, and types
  errors/         # Custom error classes
  infrastructure/ # External adapters such as RabbitMQ
  middleware/     # Express middleware (error handling, logging)
  routes/         # Route definitions
  types/          # Compatibility type exports
  util/           # Utility functions
  index.ts        # Entry point
```

## RabbitMQ

- Management UI: [http://localhost:15672](http://localhost:15672)
- Default broker port: `5672`

## MySQL and Prisma

- MySQL port: `3306`
- Prisma Studio port: `5555`
- Database: `notification_api`
- Connection string: `DATABASE_URL` in `.env`
- Generate Prisma client: `npm run prisma:generate`
- Run local migrations: `npm run prisma:migrate`
- Open Prisma Studio: `npm run prisma:studio`

## Scripts

- `npm run dev` — Start in development mode
- `npm start` — Start in production mode
- `npm run prisma:generate` — Generate Prisma client
- `npm run prisma:migrate` — Run Prisma migrations in development
- `npm run prisma:studio` — Open Prisma Studio
- `npm run typecheck` — TypeScript type checking

## License

ISC
