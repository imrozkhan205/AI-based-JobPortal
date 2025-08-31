import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// 1. Create a JWKS client pointing to Clerk's JWKS URL
const client = jwksClient({
  jwksUri: 'https://kind-emu-28.clerk.accounts.dev/.well-known/jwks.json',
  timeout: 30000, // Defaults to 30s
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

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
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
