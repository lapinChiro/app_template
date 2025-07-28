# TASK-006: UI Component Library Setup

**Priority**: High  
**Estimated**: 4 hours  
**Dependencies**: TASK-002 (pnpm Workspace)

## Prerequisites

- React/Next.js の基本知識
- Tailwind CSS の理解
- shadcn/ui コンポーネントの概要理解

## Reference Implementation

- Primary: `@docs/impl/ui/shadcn-tailwind.md` - UI実装ガイド
- Secondary: `@docs/impl/ui/theme-system.md` - テーマシステム

## Acceptance Criteria

- [ ] packages/ui が作成され workspace に追加されている
- [ ] Tailwind CSS が設定されている
- [ ] shadcn/ui の基本コンポーネントが追加されている
- [ ] member/admin テーマシステムが実装されている
- [ ] Storybook が設定され動作している
- [ ] 全コンポーネントが型安全である

## Detailed Implementation

### Package Setup
```json
// packages/ui/package.json
{
  "name": "@ui/components",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles": "./src/styles/globals.css"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.309.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-themes": "^8.0.0",
    "@storybook/react": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "storybook": "^8.0.0",
    "tailwindcss": "^3.4.0",
    "tsup": "^8.0.1",
    "typescript": "^5.6.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### Tailwind Configuration
```javascript
// packages/ui/tailwind.config.js
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../apps/*/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### Theme System Implementation
```typescript
// packages/ui/src/lib/theme.ts
export const themes = {
  member: {
    primary: '217 91% 60%',
    secondary: '217 19% 27%',
    accent: '215 20.2% 65.1%',
  },
  admin: {
    primary: '263 70% 50%',
    secondary: '263 20% 30%',
    accent: '263 20% 60%',
  },
} as const;

export type Theme = keyof typeof themes;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const colors = themes[theme];
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}
```

### Basic Components
```typescript
// packages/ui/src/components/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Storybook Configuration
```typescript
// packages/ui/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;

// packages/ui/.storybook/preview.tsx
import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
```

### Component Stories
```typescript
// packages/ui/src/components/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};
```

## Quality Gates

- TypeScript errors: 0
- ESLint errors: 0
- Storybook stories: 100% coverage
- Accessibility: WCAG 2.1 AA 準拠
- Bundle size: < 50KB (individual components)

## Verification Steps

```bash
# パッケージセットアップ
cd packages/ui
pnpm install

# shadcn/ui コンポーネント追加
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button dialog form input label toast

# ビルド確認
pnpm build

# Storybook 起動
pnpm storybook

# テーマ切り替え確認（Storybookで）
# 1. Member テーマでコンポーネント確認
# 2. Admin テーマでコンポーネント確認

# 他パッケージからのインポート確認
cd ../../apps/web-member
pnpm add @ui/components@workspace:*
```

## Output

- 型安全な UI コンポーネントライブラリ
- member/admin テーマ対応
- Storybook による視覚的なコンポーネントカタログ

## Progress

- [x] Started
- [x] Implementation complete
- [x] Verified
- [x] Documented