import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data"));
const DATABASE_URL = process.env.DATABASE_URL || "";
const DATABASE_SSL = process.env.DATABASE_SSL !== "false";
const DATABASE_SSL_REJECT_UNAUTHORIZED = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";
const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const DATABASE_CONNECTION_TIMEOUT_MS = parsePositiveInteger(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 10000);
let pool = null;
let dbReady = false;

const COLLECTIONS = {
  certifications: { file: "certifications.json", key: "certifications" },
  projects: { file: "projects.json", key: "projects" },
  experience: { file: "experience.json", key: "experience" },
  courses: { file: "courses.json", key: "courses" },
  skills: { file: "skills.json", key: "skillGroups" },
  ideas: { file: "ideas.json", key: "ideas" },
};

const slugify = (value) =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

const createId = (item) => {
  const base = slugify(item.title || item.name || item.role || item.company || "item");
  return `${base || "item"}-${Date.now().toString(36)}`;
};

export const listCollections = () =>
  Object.entries(COLLECTIONS).map(([name, config]) => ({
    name,
    key: config.key,
    path: `/api/${name}`,
  }));

export const getCollectionConfig = (collection) => COLLECTIONS[collection] || null;

const collectionPath = (collection) => {
  const config = getCollectionConfig(collection);
  if (!config) return null;
  return path.join(DATA_DIR, config.file);
};

export const getStorageMode = () => (DATABASE_URL ? "postgres" : "json");

const normalizeDatabaseUrl = (value) => {
  if (!value || !DATABASE_SSL || DATABASE_SSL_REJECT_UNAUTHORIZED) return value;

  try {
    const url = new URL(value);
    const sslMode = url.searchParams.get("sslmode");
    if (sslMode && !url.searchParams.has("uselibpqcompat")) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  } catch {
    return value;
  }
};

const getPool = async () => {
  if (!DATABASE_URL) return null;
  if (pool) return pool;
  const { Pool } = await import("pg");
  pool = new Pool({
    connectionString: normalizeDatabaseUrl(DATABASE_URL),
    ssl: DATABASE_SSL ? { rejectUnauthorized: DATABASE_SSL_REJECT_UNAUTHORIZED } : false,
    connectionTimeoutMillis: DATABASE_CONNECTION_TIMEOUT_MS,
  });
  pool.on("error", (error) => {
    console.error("Postgres pool error", error);
  });
  return pool;
};

const ensureDatabase = async () => {
  const client = await getPool();
  if (!client || dbReady) return client;
  await client.query(`
    CREATE TABLE IF NOT EXISTS portfolio_collections (
      collection TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  dbReady = true;
  return client;
};

const readJsonFile = async (collection) => {
  const config = getCollectionConfig(collection);
  const filePath = collectionPath(collection);
  if (!config || !filePath) return null;

  const raw = await readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  const items = Array.isArray(data[config.key]) ? data[config.key] : [];
  return { config, items };
};

const readDatabaseCollection = async (collection) => {
  const config = getCollectionConfig(collection);
  if (!config) return null;

  const client = await ensureDatabase();
  const result = await client.query("SELECT payload FROM portfolio_collections WHERE collection = $1", [collection]);
  if (result.rows[0]) {
    const payload = result.rows[0].payload || {};
    const items = Array.isArray(payload[config.key]) ? payload[config.key] : [];
    return { config, items };
  }

  const seeded = await readJsonFile(collection);
  await writeDatabaseCollection(collection, seeded?.items || []);
  return seeded || { config, items: [] };
};

const writeDatabaseCollection = async (collection, items) => {
  const config = getCollectionConfig(collection);
  if (!config) return null;

  const client = await ensureDatabase();
  const payload = { [config.key]: items };
  await client.query(
    `
      INSERT INTO portfolio_collections (collection, payload, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (collection)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
    `,
    [collection, JSON.stringify(payload)]
  );
  return payload;
};

export const readCollection = async (collection) => {
  if (DATABASE_URL) return readDatabaseCollection(collection);
  return readJsonFile(collection);
};

export const readAllCollections = async () => {
  const entries = await Promise.all(
    Object.keys(COLLECTIONS).map(async (collection) => {
      await ensureItemIds(collection);
      const result = await readCollection(collection);
      return [result.config.key, result.items];
    })
  );
  return Object.fromEntries(entries);
};

export const writeCollection = async (collection, items) => {
  if (DATABASE_URL) return writeDatabaseCollection(collection, items);

  const config = getCollectionConfig(collection);
  const filePath = collectionPath(collection);
  if (!config || !filePath) return null;

  await mkdir(DATA_DIR, { recursive: true });
  const payload = {
    [config.key]: items,
  };
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
};

export const replaceCollection = async (collection, payload) => {
  const config = getCollectionConfig(collection);
  if (!config) return null;

  const items = Array.isArray(payload) ? payload : payload?.[config.key];
  if (!Array.isArray(items)) {
    throw new Error(`Expected an array or an object with "${config.key}" array.`);
  }

  await writeCollection(collection, items);
  await ensureItemIds(collection);
  const result = await readCollection(collection);
  return { [config.key]: result.items };
};

export const replaceAllCollections = async (payload) => {
  const result = {};

  for (const [collection, config] of Object.entries(COLLECTIONS)) {
    if (!Object.hasOwn(payload, config.key)) continue;
    result[config.key] = (await replaceCollection(collection, payload[config.key]))[config.key];
  }

  return result;
};

export const ensureItemIds = async (collection) => {
  const result = await readCollection(collection);
  if (!result) return null;

  let changed = false;
  const seen = new Set();
  const items = result.items.map((item) => {
    let id = item.id || slugify(item.title || item.name || item.role || item.company || "");
    if (!id || seen.has(id)) {
      id = createId(item);
    }
    seen.add(id);
    if (item.id === id) return item;
    changed = true;
    return { id, ...item };
  });

  if (changed) await writeCollection(collection, items);
  return items;
};

export const getItem = async (collection, id) => {
  const result = await readCollection(collection);
  if (!result) return null;
  return result.items.find((item) => item.id === id) || null;
};

export const createItem = async (collection, item) => {
  const result = await readCollection(collection);
  if (!result) return null;

  const now = new Date().toISOString();
  const nextItem = {
    id: item.id || createId(item),
    ...item,
    createdAt: item.createdAt || now,
    updatedAt: now,
  };
  const items = [...result.items, nextItem];
  await writeCollection(collection, items);
  return nextItem;
};

export const replaceItem = async (collection, id, item) => {
  const result = await readCollection(collection);
  if (!result) return null;

  const index = result.items.findIndex((entry) => entry.id === id);
  if (index === -1) return false;

  const nextItem = {
    id,
    ...item,
    updatedAt: new Date().toISOString(),
  };
  const items = [...result.items];
  items[index] = nextItem;
  await writeCollection(collection, items);
  return nextItem;
};

export const updateItem = async (collection, id, patch) => {
  const result = await readCollection(collection);
  if (!result) return null;

  const index = result.items.findIndex((entry) => entry.id === id);
  if (index === -1) return false;

  const nextItem = {
    ...result.items[index],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  const items = [...result.items];
  items[index] = nextItem;
  await writeCollection(collection, items);
  return nextItem;
};

export const deleteItem = async (collection, id) => {
  const result = await readCollection(collection);
  if (!result) return null;

  const items = result.items.filter((item) => item.id !== id);
  if (items.length === result.items.length) return false;

  await writeCollection(collection, items);
  return true;
};
