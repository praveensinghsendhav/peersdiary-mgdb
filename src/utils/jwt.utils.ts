import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

// JWT Configuration
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret-key";
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d"; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  staffId: string;
  roles?: string[];
}

export interface DecodedToken extends JwtPayload {
  userId: string;
  email: string;
  staffId: string;
  roles?: string[];
}

/**
 * Generate Access Token
 * Short-lived token for API authentication
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
    issuer: "hrms-api",
    audience: "hrms-client",
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, options);
};

/**
 * Generate Refresh Token
 * Long-lived token for getting new access tokens
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY as SignOptions["expiresIn"],
    issuer: "hrms-api",
    audience: "hrms-client",
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
};

/**
 * Generate Both Tokens
 * Returns access and refresh tokens
 */
export const generateTokens = (
  payload: TokenPayload
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify Access Token
 * Returns decoded token if valid, throws error if invalid
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
      issuer: "hrms-api",
      audience: "hrms-client",
    }) as DecodedToken;

    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Access token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid access token");
    } else {
      throw new Error("Token verification failed");
    }
  }
};

/**
 * Verify Refresh Token
 * Returns decoded token if valid, throws error if invalid
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
      issuer: "hrms-api",
      audience: "hrms-client",
    }) as DecodedToken;

    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Refresh token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid refresh token");
    } else {
      throw new Error("Token verification failed");
    }
  }
};

/**
 * Decode Token Without Verification
 * Useful for getting token info without validating
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    return null;
  }
};

/**
 * Get Token Expiry Time
 * Returns expiry timestamp
 */
export const getTokenExpiry = (token: string): number | null => {
  const decoded = decodeToken(token);
  return decoded?.exp ? decoded.exp * 1000 : null;
};

/**
 * Check if Token is Expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry;
};

/**
 * Get Time Until Token Expires
 * Returns milliseconds until expiry
 */
export const getTimeUntilExpiry = (token: string): number | null => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return null;
  return Math.max(0, expiry - Date.now());
};