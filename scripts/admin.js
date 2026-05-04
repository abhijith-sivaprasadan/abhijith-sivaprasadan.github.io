const apiBaseInput = document.querySelector("[data-api-base]");
const tokenInput = document.querySelector("[data-api-token]");
const connectButton = document.querySelector("[data-connect-api]");
const clearTokenButton = document.querySelector("[data-clear-token]");
const googleSignInButton = document.querySelector("[data-google-sign-in]");
const googleSignOutButton = document.querySelector("[data-google-sign-out]");
const collectionList = document.querySelector("[data-collection-list]");
const statusEl = document.querySelector("[data-admin-status]");
const authStatusEl = document.querySelector("[data-auth-status]");
const editorTitle = document.querySelector("[data-editor-title]");
const recordSelect = document.querySelector("[data-record-select]");
const jsonEditor = document.querySelector("[data-json-editor]");
const newRecordButton = document.querySelector("[data-new-record]");
const saveRecordButton = document.querySelector("[data-save-record]");
const deleteRecordButton = document.querySelector("[data-delete-record]");
const refreshRecordsButton = document.querySelector("[data-refresh-records]");

const storageKey = "portfolio-admin-api";

const state = {
  collections: [],
  activeCollection: "",
  activeKey: "",
  records: [],
  activeId: "",
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

const renderRecords = () => {
  recordSelect.innerHTML = state.records
    .map((record) => {
      const label = record.title || record.name || record.role || record.company || record.id;
      return `<option value="${record.id}">${label}</option>`;
    })
    .join("");

  if (!state.activeId && state.records[0]) {
    state.activeId = state.records[0].id;
  }

  recordSelect.value = state.activeId;
  const record = activeRecord();
  jsonEditor.value = record ? JSON.stringify(record, null, 2) : "";
  editorTitle.textContent = state.activeCollection ? `${state.activeCollection} records` : "Select a collection";
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

newRecordButton.addEventListener("click", () => {
  state.activeId = "";
  recordSelect.value = "";
  jsonEditor.value = JSON.stringify({ title: "New record" }, null, 2);
  editorTitle.textContent = `New ${state.activeCollection || "record"}`;
});

saveRecordButton.addEventListener("click", async () => {
  if (!state.activeCollection) {
    setStatus("Select a collection before saving.", true);
    return;
  }

  try {
    const payload = JSON.parse(jsonEditor.value);
    const existingId = payload.id && state.records.some((record) => record.id === payload.id) ? payload.id : "";
    const method = existingId ? "PUT" : "POST";
    const url = existingId ? collectionUrl(state.activeCollection, existingId) : collectionUrl(state.activeCollection);
    const saved = await requestJson(url, {
      method,
      body: JSON.stringify(payload),
    });
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
