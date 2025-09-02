# Run Instructions

## Frontend (React + Vite)
- Requirements: Node 18+, pnpm
- Commands:
```bash
pnpm install
pnpm dev
```
Runs on the dev server shown in the Builder preview.

To point the frontend to the Java backend, create a `.env` file in the project root with:
```
VITE_API_BASE_URL=http://localhost:8081/api
```

## Backend (Java Spring Boot)
- See backend-java/README.md
- Quick start:
```bash
cd backend-java
mvn spring-boot:run
```
Exposes APIs at http://localhost:8081/api.
