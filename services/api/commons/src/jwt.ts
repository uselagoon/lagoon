import { sign } from 'jsonwebtoken';
type Role = 'none' | 'admin' | 'drush';

interface Payload {
  role: Role;

  // Issuer - Information on who created this token
  iss: string;

  // Subject - Unique identifier for the user / identity
  sub?: string;

  // Audience - Url of the resource server the token was intended for (e.g. http://api.amazee.io)
  aud?: string;

  // IssuedAt timestamp (needs to be > 0)
  iat?: number;

  // Expiration as NumericDate
  // Example for an expiration timestamp in 1 hour: Math.floor(Date.now() / 1000) + (60 * 60)
  exp: number;
}

// Create a JWT without any user ID checks.
//
// This function is also synchronous, which is useful for creating service
// tokens, which generally get created during startup of services. Beware
// the performance implications of using this in async environments!
export const createJWTWithoutUserId = (
  payload: Payload,
  jwtSecret: string,
): string => sign(payload, jwtSecret);
