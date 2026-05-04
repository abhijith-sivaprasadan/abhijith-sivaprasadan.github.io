const apiBaseInput = document.querySelector("[data-api-base]");
const tokenInput = document.querySelector("[data-api-token]");
const connectButton = document.querySelector("[data-connect-api]");
const clearTokenButton = document.querySelector("[data-clear-token]");
const googleSignInButton = document.querySelector("[data-google-sign-in]");
const googleSignOutButton = document.querySelector("[data-google-sign-out]");
const collectionList = document.querySelector("[data-collection-list]");
const adminSummary = document.querySelector("[data-admin-summary]");
const statusEl = document.querySelector("[data-admin-status]");
const authStatusEl = document.querySelector("[data-auth-status]");
const editorTitle = document.querySelector("[data-editor-title]");
const recordSelect = document.querySelector("[data-record-select]");
const recordSearch = document.querySelector("[data-record-search]");
const recordList = document.querySelector("[data-record-list]");
const recordForm = document.querySelector("[data-record-form]");
const recordPreview = document.querySelector("[data-record-preview]");
const jsonEditor = document.querySelector("[data-json-editor]");
const newRecordButton = document.querySelector("[data-new-record]");
const saveRecordButton = document.querySelector("[data-save-record]");
const deleteRecordButton = document.querySelector("[data-delete-record]");
const refreshRecordsButton = document.querySelector("[data-refresh-records]");
const formatJsonButton = document.querySelector("[data-format-json]");
const duplicateRecordButton = document.querySelector("[data-duplicate-record]");
const copyJsonButton = document.querySelector("[data-copy-json]");
const moveRecordButtons = document.querySelectorAll("[data-move-record]");

const storageKey = "portfolio-admin-api";

const state = {
  collections: [],
  activeCollection: "",
  activeKey: "",
  records: [],
  activeId: "",
  search: "",
  firebaseReady: false,
  auth: null,
  provider: null,
  user: null,
  idToken: "",
};

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", isError);
};

const apiBase = () => apiBaseInput.value.trim().replace(/\/$/, "");
const token = () => state.idToken || tokenInput.value.trim();
const collectionUrl = (collection, id = "") => `${apiBase()}/api/${collection}${id ? `/${encodeURIComponent(id)}` : ""}`;

const setAuthStatus = (message, isError = false) => {
  authStatusEl.textContent = message;
  authStatusEl.classList.toggle("is-error", isError);
};

const escapeHtml = (value = "") =>
  value
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const recordLabel = (record) => record.title || record.name || record.role || record.company || record.id || "Untitled";
const recordMeta = (record) =>
  [record.issuer, record.company, record.associatedWith, record.period, record.issued, record.code].filter(Boolean).join(" - ");

const filteredRecords = () => {
  const query = state.search.trim().toLowerCase();
  if (!query) return state.records;
  return state.records.filter((record) => JSON.stringify(record).toLowerCase().includes(query));
};

const schemaFields = {
  certifications: ["status", "featured", "order", "title", "issuer", "issued", "expires", "credentialId", "link.label", "link.url"],
  projects: ["status", "featured", "order", "category", "title", "period", "associatedWith", "summary", "tools", "skills", "image", "caseStudyUrl", "repoUrl", "highlights"],
  experience: ["status", "featured", "order", "role", "company", "type", "period", "location", "summary", "tools", "skills", "detailUrl"],
  courses: ["status", "featured", "order", "title", "code", "associatedWith"],
  skills: ["status", "featured", "order", "name", "skills"],
};

const getPath = (object, path) =>
  path.split(".").reduce((current, key) => (current && Object.hasOwn(current, key) ? current[key] : ""), object);

const setPath = (object, path, value) => {
  const keys = path.split(".");
  const finalKey = keys.pop();
  const target = keys.reduce((current, key) => {
    current[key] = current[key] && typeof current[key] === "object" ? current[key] : {};
    return current[key];
  }, object);
  target[finalKey] = value;
};

const fieldLabels = {
  title: "Title",
  issuer: "Issued by",
  issued: "Issue date",
  expires: "Expiry date",
  credentialId: "Credential ID",
  "link.label": "Link button text",
  "link.url": "Credential link",
  status: "Visibility",
  featured: "Featured",
  order: "Display order",
  category: "Category",
  image: "Image path",
  caseStudyUrl: "Case study link",
  repoUrl: "GitHub link",
  highlights: "Highlights, separated by commas",
  period: "Timeline",
  associatedWith: "Associated with",
  summary: "Description",
  tools: "Tools, separated by commas",
  skills: "Skills, separated by commas",
  role: "Role title",
  company: "Company or organisation",
  type: "Employment type",
  location: "Location",
  code: "Course code",
  name: "Group name",
};

const fieldHints = {
  summary: "Write normal website copy. Keep it concise and outcome-focused.",
  tools: "Example: Python, ANSYS Fluent, LabVIEW",
  skills: "Example: Energy systems analysis, CFD, Technical reporting",
  "link.url": "Paste the full URL starting with https://",
  order: "Lower numbers appear first.",
  highlights: "Write short proof points separated by commas.",
};

const fieldLabel = (field) => fieldLabels[field] || field.replaceAll(".", " ").replace(/([a-z])([A-Z])/g, "$1 $2");

const parseFieldValue = (value) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseTypedValue = (field, value, element) => {
  if (field === "featured") return element.checked;
  if (field === "order") return Number(value) || 999;
  if (element.dataset.arrayField === "true") return parseFieldValue(value);
  return value;
};

const syncJsonEditorToForm = () => {
  try {
    const record = JSON.parse(jsonEditor.value || "{}");
    renderRecordForm(record);
    renderPreview(record);
  } catch {
    // Keep the raw editor usable while invalid JSON is being typed.
  }
};

const validatePayload = (payload) => {
  const title = payload.title || payload.role || payload.name;
  if (!title?.trim()) return "Title, role or group name is required.";
  if (payload.link?.url && !/^https?:\/\//i.test(payload.link.url)) return "Credential link must start with http:// or https://.";
  if (payload.caseStudyUrl && !/^(https?:\/\/|projects\/)/i.test(payload.caseStudyUrl)) return "Case study link must be a URL or projects/... path.";
  if (payload.repoUrl && !/^https?:\/\//i.test(payload.repoUrl)) return "GitHub link must start with http:// or https://.";
  return "";
};

const renderPreview = (record) => {
  if (!recordPreview) return;
  if (!record || !Object.keys(record).length) {
    recordPreview.innerHTML = `<p class="admin-empty">Select or create an item to preview how it will look publicly.</p>`;
    return;
  }

  const tags = [...(record.tools || []), ...(record.skills || [])].slice(0, 5);
  const title = record.title || record.role || record.name || "Untitled item";
  const subtitle = [record.company, record.issuer, record.associatedWith, record.period, record.code].filter(Boolean).join(" - ");

  recordPreview.innerHTML = `
    <article class="admin-preview-card">
      <div class="tag-row">
        <span>${escapeHtml(record.status || "published")}</span>
        ${record.featured ? "<span>Featured</span>" : ""}
        ${record.category ? `<span>${escapeHtml(record.category)}</span>` : ""}
      </div>
      <h3>${escapeHtml(title)}</h3>
      ${subtitle ? `<p class="meta">${escapeHtml(subtitle)}</p>` : ""}
      <p>${escapeHtml(record.summary || (record.skills || []).join(", ") || "")}</p>
      ${tags.length ? `<div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
    </article>`;
};

const requestJson = async (url, options = {}) => {
  if (state.user) {
    state.idToken = await state.user.getIdToken();
  }

  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.error || `Request failed with ${response.status}`);
  }
  return data;
};

const saveConnection = () => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      apiBaseUrl: apiBaseInput.value.trim(),
      token: tokenInput.value.trim(),
    })
  );
};

const loadConnection = async () => {
  try {
    await import("./public-config.js");
  } catch {
    // Optional committed config.
  }

  try {
    await import("./config.js");
  } catch {
    // Optional local config. The admin page can also be configured manually.
  }

  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  apiBaseInput.value = saved.apiBaseUrl || globalThis.PORTFOLIO_API_BASE_URL || "http://127.0.0.1:3000";
  tokenInput.value = saved.token || "";
};

const initializeGoogleAuth = async () => {
  const config = globalThis.PORTFOLIO_AUTH_CONFIG || {};
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    googleSignInButton.disabled = true;
    googleSignOutButton.disabled = true;
    setAuthStatus("Google admin login needs Firebase config. Token fallback is available.");
    return;
  }

  try {
    const [{ initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }] =
      await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js"),
      ]);

    const app = initializeApp(config);
    state.auth = getAuth(app);
    state.provider = new GoogleAuthProvider();
    state.provider.setCustomParameters({ prompt: "select_account" });
    state.firebaseReady = true;

    onAuthStateChanged(state.auth, async (user) => {
      state.user = user;
      state.idToken = user ? await user.getIdToken() : "";
      googleSignInButton.disabled = Boolean(user);
      googleSignOutButton.disabled = !user;
      setAuthStatus(user?.email ? `Signed in as ${user.email}` : "Not signed in with Google.");
    });
  } catch (error) {
    googleSignInButton.disabled = true;
    googleSignOutButton.disabled = true;
    setAuthStatus(error instanceof Error ? error.message : "Google admin login failed to load.", true);
  }
};

const renderCollections = () => {
  const counts = new Map();
  if (state.activeCollection) {
    counts.set(state.activeCollection, state.records.length);
  }

  adminSummary.innerHTML = state.collections
    .map(
      (collection) => `
        <div class="admin-summary-card">
          <strong>${counts.get(collection.name) ?? "..."}</strong>
          <span>${escapeHtml(collection.name)}</span>
        </div>`
    )
    .join("");

  collectionList.innerHTML = state.collections
    .map(
      (collection) => `
        <button type="button" class="admin-collection-button ${
          collection.name === state.activeCollection ? "is-active" : ""
        }" data-collection-name="${collection.name}" data-collection-key="${collection.key}">
          <span>${collection.name}</span>
          <small>${collection.path}</small>
        </button>`
    )
    .join("");
};

const activeRecord = () => state.records.find((record) => record.id === state.activeId) || null;

const renderRecordList = () => {
  const records = filteredRecords();
  recordList.innerHTML = records.length
    ? records
        .map(
          (record) => `
            <button type="button" class="admin-record-button ${
              record.id === state.activeId ? "is-active" : ""
            }" data-record-id="${escapeHtml(record.id)}">
              <span>${escapeHtml(recordLabel(record))}</span>
              <small>${escapeHtml(recordMeta(record) || record.id)}</small>
            </button>`
        )
        .join("")
    : `<p class="admin-empty">No records match the current search.</p>`;
};

const renderRecordForm = (record) => {
  const fields = schemaFields[state.activeCollection] || [];
  if (!record || !fields.length) {
    recordForm.innerHTML = "";
    return;
  }

  recordForm.innerHTML = fields
    .map((field) => {
      const value = getPath(record, field);
      const isArray = Array.isArray(value) || ["tools", "skills", "highlights"].includes(field);
      const isLong = field === "summary";
      const stringValue = Array.isArray(value) ? value.join(", ") : value || "";
      let control = "";
      if (field === "status") {
        control = `<select data-form-field="${field}"><option value="published" ${
          value !== "draft" ? "selected" : ""
        }>Published</option><option value="draft" ${value === "draft" ? "selected" : ""}>Draft</option></select>`;
      } else if (field === "featured") {
        control = `<label class="admin-check"><input type="checkbox" data-form-field="${field}" ${
          value ? "checked" : ""
        } /> Show as featured</label>`;
      } else if (field === "order") {
        control = `<input type="number" data-form-field="${field}" value="${escapeHtml(value || 999)}" min="1" step="1" />`;
      } else {
        control = isLong
          ? `<textarea data-form-field="${field}" rows="4">${escapeHtml(stringValue)}</textarea>`
          : `<input type="text" data-form-field="${field}" value="${escapeHtml(stringValue)}" ${
              isArray ? 'data-array-field="true"' : ""
            } />`;
      }

      return `
        <label class="admin-field">
          <span>${escapeHtml(fieldLabel(field))}</span>
          ${control}
          ${fieldHints[field] ? `<small>${escapeHtml(fieldHints[field])}</small>` : ""}
        </label>`;
    })
    .join("");
};

const renderRecords = () => {
  const records = filteredRecords();
  recordSelect.innerHTML = records
    .map((record) => {
      return `<option value="${record.id}">${escapeHtml(recordLabel(record))}</option>`;
    })
    .join("");

  if (!state.activeId && records[0]) {
    state.activeId = records[0].id;
  }

  recordSelect.value = state.activeId;
  const record = activeRecord();
  jsonEditor.value = record ? JSON.stringify(record, null, 2) : "";
  editorTitle.textContent = state.activeCollection ? `${state.activeCollection} records` : "Select a collection";
  renderRecordList();
  renderRecordForm(record);
  renderPreview(record);
};

const loadCollections = async () => {
  if (!apiBase()) {
    setStatus("API base URL is required.", true);
    return;
  }

  const data = await requestJson(`${apiBase()}/api`);
  state.collections = Array.isArray(data.collections) ? data.collections : [];
  state.activeCollection = state.activeCollection || state.collections[0]?.name || "";
  state.activeKey = state.collections.find((collection) => collection.name === state.activeCollection)?.key || "";
  renderCollections();

  if (state.activeCollection) {
    await loadRecords(state.activeCollection, state.activeKey);
  }

  saveConnection();
  setStatus(`Connected to ${apiBase()}`);
};

const loadRecords = async (collection, key) => {
  state.activeCollection = collection;
  state.activeKey = key;
  state.activeId = "";
  state.search = "";
  recordSearch.value = "";
  const data = await requestJson(collectionUrl(collection));
  state.records = Array.isArray(data[key]) ? data[key] : [];
  renderCollections();
  renderRecords();
};

collectionList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-collection-name]");
  if (!button) return;

  try {
    await loadRecords(button.dataset.collectionName, button.dataset.collectionKey);
    setStatus(`Loaded ${button.dataset.collectionName}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

recordSelect.addEventListener("change", () => {
  state.activeId = recordSelect.value;
  renderRecords();
});

recordSearch.addEventListener("input", () => {
  state.search = recordSearch.value;
  const records = filteredRecords();
  if (!records.some((record) => record.id === state.activeId)) {
    state.activeId = records[0]?.id || "";
  }
  renderRecords();
});

recordList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-record-id]");
  if (!button) return;
  state.activeId = button.dataset.recordId;
  renderRecords();
});

recordForm.addEventListener("input", (event) => {
  const field = event.target.closest("[data-form-field]");
  if (!field) return;

  try {
    const record = JSON.parse(jsonEditor.value || "{}");
    const value = parseTypedValue(field.dataset.formField, field.type === "checkbox" ? field.checked : field.value, field);
    setPath(record, field.dataset.formField, value);
    jsonEditor.value = JSON.stringify(record, null, 2);
    renderPreview(record);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not update JSON from form.", true);
  }
});

newRecordButton.addEventListener("click", () => {
  state.activeId = "";
  recordSelect.value = "";
  const defaults = {
    certifications: { status: "draft", featured: false, order: state.records.length + 1, title: "New certification", issuer: "", issued: "", credentialId: "", link: { label: "Credential", url: "" } },
    projects: { status: "draft", featured: false, order: state.records.length + 1, category: "Energy Systems", title: "New project", period: "", associatedWith: "", summary: "", tools: [], skills: [], highlights: [] },
    experience: { status: "draft", featured: false, order: state.records.length + 1, role: "New role", company: "", period: "", location: "", summary: "", tools: [], skills: [] },
    courses: { status: "draft", featured: false, order: state.records.length + 1, title: "New course", code: "", associatedWith: "" },
    skills: { status: "draft", featured: false, order: state.records.length + 1, name: "New skill group", skills: [] },
  };
  jsonEditor.value = JSON.stringify(defaults[state.activeCollection] || { title: "New record" }, null, 2);
  syncJsonEditorToForm();
  editorTitle.textContent = `New ${state.activeCollection || "record"}`;
});

formatJsonButton.addEventListener("click", () => {
  try {
    const payload = JSON.parse(jsonEditor.value || "{}");
    jsonEditor.value = JSON.stringify(payload, null, 2);
    renderRecordForm(payload);
    setStatus("JSON formatted.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Invalid JSON.", true);
  }
});

duplicateRecordButton.addEventListener("click", () => {
  const record = activeRecord();
  if (!record) {
    setStatus("Select a record before duplicating.", true);
    return;
  }

  const copy = { ...record };
  delete copy.id;
  copy.title = copy.title ? `${copy.title} copy` : copy.title;
  copy.name = copy.name ? `${copy.name} copy` : copy.name;
  jsonEditor.value = JSON.stringify(copy, null, 2);
  state.activeId = "";
  renderRecordForm(copy);
  setStatus("Duplicated into an unsaved new record.");
});

copyJsonButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(jsonEditor.value);
  setStatus("Copied JSON to clipboard.");
});

jsonEditor.addEventListener("input", syncJsonEditorToForm);

moveRecordButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const record = activeRecord();
    if (!record) {
      setStatus("Select an item before changing order.", true);
      return;
    }

    const direction = button.dataset.moveRecord === "up" ? -1 : 1;
    const currentOrder = Number(record.order) || state.records.findIndex((item) => item.id === record.id) + 1;
    record.order = Math.max(1, currentOrder + direction);
    jsonEditor.value = JSON.stringify(record, null, 2);
    syncJsonEditorToForm();
    setStatus("Order changed. Publish changes to save it.");
  });
});

saveRecordButton.addEventListener("click", async () => {
  if (!state.activeCollection) {
    setStatus("Select a collection before saving.", true);
    return;
  }

  try {
    const payload = JSON.parse(jsonEditor.value);
    const validationError = validatePayload(payload);
    if (validationError) {
      setStatus(validationError, true);
      return;
    }
    const existingId = payload.id && state.records.some((record) => record.id === payload.id) ? payload.id : "";
    const method = existingId ? "PUT" : "POST";
    const url = existingId ? collectionUrl(state.activeCollection, existingId) : collectionUrl(state.activeCollection);
    const saved = await requestJson(url, {
      method,
      body: JSON.stringify(payload),
    });
    state.search = "";
    recordSearch.value = "";
    await loadRecords(state.activeCollection, state.activeKey);
    state.activeId = saved.id;
    renderRecords();
    setStatus(`Saved ${saved.id}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

deleteRecordButton.addEventListener("click", async () => {
  const record = activeRecord();
  if (!record) {
    setStatus("Select a record before deleting.", true);
    return;
  }

  if (!window.confirm(`Delete ${record.id}?`)) return;

  try {
    await requestJson(collectionUrl(state.activeCollection, record.id), { method: "DELETE" });
    await loadRecords(state.activeCollection, state.activeKey);
    setStatus(`Deleted ${record.id}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

refreshRecordsButton.addEventListener("click", async () => {
  try {
    await loadRecords(state.activeCollection, state.activeKey);
    setStatus(`Refreshed ${state.activeCollection}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

connectButton.addEventListener("click", async () => {
  try {
    await loadCollections();
  } catch (error) {
    setStatus(error.message, true);
  }
});

clearTokenButton.addEventListener("click", () => {
  tokenInput.value = "";
  saveConnection();
  setStatus("Token cleared from this browser.");
});

googleSignInButton.addEventListener("click", async () => {
  if (!state.firebaseReady) return;
  const { signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js");
  try {
    await signInWithPopup(state.auth, state.provider);
  } catch (error) {
    setAuthStatus(error instanceof Error ? error.message : "Google sign-in failed.", true);
  }
});

googleSignOutButton.addEventListener("click", async () => {
  if (!state.firebaseReady) return;
  const { signOut } = await import("https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js");
  await signOut(state.auth);
});

await loadConnection();
await initializeGoogleAuth();
