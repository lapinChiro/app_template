# TASK-011: Member Next.js App Setup

**Priority**: Medium  
**Estimated**: 3 hours  
**Dependencies**: TASK-006 (UI Components), TASK-008 (Google OAuth)

## Prerequisites

- Next.js 14+ App Router の理解
- React Server Components の知識
- OAuth フローの理解

## Reference Implementation

- Primary: `@docs/impl/auth/google-oauth.md` - 認証フロー実装
- Secondary: `@docs/impl/ui/shadcn-tailwind.md` - UIコンポーネント使用法

## Acceptance Criteria

- [ ] apps/web-member が Next.js 14 で初期化されている
- [ ] 基本レイアウトが作成されている
- [ ] Google OAuth 認証フローが統合されている
- [ ] ホームページとプロフィールページが作成されている
- [ ] API クライアントが設定されている
- [ ] メンバーテーマが適用されている

## Detailed Implementation

### Project Setup
```json
// apps/web-member/package.json
{
  "name": "@apps/web-member",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
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
    "next-themes": "^0.3.0"
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

### Next.js Configuration
```javascript
// apps/web-member/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ui/components', '@shared/core'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // Google profile images
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Root Layout
```tsx
// apps/web-member/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@ui/components/toaster';
import '@ui/components/styles';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Member Portal',
  description: 'Ultimate Type Safety Serverless Template - Member Portal',
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
          theme="member"
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Auth Provider
```tsx
// apps/web-member/src/components/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@shared/core/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Redirect to Google OAuth
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(window.location.pathname)}`;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Home Page
```tsx
// apps/web-member/src/app/page.tsx
import { Button } from '@ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { AuthGuard } from '@/components/auth-guard';

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8">メンバーダッシュボード</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール</CardTitle>
              <CardDescription>
                あなたのプロフィール情報を確認・編集
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href="/profile">プロフィールを見る</a>
              </Button>
            </CardContent>
          </Card>
          
          {/* Other dashboard cards */}
        </div>
      </div>
    </AuthGuard>
  );
}
```

### Profile Page
```tsx
// apps/web-member/src/app/profile/page.tsx
'use client';

import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@ui/components/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card';
import { Skeleton } from '@ui/components/skeleton';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.picture} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">ロール:</span>
              <span>{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">登録日:</span>
              <span>{new Date(user.createdAt).toLocaleDateString('ja-JP')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### API Client Setup
```typescript
// apps/web-member/src/lib/api-client.ts
import { ApiResponse } from '@shared/core/types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

## Quality Gates

- TypeScript errors: 0
- ESLint errors: 0
- Lighthouse score: > 90
- Core Web Vitals: Pass

## Verification Steps

```bash
# プロジェクトセットアップ
cd apps/web-member
pnpm install

# 開発サーバー起動
pnpm dev

# 型チェック
pnpm type-check

# ビルド確認
pnpm build

# 手動テスト
# 1. http://localhost:3000 にアクセス
# 2. ログインボタンからGoogle OAuth認証
# 3. ダッシュボードの表示確認
# 4. プロフィールページの表示確認
# 5. ログアウト機能の確認
```

## Output

- 動作するメンバー用 Next.js アプリケーション
- Google OAuth ログイン機能
- メンバーテーマ適用済みUI

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented