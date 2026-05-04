import { createHash } from "node:crypto";

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || "";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "";

let firebaseAuth = null;

const csv = (value = "") =>
  value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

const adminEmails = new Set(csv(process.env.ADMIN_EMAILS || ""));
const adminEmailHashes = new Set(csv(process.env.ADMIN_EMAIL_HASHES || ""));

const sha256 = (value) => createHash("sha256").update(value.toLowerCase()).digest("hex");

const bearerToken = (req) => {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
};

const getFirebaseAuth = async () => {
  if (firebaseAuth) return firebaseAuth;

  const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/auth"),
  ]);

  const app = getApps()[0] || initializeApp({ projectId: FIREBASE_PROJECT_ID });
  firebaseAuth = getAuth(app);
  return firebaseAuth;
};

const verifyFirebaseIdentity = async (req) => {
  const token = bearerToken(req);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Google sign-in required",
      detail: "Send a Firebase Google ID token as Authorization: Bearer <token>.",
    };
  }

  if (!FIREBASE_PROJECT_ID) {
    return {
      ok: false,
      status: 401,
      error: "Firebase admin auth is not configured",
      detail: "Set FIREBASE_PROJECT_ID on the backend.",
    };
  }

  try {
    const auth = await getFirebaseAuth();
    const decoded = await auth.verifyIdToken(token);
    const email = decoded.email || "";

    if (!decoded.email_verified) {
      return { ok: false, status: 403, error: "Google email is not verified" };
    }

    return {
      ok: true,
      method: "firebase",
      user: {
        uid: decoded.uid,
        email,
        name: decoded.name || "",
        picture: decoded.picture || "",
      },
    };
  } catch (error) {
    return {
      ok: false,
      status: 401,
      error: "Invalid Firebase ID token",
      detail: error instanceof Error ? error.message : "Token verification failed",
    };
  }
};

const isAllowedEmail = (email = "") => {
  const normalized = email.toLowerCase();
  if (!normalized) return false;
  return adminEmails.has(normalized) || adminEmailHashes.has(sha256(normalized));
};

export const authorizeAdmin = async (req) => {
  const token = bearerToken(req);

  if (ADMIN_API_TOKEN && token === ADMIN_API_TOKEN) {
    return { ok: true, method: "api-token" };
  }

  const identity = await verifyFirebaseIdentity(req);
  if (!identity.ok) return identity;

  if (!isAllowedEmail(identity.user.email)) {
    return { ok: false, status: 403, error: "Signed-in Google account is not an admin" };
  }

  return identity;
};

export const authorizeGoogleUser = async (req) => verifyFirebaseIdentity(req);
