import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('test_users')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('active', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('created_at', 'timestamp', (col) => 
      col.defaultTo(sql`now()`).notNull()
    )
    .execute()

  // Insert test data
  await db
    .insertInto('test_users')
    .values([
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        active: true,
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        active: true,
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        active: false,
      },
    ])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('test_users').execute()
}