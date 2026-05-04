import http from "node:http";
import { authorizeAdmin, authorizeGoogleUser } from "./auth.js";
import {
  createItem,
  deleteItem,
  ensureItemIds,
  getCollectionConfig,
  getItem,
  getStorageMode,
  listCollections,
  readAllCollections,
  readCollection,
  replaceAllCollections,
  replaceCollection,
  replaceItem,
  updateItem,
} from "./store.js";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "127.0.0.1";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

const json = (res, status, payload) => {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end(body);
};

const notFound = (res) => json(res, 404, { error: "Not found" });

const requireAdmin = async (req, res) => {
  const authorization = await authorizeAdmin(req);
  if (authorization.ok) return authorization;
  json(res, authorization.status || 401, {
    error: authorization.error,
    detail: authorization.detail,
  });
  return null;
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const reqHostPlaceholder = "localhost";
const parsePath = (url) => new URL(url, `http://${reqHostPlaceholder}`).pathname.split("/").filter(Boolean);

const tryAuthorizeAdmin = async (req) => {
  if (!req.headers.authorization) return null;
  const authorization = await authorizeAdmin(req);
  return authorization.ok ? authorization : null;
};

// Keep this in sync with the frontend idea submission normalizer.
const normalizeCommaSeparatedList = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => entry.toString().trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const buildIdeaSubmission = (body, user) => ({
  title: typeof body.title === "string" ? body.title.trim() : "",
  category: typeof body.category === "string" ? body.category.trim() || "Idea" : "Idea",
  summary: typeof body.summary === "string" ? body.summary.trim() : "",
  tools: normalizeCommaSeparatedList(body.tools),
  skills: normalizeCommaSeparatedList(body.skills),
  status: "draft",
  featured: false,
  submissionStatus: "pending",
  submittedBy: {
    uid: user.uid,
    email: user.email,
    name: user.name || "",
    picture: user.picture || "",
    submittedAt: new Date().toISOString(),
  },
});

const createContributorIdeaDraft = async (req, res, body) => {
  const contributor = await authorizeGoogleUser(req);
  if (!contributor.ok) {
    json(res, contributor.status || 401, {
      error: contributor.error,
      detail: contributor.detail,
    });
    return null;
  }

  if (!body.title?.toString().trim() || !body.summary?.toString().trim()) {
    return json(res, 400, {
      error: "Idea title and summary are required",
      detail: "Submit a non-empty title and summary before saving the draft.",
    });
  }

  const item = await createItem("ideas", buildIdeaSubmission(body, contributor.user));
  return json(res, 201, item);
};

const handleIdeasCollection = async (req, res, id) => {
  const config = getCollectionConfig("ideas");
  if (!config) return notFound(res);

  if (req.method === "GET" && !id) {
    await ensureItemIds("ideas");
    const result = await readCollection("ideas");
    const admin = await tryAuthorizeAdmin(req);
    const items = admin ? result.items : result.items.filter((item) => item.status !== "draft");
    return json(res, 200, { [result.config.key]: items });
  }

  if (req.method === "GET" && id) {
    const item = await getItem("ideas", id);
    if (item?.status === "draft") {
      const admin = await tryAuthorizeAdmin(req);
      if (!admin) return notFound(res);
    }
    return item ? json(res, 200, item) : notFound(res);
  }

  if (req.method === "POST" && !id) {
    const body = await readJsonBody(req);
    const admin = await tryAuthorizeAdmin(req);
    if (admin) {
      const item = await createItem("ideas", body);
      return json(res, 201, item);
    }
    return createContributorIdeaDraft(req, res, body);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return null;

  if (req.method === "PUT" && id) {
    const body = await readJsonBody(req);
    const item = await replaceItem("ideas", id, body);
    return item ? json(res, 200, item) : notFound(res);
  }

  if (req.method === "PUT" && !id) {
    const body = await readJsonBody(req);
    const payload = await replaceCollection("ideas", body);
    return json(res, 200, payload);
  }

  if (req.method === "PATCH" && id) {
    const body = await readJsonBody(req);
    const item = await updateItem("ideas", id, body);
    return item ? json(res, 200, item) : notFound(res);
  }

  if (req.method === "DELETE" && id) {
    const deleted = await deleteItem("ideas", id);
    return deleted ? json(res, 200, { deleted: true, id }) : notFound(res);
  }

  return notFound(res);
};

const handleCollection = async (req, res, collection, id) => {
  const config = getCollectionConfig(collection);
  if (!config) return notFound(res);

  if (collection === "ideas") {
    return handleIdeasCollection(req, res, id);
  }

  if (req.method === "GET" && !id) {
    await ensureItemIds(collection);
    const result = await readCollection(collection);
    return json(res, 200, { [result.config.key]: result.items });
  }

  if (req.method === "GET" && id) {
    const item = await getItem(collection, id);
    return item ? json(res, 200, item) : notFound(res);
  }

  if (req.method === "POST" && !id) {
    const body = await readJsonBody(req);
    const admin = await requireAdmin(req, res);
    if (!admin) return null;
    const item = await createItem(collection, body);
    return json(res, 201, item);
  }

  if (req.method === "PUT" && id) {
    const body = await readJsonBody(req);
    const item = await replaceItem(collection, id, body);
    return item ? json(res, 200, item) : notFound(res);
  }

  if (req.method === "PUT" && !id) {
    const body = await readJsonBody(req);
    const payload = await replaceCollection(collection, body);
    return json(res, 200, payload);
  }

  if (req.method === "PATCH" && id) {
    const body = await readJsonBody(req);
    const item = await updateItem(collection, id, body);
    return item ? json(res, 200, item) : notFound(res);
  }

  if (req.method === "DELETE" && id) {
    const deleted = await deleteItem(collection, id);
    return deleted ? json(res, 200, { deleted: true, id }) : notFound(res);
  }

  return notFound(res);
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return json(res, 204, {});

    const parts = parsePath(req.url);

    if (req.method === "GET" && parts.length === 1 && parts[0] === "health") {
      return json(res, 200, { ok: true, service: "portfolio-api", storage: getStorageMode() });
    }

    if (req.method === "GET" && parts.length === 1 && parts[0] === "api") {
      return json(res, 200, { collections: listCollections() });
    }

    if (parts[0] === "api" && parts[1] === "content" && parts.length === 2) {
      if (req.method === "GET") {
        return json(res, 200, await readAllCollections());
      }

      if (req.method === "PUT") {
        const admin = await requireAdmin(req, res);
        if (!admin) return null;
        const body = await readJsonBody(req);
        return json(res, 200, await replaceAllCollections(body));
      }
    }

    if (parts[0] === "api" && parts[1] === "admin" && parts[2] === "session") {
      const admin = await requireAdmin(req, res);
      if (!admin) return null;
      return json(res, 200, {
        ok: true,
        method: admin.method,
        user: admin.user || null,
      });
    }

    if (parts[0] === "api" && parts[1]) {
      return handleCollection(req, res, parts[1], parts[2] || "");
    }

    return notFound(res);
  } catch (error) {
    return json(res, 500, {
      error: "Internal server error",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Portfolio API listening at http://${HOST}:${PORT}`);
});
