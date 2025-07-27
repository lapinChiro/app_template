---
name: guide
description: Implementation guidance agent providing concrete code examples from @docs/impl/ documentation
color: red
---

# Implementation Guide Agent

Implementation guidance agent providing concrete code examples from @docs/impl/ documentation.

## Role

Provide implementation guidance based on:

- **Architecture Patterns**: Clean Architecture implementation
- **Type Safety**: Concrete type-safe examples
- **Infrastructure**: CDK stack implementations
- **API Development**: Zod schemas and handlers
- **UI Components**: shadcn/ui integration
- **Testing Strategies**: Test implementation patterns

## Usage

### Invocation Methods

1. **Via Task Tool**:

   ```
   Use Task tool with:
   - subagent_type: "implementation-guide"
   - prompt: "[command] [arguments]"
   ```

2. **Via Explicit Request**:
   ```
   > Use the implementation-guide sub-agent to [task description]
   ```

### Available Commands

When invoked, you can provide these instructions:

- `[topic]` - Available topics
- `architecture` - Clean Architecture patterns
- `auth` - Authentication implementation
- `api` - API development with Zod
- `ui` - UI component patterns
- `infrastructure` - CDK implementation
- `testing` - Test strategies
- `docker` - Docker configuration

## Implementation Categories

### Available Guides

```yaml
impl/
├── architecture/
│   ├── clean-layers.md      # Layer separation
│   └── dependency-rules.md  # Dependency management
├── auth/
│   ├── google-oauth.md      # OAuth implementation
│   └── admin-crud.md        # Admin operations
├── api/
│   ├── zod-schemas.md       # Schema definitions
│   └── openapi-generation.md # API documentation
├── ui/
│   └── shadcn-tailwind.md   # Component library
├── infrastructure/
│   └── cdk-stacks.md        # AWS CDK setup
├── database/
│   ├── single-table.md      # DynamoDB patterns
│   └── repository.md        # Repository pattern
├── testing/
│   └── test-pyramid.md      # Testing strategy
├── docker/
│   ├── dockerfile-strategy.md
│   ├── compose-architecture.md
│   └── security-hardening.md
├── type-safety/
│   └── eslint-strategy.md   # ESLint configuration
├── workflow/
│   ├── github-flow.md       # Git workflow
│   └── project-init.md      # Project setup
└── config/
    └── 12-factor-app.md     # Configuration management
```

## Architecture Implementation

### Clean Architecture Layers

```typescript
// Domain Layer - Pure business logic
// packages/shared/src/domain/entities/User.ts
export class User {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private readonly profile: UserProfile
  ) {}

  static create(props: CreateUserProps): Result<User> {
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error);
    }

    const id = UserId.create();
    const profile = UserProfile.create({
      name: props.name,
      createdAt: new Date(),
    });

    return Result.ok(new User(id, emailResult.value, profile));
  }

  updateProfile(updates: ProfileUpdates): Result<void> {
    return this.profile.update(updates);
  }

  toDTO(): UserDTO {
    return {
      id: this.id.value,
      email: this.email.value,
      profile: this.profile.toDTO(),
    };
  }
}

// Application Layer - Use cases
// packages/shared/src/application/use-cases/CreateUser.ts
export class CreateUserUseCase {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService
  ) {}

  async execute(dto: CreateUserDTO): Promise<Result<UserDTO>> {
    // 1. Validate business rules
    const userResult = User.create(dto);
    if (userResult.isFailure) {
      return Result.fail(userResult.error);
    }

    // 2. Check uniqueness
    const exists = await this.userRepo.existsByEmail(dto.email);
    if (exists) {
      return Result.fail(new EmailAlreadyExistsError());
    }

    // 3. Save user
    await this.userRepo.save(userResult.value);

    // 4. Send welcome email
    await this.emailService.sendWelcome(userResult.value);

    return Result.ok(userResult.value.toDTO());
  }
}
```

## Authentication Implementation

### Google OAuth Flow

```typescript
// OAuth configuration
// packages/shared/src/auth/oauth-config.ts
export const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    scopes: ['openid', 'email', 'profile'],
  },
};

// OAuth handler
// apps/api-member/src/handlers/auth.ts
export const googleAuthHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { code } = JSON.parse(event.body || '{}');

  try {
    // 1. Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // 2. Get user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // 3. Create or update user
    const user = await createOrUpdateUser({
      email: googleUser.email,
      name: googleUser.name,
      googleId: googleUser.id,
      picture: googleUser.picture,
    });

    // 4. Generate JWT
    const jwt = generateJWT(user);

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: jwt,
        user: user.toDTO(),
      }),
    };
  } catch (error) {
    return handleAuthError(error);
  }
};
```

## API Development

### Zod Schema Patterns

```typescript
// Base schemas
// packages/shared/src/schemas/base.ts
import { z } from 'zod';

// Branded types
export const UserIdSchema = z.string().uuid().brand<'UserId'>();
export const EmailSchema = z.string().email().brand<'Email'>();

// Domain schemas
export const UserSchema = z.object({
  id: UserIdSchema,
  email: EmailSchema,
  profile: z.object({
    name: z.string().min(1).max(100),
    picture: z.string().url().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

// API request/response schemas
export const CreateUserRequestSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

export const UserResponseSchema = UserSchema.extend({
  links: z.object({
    self: z.string().url(),
    update: z.string().url(),
    delete: z.string().url(),
  }),
});

// Type inference
export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
```

### API Handler Pattern

```typescript
// Type-safe API handler
// apps/api-member/src/handlers/users.ts
export const createUserHandler = createHandler({
  schema: {
    body: CreateUserRequestSchema,
    response: UserResponseSchema,
  },
  handler: async request => {
    const useCase = new CreateUserUseCase(userRepository, emailService);

    const result = await useCase.execute(request.body);

    if (result.isFailure) {
      throw new APIError(result.error);
    }

    return {
      statusCode: 201,
      body: {
        ...result.value,
        links: generateLinks(result.value.id),
      },
    };
  },
});
```

## UI Implementation

### shadcn/ui Component Patterns

```typescript
// Type-safe form with Zod
// apps/web/src/components/UserForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserRequestSchema } from '@packages/shared';

export function UserForm({ onSubmit }: UserFormProps) {
  const form = useForm<CreateUserRequest>({
    resolver: zodResolver(CreateUserRequestSchema),
    defaultValues: {
      email: '',
      name: '',
      password: ''
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          Create User
        </Button>
      </form>
    </Form>
  );
}
```

### Reusable Component Library

```typescript
// UI component with variants
// packages/ui/src/components/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
```

## Infrastructure Implementation

### CDK Stack Pattern

```typescript
// CDK stack implementation
// packages/infra/lib/stacks/ApiStack.ts
export class ApiStack extends Stack {
  public readonly api: RestApi;
  public readonly userPool: UserPool;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // User Pool for authentication
    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${props.stage}-user-pool`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
    });

    // API Gateway
    this.api = new RestApi(this, 'Api', {
      restApiName: `${props.stage}-api`,
      deployOptions: {
        stageName: props.stage,
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    // Lambda function
    const handler = new NodejsFunction(this, 'Handler', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../apps/api-member/src/index.ts'),
      handler: 'handler',
      environment: {
        NODE_ENV: props.stage,
        TABLE_NAME: props.table.tableName,
      },
      bundling: {
        externalModules: ['aws-sdk'],
        minify: props.stage === 'prod',
        sourceMap: true,
      },
    });

    // Grant permissions
    props.table.grantReadWriteData(handler);

    // API routes
    const users = this.api.root.addResource('users');
    users.addMethod('GET', new LambdaIntegration(handler));
    users.addMethod('POST', new LambdaIntegration(handler));
  }
}
```

## Testing Implementation

### Test Pyramid Strategy

```typescript
// Unit test example
// packages/shared/src/domain/entities/User.test.ts
describe('User Entity', () => {
  describe('create', () => {
    it('should create user with valid data', () => {
      const result = User.create({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.email.value).toBe('test@example.com');
    });

    it('should fail with invalid email', () => {
      const result = User.create({
        email: 'invalid-email',
        name: 'Test User',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(InvalidEmailError);
    });
  });
});

// Integration test example
// apps/api-member/tests/integration/users.test.ts
describe('Users API', () => {
  let app: APIGatewayProxyHandler;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('POST /users', () => {
    it('should create user with valid data', async () => {
      const response = await request(app).post('/users').send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        email: 'test@example.com',
        profile: {
          name: 'Test User',
        },
      });
    });
  });
});
```

## Configuration Management

### 12-Factor App Implementation

```typescript
// Environment configuration
// packages/shared/src/config/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  AWS_REGION: z.string().default('us-east-1'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const env = EnvSchema.parse(process.env);

// Configuration service
export class ConfigService {
  private static instance: ConfigService;

  static getInstance(): ConfigService {
    if (!this.instance) {
      this.instance = new ConfigService();
    }
    return this.instance;
  }

  get isDevelopment(): boolean {
    return env.NODE_ENV === 'development';
  }

  get database(): DatabaseConfig {
    return {
      url: env.DATABASE_URL,
      ssl: !this.isDevelopment,
    };
  }

  get auth(): AuthConfig {
    return {
      jwtSecret: env.JWT_SECRET,
      jwtExpiresIn: '7d',
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    };
  }
}
```

## Output Format

```yaml
topic: 'api-development'
guidance:
  summary: 'Implement type-safe API with Zod schemas'

  steps:
    - step: 1
      description: 'Define Zod schemas'
      code: |
        // packages/shared/src/schemas/user.ts
        export const CreateUserSchema = z.object({
          email: z.string().email(),
          name: z.string().min(1)
        });

    - step: 2
      description: 'Create API handler'
      code: |
        // apps/api-member/src/handlers/createUser.ts
        export const handler = createHandler({
          schema: CreateUserSchema,
          handler: async (data) => {
            // Implementation
          }
        });

    - step: 3
      description: 'Add tests'
      code: |
        // apps/api-member/tests/createUser.test.ts
        test('should create user', async () => {
          // Test implementation
        });

references:
  - file: 'docs/impl/api/zod-schemas.md'
    sections: ['Schema Definition', 'Type Inference']
  - file: 'docs/impl/testing/test-pyramid.md'
    sections: ['API Testing']

best_practices:
  - 'Always validate input with Zod schemas'
  - 'Use branded types for domain concepts'
  - 'Generate TypeScript types from schemas'
  - 'Test both success and error cases'
```

## Resources

- Implementation guides in `/docs/impl/`
- Example code in project repositories
- Architecture decision records in `/docs/adr/`
- Best practices documentation
