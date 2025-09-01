import type { ColumnType, Generated } from 'kysely'

export interface Database {
  test_users: TestUsersTable
}

export interface TestUsersTable {
  id: Generated<number>
  name: string
  email: string
  active: ColumnType<boolean, boolean | undefined, boolean>
  created_at: ColumnType<Date, Date | undefined, Date>
}