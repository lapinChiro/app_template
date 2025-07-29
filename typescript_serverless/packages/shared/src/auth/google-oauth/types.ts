import { z } from 'zod';

export const GoogleAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  hostedDomain: z.string().optional(),
});

export type GoogleAuthConfig = z.infer<typeof GoogleAuthConfigSchema>;

export const GoogleTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  id_token: z.string().optional(),
});

export type GoogleTokenResponse = z.infer<typeof GoogleTokenResponseSchema>;

export const GoogleUserInfoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  verified_email: z.boolean(),
  name: z.string(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
  locale: z.string().optional(),
  hd: z.string().optional(),
});

export type GoogleUserInfo = z.infer<typeof GoogleUserInfoSchema>;

export const IdTokenPayloadSchema = z.object({
  iss: z.string(),
  sub: z.string(),
  azp: z.string(),
  aud: z.string(),
  iat: z.number(),
  exp: z.number(),
  email: z.string().email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
  picture: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  locale: z.string().optional(),
  hd: z.string().optional(),
  nonce: z.string().optional(),
});

export type IdTokenPayload = z.infer<typeof IdTokenPayloadSchema>;

export const PKCEParametersSchema = z.object({
  codeVerifier: z.string().min(43).max(128),
  codeChallenge: z.string(),
  state: z.string(),
});

export type PKCEParameters = z.infer<typeof PKCEParametersSchema>;

export const AuthorizationResponseSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type AuthorizationResponse = z.infer<typeof AuthorizationResponseSchema>;

export const InternalUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().optional(),
  googleId: z.string(),
  role: z.enum(['admin', 'member']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InternalUser = z.infer<typeof InternalUserSchema>;