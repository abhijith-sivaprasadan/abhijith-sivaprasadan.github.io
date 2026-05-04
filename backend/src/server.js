import http from "node:http";
import { authorizeAdmin } from "./auth.js";
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

const handleCollection = async (req, res, collection, id) => {
  const config = getCollectionConfig(collection);
  if (!config) return notFound(res);

  if (req.method === "GET" && !id) {
    await ensureItemIds(collection);
    const result = await readCollection(collection);
    return json(res, 200, { [result.config.key]: result.items });
  }

  if (req.method === "GET" && id) {
    const item = await getItem(collection, id);
    return item ? json(res, 200, item) : notFound(res);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return null;

  if (req.method === "POST" && !id) {
    const body = await readJsonBody(req);
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
