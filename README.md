# Ticket Processing API

A Node.js API for processing tickets, built with Express and RabbitMQ.

## Features

- Express 5.x API server
- RabbitMQ integration for messaging
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
  config/         # Configuration files (Express, RabbitMQ)
  controllers/    # Route controllers
  enums/          # Enums (e.g., ticket types)
  errors/         # Custom error classes
  middleware/     # Express middleware (error handling, logging)
  routes/         # Route definitions
  util/           # Utility functions
  index.ts        # Entry point
```

## RabbitMQ

- Management UI: [http://localhost:15672](http://localhost:15672)
- Default broker port: `5672`

## Scripts

- `npm run dev` — Start in development mode
- `npm start` — Start in production mode
- `npm run typecheck` — TypeScript type checking

## License

ISC
