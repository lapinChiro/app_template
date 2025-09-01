# Database Migrations

## Overview

This project uses Kysely's migration system for database schema management. Migrations run automatically when the backend server starts.

## Migration Commands

```bash
# Run migrations manually
npm run migrate

# Rollback last migration
npm run migrate:down
```

## Creating New Migrations

Create a new file in `src/db/migrations/` with the naming pattern: `YYYY-MM-DD-NNN-description.ts`

Example:
```typescript
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Migration code
}

export async function down(db: Kysely<any>): Promise<void> {
  // Rollback code
}
```

## Important Notes

- Migrations run automatically on server startup
- Use `Kysely<any>` in migrations, not typed database interfaces
- Migrations execute in alphabetical order
- Test migrations locally before deploying