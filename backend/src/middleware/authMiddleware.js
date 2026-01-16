import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Extract JWKS URI from token issuer dynamically
function getJwksUriFromToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (decoded && decoded.payload && decoded.payload.iss) {
      const issuer = decoded.payload.iss;
      // Clerk's JWKS endpoint is always at /.well-known/jwks.json
      return `${issuer}/.well-known/jwks.json`;
    }
  } catch (err) {
    console.error('❌ Error extracting issuer from token:', err);
  }
  // Fallback to default
  return 'https://kind-emu-28.clerk.accounts.dev/.well-known/jwks.json';
}

// Create JWKS client with caching
const jwksClients = new Map();

function getJwksClient(jwksUri) {
  if (!jwksClients.has(jwksUri)) {
    jwksClients.set(jwksUri, jwksClient({
      jwksUri,
      timeout: 30000,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      cacheMaxEntries: 5,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    }));
  }
  return jwksClients.get(jwksUri);
}

// Middleware function to verify token
export function clerkAuthMiddleware(req, res, next) {
  console.log('🔐 Auth middleware executing...');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Missing or invalid authorization header:', authHeader);
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];
  console.log('✅ Token extracted, verifying...');

  // Decode token to extract issuer and kid
  let decodedHeader;
  try {
    decodedHeader = jwt.decode(token, { complete: true });
    if (decodedHeader && decodedHeader.payload) {
      console.log('📋 Token issuer:', decodedHeader.payload.iss);
      console.log('📋 Token kid:', decodedHeader.header?.kid);
    }
  } catch (decodeErr) {
    console.error('❌ Error decoding token:', decodeErr);
    return res.status(401).json({ message: 'Invalid token format' });
  }

  if (!decodedHeader || !decodedHeader.payload || !decodedHeader.payload.iss) {
    return res.status(401).json({ message: 'Invalid token: missing issuer' });
  }

  // Get JWKS URI from token issuer
  const jwksUri = getJwksUriFromToken(token);
  console.log('🔑 Using JWKS URI:', jwksUri);

  // Get JWKS client for this issuer
  const client = getJwksClient(jwksUri);

  // Create getKey function with closure over token and client
  const getKey = (header, callback) => {
    console.log('🔑 Looking for signing key with kid:', header.kid);
    
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        console.error('❌ Error getting signing key:', err);
        console.error('❌ Key ID (kid):', header.kid);
        console.error('❌ JWKS URI used:', jwksUri);
        
        // Try to fetch fresh keys if cache might be stale
        if (err.message && err.message.includes('Unable to find')) {
          console.log('🔄 Attempting to refresh JWKS cache...');
          // Force cache refresh by creating a new client
          jwksClients.delete(jwksUri);
          const freshClient = getJwksClient(jwksUri);
          freshClient.getSigningKey(header.kid, (retryErr, retryKey) => {
            if (retryErr) {
              return callback(retryErr);
            }
            try {
              const signingKey = retryKey.getPublicKey();
              console.log('✅ Signing key found after cache refresh');
              callback(null, signingKey);
            } catch (keyErr) {
              callback(keyErr);
            }
          });
          return;
        }
        
        return callback(err);
      }

      try {
        const signingKey = key.getPublicKey();
        console.log('✅ Signing key found and retrieved');
        callback(null, signingKey);
      } catch (keyErr) {
        console.error('❌ Error extracting public key:', keyErr);
        callback(keyErr);
      }
    });
  };

  jwt.verify(token, getKey, {
    algorithms: ['RS256'],
    ignoreExpiration: false,
    ignoreNotBefore: false,
  }, (err, decoded) => {
    if (err) {
      console.error('❌ JWT verification error:', err.message);
      console.error('❌ Error details:', err);
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
