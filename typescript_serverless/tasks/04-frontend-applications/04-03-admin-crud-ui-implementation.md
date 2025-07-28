# TASK-013: Admin CRUD UI Implementation

**Priority**: Medium  
**Estimated**: 4 hours  
**Dependencies**: TASK-012, TASK-010 (Admin App, Auth Middleware)

## Prerequisites

- React/Next.js の知識
- shadcn/ui コンポーネントの理解
- React Hook Form 経験

## Reference Implementation

- Primary: `@docs/impl/auth/admin-crud.md` - 管理者CRUD実装
- UI: `@docs/impl/ui/shadcn-tailwind.md` - UIコンポーネント

## Acceptance Criteria

- [ ] ユーザー一覧が DataTable コンポーネントで表示される（admin-crud.md Section 3）
- [ ] ソート、フィルタ、ページネーションが動作する
- [ ] 作成/編集フォームが Zod スキーマでバリデーションされる
- [ ] 削除時に確認ダイアログが表示される
- [ ] 操作後に楽観的更新とトースト通知が表示される
- [ ] 全操作で適切なローディング状態が表示される
- [ ] エラー時に適切なエラーメッセージが表示される

## Detailed Implementation

### User Table Component
```tsx
// apps/web-admin/src/components/users/user-table.tsx
import { DataTable } from '@ui/components/data-table';
import { columns } from './columns';

export function UserTable() {
  const { data, isLoading, error } = useUsers();
  
  if (error) {
    return <ErrorAlert message="ユーザー一覧の取得に失敗しました" />;
  }
  
  return (
    <DataTable
      columns={columns}
      data={data ?? []}
      loading={isLoading}
      searchKey="email"
      filters={[
        {
          column: 'role',
          title: 'ロール',
          options: [
            { label: 'メンバー', value: 'member' },
            { label: '管理者', value: 'admin' },
          ],
        },
      ]}
    />
  );
}
```

### User Form Component
```tsx
// apps/web-admin/src/components/users/user-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserSchema } from '@shared/schemas';

export function UserForm({ user, onSubmit }: UserFormProps) {
  const form = useForm({
    resolver: zodResolver(UserSchema),
    defaultValues: user,
  });
  
  const handleSubmit = async (data: User) => {
    try {
      await onSubmit(data);
      toast.success(
        user ? 'ユーザーを更新しました' : 'ユーザーを作成しました'
      );
    } catch (error) {
      toast.error('操作に失敗しました');
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* 他のフィールド */}
      </form>
    </Form>
  );
}
```

### Optimistic Updates
```tsx
// 楽観的更新の実装
const { mutate } = useSWRConfig();

const handleDelete = async (userId: string) => {
  // 楽観的更新
  mutate(
    '/api/admin/users',
    (users: User[]) => users.filter(u => u.id !== userId),
    false
  );
  
  try {
    await deleteUser(userId);
    toast.success('ユーザーを削除しました');
  } catch (error) {
    // エラー時はデータを再取得
    mutate('/api/admin/users');
    toast.error('削除に失敗しました');
  }
};
```

## Quality Gates

- TypeScript errors: 0
- Accessibility: WCAG 2.1 AA 準拠
- Performance: LCP < 2.5s
- Test coverage: > 80%

## Verification Steps

```bash
# 型チェック
pnpm tsc --noEmit

# コンポーネントテスト
pnpm test apps/web-admin/src/components/users

# アクセシビリティチェック
pnpm exec playwright test --grep @a11y

# 手動テスト項目
# 1. ユーザー一覧の表示・ソート・フィルタ
# 2. ユーザー作成（バリデーションエラー確認）
# 3. ユーザー編集（既存データの表示確認）
# 4. ユーザー削除（確認ダイアログ）
# 5. エラー時の表示（APIエラーをシミュレート）
```

## Output

- 型安全で使いやすい管理者 CRUD UI
- 楽観的更新による高速な UX
- 包括的なエラーハンドリング

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented