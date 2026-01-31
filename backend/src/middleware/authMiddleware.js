import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Must match the frontend Clerk app (from VITE_CLERK_PUBLISHABLE_KEY). Override with CLERK_JWKS_URL in .env if needed.
const CLERK_JWKS_URL = process.env.CLERK_JWKS_URL || 'https://tidy-wasp-22.clerk.accounts.dev/.well-known/jwks.json';

const client = jwksClient({
  jwksUri: CLERK_JWKS_URL,
  timeout: 30000,
});

// 2. Get the correct signing key based on JWT header's kid
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('❌ Error getting signing key:', err);
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// 3. Middleware function to verify token
export function clerkAuthMiddleware(req, res, next) {
  console.log('🔐 Auth middleware executing...');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Missing or invalid authorization header:', authHeader);
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];
  console.log('✅ Token extracted, verifying...');

  jwt.verify(token, getKey, {
    algorithms: ['RS256'],
    clockTolerance: 120,
    ignoreNotBefore: true, // Clerk nbf can trigger "jwt not active"; we still verify signature + exp
  }, (err, decoded) => {
    if (err) {
      console.error('❌ JWT verification error:', err.message);
      return res
        .status(401)
        .json({ message: 'Unauthorized: Invalid token', error: err.message });
    }

    console.log('✅ Token verified successfully');
    console.log('📦 Decoded payload:', decoded);

    req.user = decoded; // Store decoded payload
    next();
  });
}
