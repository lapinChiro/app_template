# TASK-012: Admin Next.js App Setup

**Priority**: Medium  
**Estimated**: 3 hours  
**Dependencies**: TASK-006 (UI Components), TASK-008 (Google OAuth)

## Prerequisites

- Next.js 14+ App Router の理解
- 管理画面UI/UXの基本知識
- ロールベースアクセス制御の理解

## Reference Implementation

- Primary: `@docs/impl/auth/admin-crud.md` - 管理者権限実装
- Secondary: `@docs/impl/ui/shadcn-tailwind.md` - 管理画面UI

## Acceptance Criteria

- [ ] apps/web-admin が Next.js 14 で初期化されている
- [ ] 管理画面レイアウトが作成されている
- [ ] 管理者権限チェックが実装されている
- [ ] ダッシュボードページが作成されている
- [ ] ユーザー管理ページの枠組みが作成されている
- [ ] 管理者テーマが適用されている

## Detailed Implementation

### Project Setup
```json
// apps/web-admin/package.json
{
  "name": "@apps/web-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@ui/components": "workspace:*",
    "@shared/core": "workspace:*",
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "swr": "^2.2.0",
    "@tanstack/react-query": "^5.0.0",
    "next-themes": "^0.3.0",
    "recharts": "^2.10.0",
    "@hookform/resolvers": "^3.3.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Admin Layout with Sidebar
```tsx
// apps/web-admin/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { AdminGuard } from '@/components/admin-guard';
import { Sidebar } from '@/components/sidebar';
import { Toaster } from '@ui/components/toaster';
import '@ui/components/styles';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin Portal',
  description: 'Ultimate Type Safety Serverless Template - Admin Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          theme="admin"
        >
          <AuthProvider>
            <AdminGuard>
              <div className="flex h-screen bg-background">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                  <div className="container mx-auto py-6">
                    {children}
                  </div>
                </main>
              </div>
            </AdminGuard>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Admin Guard Component
```tsx
// apps/web-admin/src/components/admin-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Loader2 } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
```

### Sidebar Navigation
```tsx
// apps/web-admin/src/components/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ui/components/lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart,
  Shield,
  LogOut,
} from 'lucide-react';
import { Button } from '@ui/components/button';
import { useAuth } from './auth-provider';

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: LayoutDashboard },
  { name: 'ユーザー管理', href: '/users', icon: Users },
  { name: 'アナリティクス', href: '/analytics', icon: BarChart },
  { name: 'セキュリティ', href: '/security', icon: Shield },
  { name: '設定', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-card">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold">管理者ポータル</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
```

### Dashboard Page
```tsx
// apps/web-admin/src/app/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Users, Activity, CreditCard, DollarSign } from 'lucide-react';
import { Overview } from '@/components/overview';
import { RecentUsers } from '@/components/recent-users';

export default async function DashboardPage() {
  // In real app, fetch these from API
  const stats = {
    totalUsers: 1234,
    activeUsers: 987,
    revenue: 45678,
    growth: 12.5,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              総ユーザー数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              前月比 +{stats.growth}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              アクティブユーザー
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              過去30日間
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              月間収益
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              前月比 +8.2%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              コンバージョン率
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">
              前月比 +0.4%
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>概要</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近のユーザー</CardTitle>
            <CardDescription>
              過去24時間に登録されたユーザー
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentUsers />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
```

### Users Management Page (Framework)
```tsx
// apps/web-admin/src/app/users/page.tsx
import { Button } from '@ui/components/button';
import { PlusCircle } from 'lucide-react';
import { UserTable } from '@/components/users/user-table';

export default function UsersPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">ユーザー管理</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          新規ユーザー
        </Button>
      </div>
      
      <UserTable />
    </>
  );
}
```

### User Table Component (Framework)
```tsx
// apps/web-admin/src/components/users/user-table.tsx
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/table';
import { Badge } from '@ui/components/badge';
import { Skeleton } from '@ui/components/skeleton';
import { Button } from '@ui/components/button';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/components/dropdown-menu';

export function UserTable() {
  const [loading] = useState(false);
  
  // Placeholder data - will be replaced with API call
  const users = [
    {
      id: '1',
      name: '山田太郎',
      email: 'yamada@example.com',
      role: 'member',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: '佐藤花子',
      email: 'sato@example.com',
      role: 'admin',
      createdAt: '2024-01-10',
    },
  ];

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? '管理者' : 'メンバー'}
                </Badge>
              </TableCell>
              <TableCell>{user.createdAt}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">メニューを開く</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>アクション</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>登録日</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Quality Gates

- TypeScript errors: 0
- ESLint errors: 0
- Lighthouse score: > 90
- Accessibility: WCAG 2.1 AA 準拠

## Verification Steps

```bash
# プロジェクトセットアップ
cd apps/web-admin
pnpm install

# 開発サーバー起動
pnpm dev

# 型チェック
pnpm type-check

# ビルド確認
pnpm build

# 手動テスト
# 1. http://localhost:3001 にアクセス
# 2. 管理者アカウントでログイン
# 3. ダッシュボードの表示確認
# 4. サイドバーナビゲーションの動作確認
# 5. ユーザー管理ページの表示確認
# 6. 管理者以外のアカウントでアクセス拒否確認
```

## Output

- 動作する管理者用 Next.js アプリケーション
- 管理者専用アクセス制御
- 管理画面レイアウトとナビゲーション

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented