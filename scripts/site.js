const progressBar = document.querySelector(".scroll-progress");
const scenes = document.querySelectorAll(".scroll-scene");
const navLinks = document.querySelector(".nav-links");
const newsletterForm = document.querySelector("[data-newsletter-form]");
const certificationsList = document.querySelector("[data-certifications-endpoint]");
const dynamicProjects = document.querySelector("[data-dynamic-projects]");
const featuredProjects = document.querySelector("[data-featured-projects]");
const projectFilters = document.querySelector("[data-project-filters]");
const projectSearch = document.querySelector("[data-project-search]");
const projectCount = document.querySelector("[data-project-count]");
const dynamicExperienceBlocks = document.querySelectorAll("[data-dynamic-experience]");
const dynamicSkillBlocks = document.querySelectorAll("[data-dynamic-skills]");
const dynamicCourseBlocks = document.querySelectorAll("[data-dynamic-courses]");
const dynamicIdeaBlocks = document.querySelectorAll("[data-dynamic-ideas]");
const ideaSubmissionPanel = document.querySelector("[data-idea-submit-panel]");
const ideaSubmissionStatus = document.querySelector("[data-idea-submit-status]");
const ideaSubmissionForm = document.querySelector("[data-idea-submit-form]");
const ideaSignInButton = document.querySelector("[data-idea-sign-in]");
const ideaSignOutButton = document.querySelector("[data-idea-sign-out]");
const isNestedPage = location.pathname.includes("/projects/") || location.pathname.includes("/experience/");
const basePath = isNestedPage ? "../" : "";
const inferredPageKey = (() => {
  const currentFile = location.pathname.split("/").pop() || "index.html";
  if (currentFile === "index.html") return "home";
  return currentFile.replace(/\.html$/, "");
})();
const pageKey = document.body.dataset.pageKey || inferredPageKey;
const localEditorEnabled = document.body.dataset.enableLocalEditor === "true";
const storeKey = "abhijith-portfolio-edit-v1";
const assetVersion = "20260505-data-v4";
const apiVersion = "20260504-api-v4";
let authConfig = window.PORTFOLIO_AUTH_CONFIG || {};
let newsletterAction = window.PORTFOLIO_NEWSLETTER_ACTION || "";
let apiBaseUrl = window.PORTFOLIO_API_BASE_URL || "https://abhijith-portfolio-api.onrender.com";
let adminEmailHashes = new Set(
  window.PORTFOLIO_ADMIN_EMAIL_HASHES || [
    "82ff3995db9c955db8a17b3565c7b354a53bb6d0b6351e783e3ff8b2a5910b8f",
    "ad42bd9249794a48b4f0b94bff7e0c54a330fac37ee239db64441448a901cf2d",
  ]
);
const ideaSubmissionAuth = {
  ready: false,
  user: null,
  auth: null,
  provider: null,
};
const pageState = {
  projects: [],
  activeProjectFilter: "Selected",
  projectSearch: "",
};

const hashEmail = async (email) => {
  const data = new TextEncoder().encode(email.toLowerCase());
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
};
const editableFields = document.querySelectorAll("[data-editable]");
const collections = document.querySelectorAll("[data-collection]");
let editorToolbar = null;
const authState = {
  ready: false,
  user: null,
  admin: false,
  auth: null,
  provider: null,
  signIn: null,
  signOut: null,
  error: null,
};

const getStore = () => {
  try {
    return JSON.parse(localStorage.getItem(storeKey)) || {};
  } catch {
    return {};
  }
};

const setStore = (store) => {
  localStorage.setItem(storeKey, JSON.stringify(store));
};

const savePageState = () => {
  if (!pageKey || !authState.admin) return;

  const store = getStore();
  const fields = {};
  editableFields.forEach((field) => {
    if (!field.dataset.editable) return;
    fields[field.dataset.editable] = field.innerHTML;
  });

  const collectionState = {};
  collections.forEach((collection) => {
    collectionState[collection.dataset.collection] = collection.innerHTML;
  });

  store[pageKey] = { fields, collections: collectionState };
  setStore(store);
};

const applySavedState = () => {
  if (!pageKey || !authState.admin) return;

  const saved = getStore()[pageKey];
  if (!saved) return;

  editableFields.forEach((field) => {
    const key = field.dataset.editable;
    if (saved.fields?.[key]) {
      field.innerHTML = saved.fields[key];
    }
  });

  collections.forEach((collection) => {
    const key = collection.dataset.collection;
    if (saved.collections?.[key]) {
      collection.innerHTML = saved.collections[key];
    }
  });
};

const makeEditable = (enabled) => {
  const active = authState.admin && enabled;
  document.body.classList.toggle("is-edit-mode", active);
  editableFields.forEach((field) => {
    field.contentEditable = active ? "true" : "false";
    field.spellcheck = active;
  });
  collections.forEach((collection) => {
    collection.querySelectorAll("[data-editable]").forEach((field) => {
      field.contentEditable = active ? "true" : "false";
      field.spellcheck = active;
    });
  });
};

const createCollectionItem = (collectionName) => {
  const templates = {
    about: `
      <article class="entry-card">
        <h3 data-editable="title">New profile note</h3>
        <p data-editable="summary">Add a concise visitor-facing note about background, routine or current direction.</p>
      </article>`,
    hobbies: `
      <article class="entry-card">
        <h3 data-editable="title">New hobby</h3>
        <p data-editable="summary">Add a concise description of the hobby and how it fits the broader profile.</p>
      </article>`,
    interests: `
      <article class="entry-card">
        <h3 data-editable="title">New interest</h3>
        <p data-editable="summary">Add a field, topic or reading thread connected to the technical direction.</p>
      </article>`,
    ideas: `
      <article class="entry-card">
        <span class="entry-status">Idea</span>
        <h3 data-editable="title">New project idea</h3>
        <p data-editable="summary">Add the concept, the reason it matters and the expected toolchain.</p>
      </article>`,
  };

  const wrapper = document.createElement("div");
  wrapper.innerHTML = templates[collectionName] || templates.ideas;
  const item = wrapper.firstElementChild;
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "entry-remove";
  removeButton.textContent = "Remove";
  item.prepend(removeButton);
  return item;
};

const syncCollectionEditability = () => {
  const enabled = document.body.classList.contains("is-edit-mode");
  collections.forEach((collection) => {
    collection.querySelectorAll("[data-editable]").forEach((field) => {
      field.contentEditable = enabled ? "true" : "false";
      field.spellcheck = enabled;
    });
  });
};

const updateEditorToolbar = () => {
  if (!editorToolbar) return;

  const status = editorToolbar.querySelector("[data-editor-status]");
  const authButton = editorToolbar.querySelector("[data-editor-action='auth']");
  const editButton = editorToolbar.querySelector("[data-editor-action='toggle']");
  const saveButton = editorToolbar.querySelector("[data-editor-action='save']");
  const resetButton = editorToolbar.querySelector("[data-editor-action='reset']");
  const email = authState.user?.email?.toLowerCase() || "";

  if (!authConfig.apiKey || !authConfig.authDomain || !authConfig.projectId || !authConfig.appId) {
    status.textContent = "Admin login needs Firebase config";
    authButton.textContent = "Configure";
    authButton.disabled = true;
    editButton.hidden = true;
    saveButton.hidden = true;
    resetButton.hidden = true;
    return;
  }

  if (authState.error) {
    status.textContent = "Admin auth unavailable";
    authButton.textContent = "Retry";
    authButton.disabled = false;
    editButton.hidden = true;
    saveButton.hidden = true;
    resetButton.hidden = true;
    return;
  }

  if (!authState.ready) {
    status.textContent = "Connecting admin login";
    authButton.textContent = "Loading";
    authButton.disabled = true;
    editButton.hidden = true;
    saveButton.hidden = true;
    resetButton.hidden = true;
    return;
  }

  if (!authState.user) {
    status.textContent = "Sign in with Google to edit";
    authButton.textContent = "Sign in";
    authButton.disabled = false;
    editButton.hidden = true;
    saveButton.hidden = true;
    resetButton.hidden = true;
    document.body.classList.remove("is-edit-mode");
    return;
  }

  if (!authState.admin) {
    status.textContent = `Signed in as ${email}. Not in admin list.`;
    authButton.textContent = "Sign out";
    authButton.disabled = false;
    editButton.hidden = true;
    saveButton.hidden = true;
    resetButton.hidden = true;
    document.body.classList.remove("is-edit-mode");
    return;
  }

  status.textContent = `Admin: ${email} - edits saved in this browser only`;
  authButton.textContent = "Sign out";
  authButton.disabled = false;
  editButton.hidden = false;
  saveButton.hidden = false;
  resetButton.hidden = false;
  editButton.textContent = document.body.classList.contains("is-edit-mode") ? "Disable edit" : "Edit page";
};

const loadPortfolioConfig = async () => {
  try {
    await import(`${basePath}scripts/public-config.js?v=${assetVersion}`);
  } catch {
    // Optional committed public config. Static JSON remains the fallback.
  }

  try {
    await import(`${basePath}scripts/config.js?v=${assetVersion}`);
  } catch {
    // Optional local config. Missing config keeps the admin editor disabled.
  }

  authConfig = window.PORTFOLIO_AUTH_CONFIG || authConfig;
  newsletterAction = window.PORTFOLIO_NEWSLETTER_ACTION || newsletterAction;
  apiBaseUrl = window.PORTFOLIO_API_BASE_URL || apiBaseUrl;
  adminEmailHashes = new Set(window.PORTFOLIO_ADMIN_EMAIL_HASHES || Array.from(adminEmailHashes));
};

const setIdeaSubmissionStatus = (message, isError = false) => {
  if (!ideaSubmissionStatus) return;
  ideaSubmissionStatus.textContent = message;
  ideaSubmissionStatus.classList.toggle("is-error", isError);
};

const ideaApiBase = () => apiBaseUrl.replace(/\/$/, "");

// Keep this in sync with backend/src/server.js normalizeCommaSeparatedList.
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

const updateIdeaSubmissionUi = () => {
  if (!ideaSubmissionPanel) return;

  const signedIn = Boolean(ideaSubmissionAuth.user);
  if (ideaSignInButton) ideaSignInButton.disabled = signedIn || !ideaSubmissionAuth.ready;
  if (ideaSignOutButton) ideaSignOutButton.disabled = !signedIn;
  if (ideaSubmissionForm) ideaSubmissionForm.hidden = !signedIn;

  if (signedIn) {
    setIdeaSubmissionStatus(`Signed in as ${ideaSubmissionAuth.user.email}. Submissions will be saved as drafts.`);
  } else {
    setIdeaSubmissionStatus("Sign in with Google to submit an idea for review.");
  }
};

const initializeIdeaSubmission = async () => {
  if (!ideaSubmissionPanel) return;

  if (!authConfig.apiKey || !authConfig.authDomain || !authConfig.projectId || !authConfig.appId) {
    setIdeaSubmissionStatus("Google submissions are unavailable until Firebase config is loaded.", true);
    if (ideaSignInButton) ideaSignInButton.disabled = true;
    if (ideaSignOutButton) ideaSignOutButton.disabled = true;
    if (ideaSubmissionForm) ideaSubmissionForm.hidden = true;
    return;
  }

  try {
    const [{ initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js"),
    ]);

    const app = initializeApp(authConfig, "idea-submission");
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    ideaSubmissionAuth.auth = auth;
    ideaSubmissionAuth.provider = provider;
    ideaSubmissionAuth.ready = true;

    onAuthStateChanged(auth, (user) => {
      ideaSubmissionAuth.user = user;
      updateIdeaSubmissionUi();
    });

    ideaSignInButton?.addEventListener("click", async () => {
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        setIdeaSubmissionStatus(error instanceof Error ? error.message : "Google sign-in failed.", true);
      }
    });

    ideaSignOutButton?.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (error) {
        setIdeaSubmissionStatus(error instanceof Error ? error.message : "Sign-out failed.", true);
      }
    });

    if (ideaSubmissionForm) {
      ideaSubmissionForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const user = ideaSubmissionAuth.user;
        if (!user) {
          setIdeaSubmissionStatus("Sign in with Google first.", true);
          return;
        }

        const formData = new FormData(ideaSubmissionForm);
        const payload = {
          title: String(formData.get("title") || "").trim(),
          category: String(formData.get("category") || "").trim() || "Idea",
          summary: String(formData.get("summary") || "").trim(),
          tools: normalizeCommaSeparatedList(formData.get("tools") || ""),
          skills: normalizeCommaSeparatedList(formData.get("skills") || ""),
        };

        if (!payload.title || !payload.summary) {
          setIdeaSubmissionStatus("Title and summary are required.", true);
          return;
        }

        try {
          const token = await user.getIdToken();
          const response = await fetch(`${ideaApiBase()}/api/ideas?v=${apiVersion}`, {
            method: "POST",
            cache: "no-store",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.detail || data.error || `Request failed with ${response.status}`);
          }

          ideaSubmissionForm.reset();
          setIdeaSubmissionStatus(`Draft submitted for review: ${data.title || payload.title}`);
        } catch (error) {
          setIdeaSubmissionStatus(error instanceof Error ? error.message : "Failed to submit idea.", true);
        }
      });
    }

    updateIdeaSubmissionUi();
  } catch (error) {
    setIdeaSubmissionStatus(error instanceof Error ? error.message : "Google submissions failed to load.", true);
    if (ideaSignInButton) ideaSignInButton.disabled = true;
    if (ideaSignOutButton) ideaSignOutButton.disabled = true;
    if (ideaSubmissionForm) ideaSubmissionForm.hidden = true;
  }
};

const initializeAdminAuth = async () => {
  if (!authConfig.apiKey || !authConfig.authDomain || !authConfig.projectId || !authConfig.appId) {
    updateEditorToolbar();
    return;
  }

  try {
    const [{ initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js"),
    ]);

    const app = initializeApp(authConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    authState.auth = auth;
    authState.provider = provider;
    authState.signIn = () => signInWithPopup(auth, provider);
    authState.signOut = () => signOut(auth);
    authState.ready = true;

    onAuthStateChanged(auth, async (user) => {
      authState.user = user;
      if (user?.email) {
        const hash = await hashEmail(user.email);
        authState.admin = adminEmailHashes.has(hash);
      } else {
        authState.admin = false;
      }
      if (!authState.admin) {
        document.body.classList.remove("is-edit-mode");
      } else {
        applySavedState();
      }
      updateEditorToolbar();
      syncCollectionEditability();
    });
  } catch (error) {
    authState.error = error;
    updateEditorToolbar();
  }
};

const injectEditor = () => {
  if (!pageKey) return;

  const editor = document.createElement("div");
  editor.className = "editor-toolbar";
  editor.innerHTML = `
    <span class="editor-label" data-editor-status>Admin login</span>
    <button type="button" class="editor-action" data-editor-action="auth">Sign in</button>
    <button type="button" class="editor-action" data-editor-action="toggle">Edit page</button>
    <button type="button" class="editor-action" data-editor-action="save">Save</button>
    <button type="button" class="editor-action" data-editor-action="reset">Reset</button>
  `;
  document.body.append(editor);
  editorToolbar = editor;

  editor.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("[data-editor-action]");
    if (!button) return;

    const action = button.dataset.editorAction;
    if (action === "auth") {
      if (!authState.ready && authConfig.apiKey) {
        await initializeAdminAuth();
      }
      if (!authState.user) {
        try {
          await authState.signIn?.();
        } catch (error) {
          authState.error = error;
          updateEditorToolbar();
        }
      } else {
        await authState.signOut?.();
      }
    }

    if (action === "toggle" && authState.admin) {
      const enabled = !document.body.classList.contains("is-edit-mode");
      makeEditable(enabled);
      syncCollectionEditability();
      updateEditorToolbar();
      savePageState();
    }

    if (action === "save" && authState.admin) {
      savePageState();
      button.textContent = "Saved (this browser only)";
      window.setTimeout(() => {
        updateEditorToolbar();
      }, 1800);
    }

    if (action === "reset" && authState.admin) {
      const store = getStore();
      delete store[pageKey];
      setStore(store);
      window.location.reload();
    }
  });

  document.addEventListener("input", () => {
    if (!document.body.classList.contains("is-edit-mode") || !authState.admin) return;
    savePageState();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const addButton = target.closest("[data-add-entry]");
    if (addButton) {
      if (!authState.admin) return;
      const collection = document.querySelector(`[data-collection="${addButton.dataset.addEntry}"]`);
      if (!collection) return;
      collection.append(createCollectionItem(addButton.dataset.addEntry));
      makeEditable(true);
      syncCollectionEditability();
      savePageState();
      return;
    }

    const removeButton = target.closest(".entry-remove");
    if (removeButton) {
      if (!authState.admin) return;
      removeButton.closest(".entry-card")?.remove();
      savePageState();
    }
  });
};

const injectNavLinks = () => {
  if (!navLinks) return;

  const currentFile = location.pathname.split("/").pop() || "index.html";
  const homeHref = (anchor) => (pageKey === "home" ? anchor : `${basePath}index.html${anchor}`);
  const links = [
    { label: "Featured", href: homeHref("#projects") },
    { label: "Projects", href: `${basePath}projects.html` },
    { label: "Experience", href: `${basePath}experience.html` },
    { label: "CV", href: homeHref("#cv") },
    { label: "About", href: `${basePath}about.html` },
    { label: "Contact", href: homeHref("#contact") },
    { label: "Hobbies", href: `${basePath}hobbies.html` },
    { label: "Interests", href: `${basePath}interests.html` },
    { label: "Ideas", href: `${basePath}ideas.html` },
  ];

  navLinks.replaceChildren();
  links.forEach(({ label, href }) => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    const targetFile = href.split("#")[0].split("/").pop();
    const isProjectsDetail = location.pathname.includes("/projects/") && targetFile === "projects.html";
    const isExperienceDetail = location.pathname.includes("/experience/") && targetFile === "experience.html";
    if (currentFile === targetFile || isProjectsDetail || isExperienceDetail) {
      link.setAttribute("aria-current", "page");
    }
    navLinks.append(link);
  });
};

const initializeNewsletter = () => {
  if (!newsletterForm) return;
  const action = newsletterAction || newsletterForm.dataset.fallbackAction || "";
  if (action) {
    newsletterForm.action = action;
  }

  const status = newsletterForm.querySelector("[data-newsletter-status]");
  if (!action && status) {
    status.textContent = "Newsletter endpoint to be connected.";
  }

  newsletterForm.addEventListener("submit", (event) => {
    if (action) return;
    event.preventDefault();
    if (status) {
      status.textContent = "Connect a newsletter endpoint to activate this form.";
    }
  });
};

const escapeHtml = (value = "") =>
  value
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderCertification = (certification) => {
  const meta = [
    certification.issuer,
    certification.issued ? `Issued ${certification.issued}` : "",
    certification.expires ? `Expires ${certification.expires}` : "",
    certification.credentialId ? `ID ${certification.credentialId}` : "",
  ].filter(Boolean);
  const link = certification.link || {};

  return `
    <article class="certification-item">
      <div>
        <h3>${escapeHtml(certification.title)}</h3>
        <p>${meta.map(escapeHtml).join(" &middot; ")}</p>
      </div>
      ${
        link.url
          ? `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label || "Credential")}</a>`
          : ""
      }
    </article>`;
};

const apiUrl = (resource, fallback) => {
  if (!apiBaseUrl || !resource) return fallback;
  return `${apiBaseUrl.replace(/\/$/, "")}/api/${resource.replace(/^\//, "")}?v=${apiVersion}`;
};

const fetchCollection = async (resource, fallback) => {
  const fallbackUrl = fallback || `${basePath}api/${resource}.json`;
  const endpoint = apiUrl(resource, fallbackUrl);

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(`${resource} API returned ${response.status}`);
    return response.json();
  } catch (error) {
    if (endpoint !== fallbackUrl) {
      return fetchStaticCollection(fallbackUrl);
    }
    throw error;
  }
};

const fetchStaticCollection = async (fallback) => {
  const response = await fetch(fallback, { cache: "no-store" });
  if (!response.ok) throw new Error(`Static data returned ${response.status}`);
  return response.json();
};

const mergeById = (primary = [], secondary = []) => {
  const records = new Map();
  secondary.forEach((item) => {
    if (item?.id) records.set(item.id, item);
  });
  primary.forEach((item) => {
    if (item?.id) records.set(item.id, { ...(records.get(item.id) || {}), ...item });
  });
  return Array.from(records.values());
};

const visibleItems = (items = []) =>
  items
    .filter((item) => item.status !== "draft")
    .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

const itemTags = (item) => [...(item.tools || []), ...(item.skills || [])];

const primarySkillTerms = [
  "ansys fluent",
  "ni-daq",
  "labview",
  "siemens nx",
  "cfd/cht",
  "compressible cfd",
  "conjugate heat transfer",
  "k-omega sst",
  "pypsa",
  "linopy",
  "highs",
  "streamlit",
  "python",
  "iso 50001",
  "eu eed",
  "energy kpis",
  "ida ice",
  "homer pro",
  "leap",
  "sam",
  "tes",
  "heat pumps",
  "techno-economic",
  "capex",
  "teamcenter",
];

const isPrimarySkill = (label = "") => {
  const normalized = String(label).toLowerCase();
  return primarySkillTerms.some((term) => normalized.includes(term));
};

const skillProfiles = {
  "ansys-fluent": {
    title: "ANSYS Fluent",
    summary:
      "Used for the Siemens Energy thesis CFD/CHT campaign, from solver setup and convergence checks through post-processing and interpretation.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Built steady-state compressible RANS models with k-omega SST for gas turbine reducer geometries.",
          "Ran adiabatic and conjugate heat transfer cases as one thesis simulation campaign, not separate portfolio projects.",
          "Prepared boundary conditions around 673 K inlet temperature and 100 kPa gauge pressure, then interpreted pressure loss, Mach-number and thermal-delivery behavior.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Siemens Energy master thesis, TRITA-ITM-EX 2026:14.",
          "Three-level mesh independence study before the main campaign.",
          "Related certification: Applied Computational Fluid Dynamics through Siemens.",
        ],
      },
      {
        heading: "Also connected to",
        items: ["Aircraft de-icing simulation idea and other applied thermal-fluid study directions."],
      },
    ],
    links: [
      { label: "Siemens thesis case study", href: "projects/siemens-thesis.html" },
      { label: "Siemens Energy experience", href: "experience/siemens-energy.html" },
      { label: "Ideas", href: "ideas.html" },
    ],
  },
  "ni-daq": {
    title: "NI-DAQ",
    summary:
      "Hands-on data acquisition experience from the Siemens Energy high-temperature Pulsatorn rig and related instrumentation work.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Commissioned measurement channels for thermocouples, static pressure and dynamic pressure instrumentation.",
          "Supported validation planning for tests up to 700 C.",
          "Used the measurement chain during heater-failure investigation and scope-change documentation.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Siemens Energy Fluid Dynamic Lab thesis work.",
          "Root cause analysis connecting instrument behavior, hardware constraints and test conditions.",
        ],
      },
      {
        heading: "Personal overlap",
        items: ["The same practical mindset shows up in smart home tinkering, sensors and day-to-day automation ideas."],
      },
    ],
    links: [
      { label: "Siemens Energy experience", href: "experience/siemens-energy.html" },
      { label: "Siemens thesis case study", href: "projects/siemens-thesis.html" },
      { label: "Hobbies", href: "hobbies.html" },
    ],
  },
  labview: {
    title: "LabVIEW",
    summary:
      "Used for test-rig data acquisition, channel coordination and logging during Siemens Energy thesis instrumentation work.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Modified an existing LabVIEW VI to synchronize and log the measurement channels used on the rig.",
          "Connected software-side data capture with hardware constraints during thermal test planning.",
          "Used the VI workflow alongside NI-DAQ hardware during high-temperature validation work.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Mentioned across the Siemens thesis project, Siemens Energy experience and test engineering CV path.",
          "Part of the instrumentation profile for validation and laboratory-heavy roles.",
        ],
      },
      {
        heading: "Personal overlap",
        items: ["Connects naturally with the sensor logger and home automation ideas on the site."],
      },
    ],
    links: [
      { label: "Siemens thesis case study", href: "projects/siemens-thesis.html" },
      { label: "Experience timeline", href: "experience.html" },
      { label: "Ideas", href: "ideas.html" },
    ],
  },
  "siemens-nx": {
    title: "Siemens NX",
    summary:
      "Used at Siemens Energy together with Teamcenter PLM2020 while working with gas turbine test-rig geometry and engineering documentation.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Worked with Siemens NX and Teamcenter PLM2020 as part of the thesis hardware and geometry workflow.",
          "Connected CAD/PLM context with ANSYS SpaceClaim preparation and CFD model setup.",
          "Kept simulation assumptions tied to the actual rig hardware and available design information.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Listed in the Siemens Energy thesis and experience pages.",
          "Part of the CAD and PLM skill group on the technical profile.",
        ],
      },
      {
        heading: "Related hands-on work",
        items: ["Mechanical design projects and custom-build hobbies reinforce the practical design side of the profile."],
      },
    ],
    links: [
      { label: "Siemens Energy experience", href: "experience/siemens-energy.html" },
      { label: "Siemens thesis case study", href: "projects/siemens-thesis.html" },
      { label: "Hobbies", href: "hobbies.html" },
    ],
  },
  "cfd-cht": {
    title: "CFD/CHT",
    summary:
      "The main thermal-fluid thread of the portfolio: compressible CFD, conjugate heat transfer, mesh independence and physical interpretation.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Modelled gas turbine reducer geometries for the Siemens Energy Pulsatorn calibration rig.",
          "Compared pressure-loss, Mach-number and thermal-delivery behavior across geometry and outlet-pressure cases.",
          "Used Biot number analysis to separate solid-wall thermal behavior from fluid-side heat transfer effects.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Primary project: Siemens Energy CFD/CHT thesis.",
          "Experience: seven months embedded in the Siemens Energy Fluid Dynamic Lab.",
          "Certification: Applied Computational Fluid Dynamics through Siemens.",
        ],
      },
      {
        heading: "Also connected to",
        items: [
          "Aircraft de-icing simulation idea.",
          "Interests in failure analysis, thermodynamics and applied simulation problems.",
        ],
      },
    ],
    links: [
      { label: "Featured projects", href: "index.html#projects" },
      { label: "Siemens thesis case study", href: "projects/siemens-thesis.html" },
      { label: "Interests", href: "interests.html" },
    ],
  },
  "grid-modelling": {
    title: "PyPSA / Linopy / HiGHS",
    summary:
      "Grid and dispatch modelling work covering constrained networks, BESS screening, flexible connection logic and scenario comparison dashboards.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Built simplified regional grid models with constrained corridors, renewable generation, backup generation and storage/flexibility options.",
          "Used PyPSA with Linopy and HiGHS for hourly dispatch and bottleneck diagnostics.",
          "Presented results through Streamlit workflows with scenario KPIs, hourly flows, validation checks and report exports.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "PyPSA-NL grid congestion, BESS and flexible connection platform.",
          "Distribution-grid study covering EV charging, PV, storage and N-1 screening.",
          "Hydrogen and district-heating optimisation projects also use the same optimisation mindset.",
        ],
      },
    ],
    links: [
      { label: "PyPSA-NL case study", href: "projects/pypsa-nl-grid-flexibility.html" },
      { label: "Project library", href: "projects.html" },
    ],
  },
  "python-tooling": {
    title: "Python / Streamlit / Excel",
    summary:
      "Practical engineering tooling for energy models, dashboards, KPI workflows, reporting exports and repeatable analysis.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Built Streamlit dashboards for grid flexibility, EU ETS exposure and industrial energy KPI workflows.",
          "Used Python with pandas, NumPy, Plotly and optimisation libraries to turn models into usable decision-support tools.",
          "Kept Excel in the workflow where it helps recruiters, engineers or stakeholders inspect assumptions quickly.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "PyPSA-NL grid flexibility platform.",
          "EU ETS exposure calculator.",
          "Industrial energy KPI toolkit.",
        ],
      },
    ],
    links: [
      { label: "EU ETS calculator", href: "projects/eu-ets-exposure-calculator.html" },
      { label: "Industrial KPI toolkit", href: "projects/industrial-energy-kpi-toolkit.html" },
      { label: "PyPSA-NL case study", href: "projects/pypsa-nl-grid-flexibility.html" },
    ],
  },
  "energy-management": {
    title: "ISO 50001 / EU EED / Energy KPIs",
    summary:
      "Energy-performance mapping and reporting work around ISO 50001-style continuous improvement, EU energy-efficiency context and KPI/EnPI design.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Built KPI and EnPI logic for industrial energy follow-up, baseline normalisation and action tracking.",
          "Mapped metering readiness, measurement planning and energy-performance reporting needs.",
          "Connected ISO 50001-style continuous improvement with practical Excel and Python reporting workflows.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Alleima industrial energy efficiency mapping.",
          "Industrial energy KPI toolkit.",
          "KTH Energy Management coursework covering ISO 50001, KPIs, measurement and verification.",
        ],
      },
    ],
    links: [
      { label: "Alleima project", href: "projects/alleima-energy-efficiency.html" },
      { label: "Industrial KPI toolkit", href: "projects/industrial-energy-kpi-toolkit.html" },
      { label: "Alleima experience", href: "experience/alleima.html" },
    ],
  },
  "building-energy": {
    title: "IDA ICE / HOMER Pro / Building Energy",
    summary:
      "Building-energy and autonomy modelling across heat demand, PV, storage, heat pumps and renewable-plus-storage scenarios.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Modelled building heat demand and renewable-plus-storage scenarios with IDA ICE and HOMER Pro.",
          "Compared heat pumps, PV, battery storage and autonomy-oriented energy-system configurations.",
          "Used building-energy results as inputs for techno-economic comparison and system-level decision making.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Hylkysaari smart energy island modelling.",
          "Residential heating systems techno-economic comparison.",
          "Energy modelling tools skill group on the homepage.",
        ],
      },
    ],
    links: [
      { label: "Project library", href: "projects.html" },
      { label: "Technical profile", href: "about.html" },
    ],
  },
  "heating-economics": {
    title: "SAM / Heat Pumps / Techno-Economic Analysis",
    summary:
      "Heating-system comparison work using hourly demand, solar/PV assumptions, CAPEX/OPEX/LCOE metrics and sensitivity analysis.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Compared district heating, PV with heat pump, PV with electric boiler and solar thermal with TES configurations.",
          "Used IDA ICE and SAM outputs to calculate CAPEX, OPEX, LCOE, payback and sensitivity cases.",
          "Framed technical performance together with cost and implementation trade-offs.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Residential heating systems techno-economic comparison.",
          "Building energy systems and electrification coursework.",
        ],
      },
    ],
    links: [
      { label: "Project library", href: "projects.html" },
      { label: "About and coursework", href: "about.html#kth-coursework" },
    ],
  },
  "thermal-storage": {
    title: "TES / Phase Change Materials / Control Logic",
    summary:
      "Thermal-energy-storage work around peak shaving, storage sizing, phase-change material options and charge/discharge control.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Simulated TES control logic to cap peak cooling demand in a district-cooling scenario.",
          "Compared ice storage and phase-change material options from a practical sizing and control perspective.",
          "Connected thermal analysis with operating logic instead of treating storage as a static component.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Thermal energy storage peak-shaving project.",
          "Residential heating comparison where TES is part of the system alternatives.",
        ],
      },
    ],
    links: [
      { label: "Project library", href: "projects.html" },
      { label: "Interests", href: "interests.html" },
    ],
  },
  "energy-transition-policy": {
    title: "LEAP / Energy Policy / Scenario Analysis",
    summary:
      "Energy-transition scenario work using LEAP to compare policy, cost, technology-mix and carbon-pathway implications.",
    sections: [
      {
        heading: "What I did",
        items: [
          "Modelled Germany energy-transition pathways using LEAP scenario logic.",
          "Compared electricity cost and carbon implications across technology scenarios.",
          "Kept policy context visible so the model reads as decision support, not only a technical forecast.",
        ],
      },
      {
        heading: "Evidence",
        items: [
          "Germany energy transition analysis using LEAP.",
          "Energy policy, scenario analysis and policy-context tags in the project library.",
        ],
      },
    ],
    links: [
      { label: "Project library", href: "projects.html" },
      { label: "Technical profile", href: "about.html" },
    ],
  },
};

const skillKeyForLabel = (label = "") => {
  const normalized = String(label).toLowerCase();
  if (normalized.includes("ansys fluent")) return "ansys-fluent";
  if (normalized.includes("ni-daq") || normalized.includes("ni daq")) return "ni-daq";
  if (normalized.includes("labview")) return "labview";
  if (normalized.includes("siemens nx")) return "siemens-nx";
  if (normalized.includes("k-omega")) return "cfd-cht";
  if (
    normalized.includes("pypsa") ||
    normalized.includes("linopy") ||
    normalized.includes("highs") ||
    normalized.includes("bess") ||
    normalized.includes("grid congestion") ||
    normalized.includes("flexible connection")
  ) {
    return "grid-modelling";
  }
  if (normalized.includes("python") || normalized.includes("streamlit") || normalized.includes("pandas") || normalized.includes("plotly")) {
    return "python-tooling";
  }
  if (
    normalized.includes("iso 50001") ||
    normalized.includes("eu eed") ||
    normalized.includes("energy kpi") ||
    normalized.includes("enpi") ||
    normalized.includes("excel") ||
    normalized.includes("reporting")
  ) {
    return "energy-management";
  }
  if (
    normalized.includes("ida ice") ||
    normalized.includes("homer pro") ||
    normalized.includes("building energy") ||
    normalized.includes("autonomy")
  ) {
    return "building-energy";
  }
  if (
    normalized.includes("sam") ||
    normalized.includes("solar advisor") ||
    normalized.includes("techno-economic") ||
    normalized.includes("capex") ||
    normalized.includes("opex") ||
    normalized.includes("lcoe") ||
    normalized.includes("heat pump")
  ) {
    return "heating-economics";
  }
  if (
    normalized.includes("tes") ||
    normalized.includes("thermal energy storage") ||
    normalized.includes("phase change") ||
    normalized.includes("thermal analysis") ||
    normalized.includes("control logic")
  ) {
    return "thermal-storage";
  }
  if (
    normalized.includes("leap") ||
    normalized.includes("energy policy") ||
    normalized.includes("energy transition") ||
    normalized.includes("scenario analysis") ||
    normalized.includes("scenario modelling") ||
    normalized.includes("policy context")
  ) {
    return "energy-transition-policy";
  }
  if (
    normalized.includes("cfd") ||
    normalized.includes("cht") ||
    normalized.includes("conjugate heat transfer") ||
    normalized.includes("computational fluid dynamics")
  ) {
    return "cfd-cht";
  }
  return "";
};

const renderTag = (tag) => {
  const className = isPrimarySkill(tag) ? ' class="tag-hot"' : "";
  const skillKey = skillKeyForLabel(tag);
  const skillAttr = skillKey ? ` data-skill-key="${skillKey}"` : "";
  return `<span${className}${skillAttr}>${escapeHtml(tag)}</span>`;
};

const projectImageOverrides = {
  "hylkysaari-smart-energy-island-modelling": "assets/thumb-hylkysaari-energy-island.svg",
  "residential-heating-techno-economic-comparison": "assets/thumb-residential-heating-technoeconomics.svg",
  "thermal-energy-storage-peak-shaving": "assets/thumb-tes-peak-shaving.svg",
  "germany-energy-transition-analysis-leap": "assets/thumb-germany-leap-transition.svg",
  "techno-economic-analysis-and-development-of-hylkysaari-island-for-smart-": "assets/thumb-hylkysaari-energy-island.svg",
  "techno-economic-comparative-assessment-of-residential-heating-solutions-": "assets/thumb-residential-heating-technoeconomics.svg",
  "energy-environment-economy-analysis-of-germany": "assets/thumb-germany-leap-transition.svg",
  "bicycle-design-competition-sae-india": "assets/thumb-mechanical-design.svg",
  "tractor-design-competition-2019": "assets/thumb-mechanical-design.svg",
  "baja-sae-2019": "assets/thumb-mechanical-design.svg",
  "automatic-sanitizer-dispenser": "assets/thumb-thermal-prototype.svg",
  "wireless-charging-technology-and-application-in-automobile-industry": "assets/thumb-thermal-prototype.svg",
  "peltier-refrigerator": "assets/thumb-thermal-prototype.svg",
};

const projectImageSrc = (project) => {
  const image = projectImageOverrides[project.id] || project.image || `${basePath}assets/thumb-energy-kpi.svg`;
  return image.startsWith("http") || image.startsWith("../") ? image : `${basePath}${image}`;
};

const projectMatches = (project) => {
  const query = pageState.projectSearch.trim().toLowerCase();
  const filter = pageState.activeProjectFilter;
  const order = Number(project.order) || 999;
  const selectedCaseStudy = order <= 3 || (order >= 8 && order <= 14);
  const filterMatch =
    filter === "All" ||
    (filter === "Selected" && selectedCaseStudy) ||
    project.category === filter;
  const searchMatch = !query || JSON.stringify(project).toLowerCase().includes(query);
  return filterMatch && searchMatch;
};

const projectTone = (project) => {
  const text = `${project.category || ""} ${(project.tools || []).join(" ")} ${(project.title || "")}`.toLowerCase();
  if (/cfd|cht|thermal|heat|turbine|tes|vibration|instrument|daq|labview/.test(text)) return "thermal";
  if (/grid|bess|energy|hydrogen|district|leap|homer|ida|iso|heating/.test(text)) return "energy";
  return "analytics";
};

const renderLinkedTitle = (project) => {
  const title = escapeHtml(project.title || "Untitled project");
  return project.caseStudyUrl ? `<a class="title-link" href="${escapeHtml(project.caseStudyUrl)}">${title}</a>` : title;
};

const renderSiemensCfdVisual = () => `
  <div class="project-thumb siemens-cfd-thumb" role="img" aria-label="Reducer cross-section with futuristic thermo-fluid signal gradient">
    <span class="featured-badge">Primary differentiator</span>
    <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="siemens-card-gradient-dynamic" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#9bd69f"/>
          <stop offset="42%" stop-color="#d7b46a"/>
          <stop offset="72%" stop-color="#8fa7b3"/>
          <stop offset="100%" stop-color="#9bd69f"/>
        </linearGradient>
        <linearGradient id="siemens-card-fill-dynamic" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#9bd69f" stop-opacity="0.24"/>
          <stop offset="55%" stop-color="#8fa7b3" stop-opacity="0.20"/>
          <stop offset="100%" stop-color="#d7b46a" stop-opacity="0.24"/>
        </linearGradient>
      </defs>
      <rect x="26" y="38" width="368" height="134" rx="10" fill="#0d1117" stroke="#30363d"/>
      <g stroke="#30363d" stroke-width="0.8" opacity="0.6">
        <path d="M78 38V172M130 38V172M182 38V172M234 38V172M286 38V172M338 38V172"/>
        <path d="M26 72H394M26 106H394M26 140H394"/>
      </g>
      <path d="M54 104 C112 66 164 68 210 100 C254 130 305 138 366 102 L366 132 C302 166 249 154 204 124 C158 94 110 94 54 134 Z" fill="url(#siemens-card-fill-dynamic)" stroke="url(#siemens-card-gradient-dynamic)" stroke-width="4"/>
      <g fill="none" stroke="#f0f6fc" stroke-opacity="0.20" stroke-width="1.2">
        <path d="M68 104 C122 82 160 85 202 110"/>
        <path d="M68 122 C122 105 165 108 210 134"/>
        <path d="M232 108 C282 135 321 133 352 112"/>
        <path d="M230 126 C284 158 322 155 354 132"/>
      </g>
      <text x="34" y="24" fill="#8b949e" font-size="12" font-family="Roboto Mono, monospace">T_in = 673 K</text>
      <text x="246" y="24" fill="#9bd69f" font-size="12" font-family="Roboto Mono, monospace">Ma = 0.990-1.006</text>
      <text x="34" y="196" fill="#8b949e" font-size="12" font-family="Roboto Mono, monospace">Bi = 0.003-0.004</text>
      <text x="258" y="196" fill="#8b949e" font-size="12" font-family="Roboto Mono, monospace">thesis campaign</text>
    </svg>
  </div>`;

const initializePageLaunch = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.requestAnimationFrame(() => {
    document.body.classList.add("page-launched");
  });
};

const renderProjectCard = (project) => {
  const tags = itemTags(project);
  const imageSrc = projectImageSrc(project);
  const highlights = Array.isArray(project.highlights) ? project.highlights : [];
  const links = [
    project.caseStudyUrl ? `<a href="${escapeHtml(project.caseStudyUrl)}">Case study</a>` : "",
    project.repoUrl ? `<a href="${escapeHtml(project.repoUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : "",
  ].filter(Boolean);
  const tone = projectTone(project);

  const visual =
    project.id === "siemens-thesis"
      ? renderSiemensCfdVisual()
      : `<img class="project-thumb" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(project.title)} visual" loading="lazy" width="960" height="540" />`;
  const primaryClass = project.id === "siemens-thesis" ? "primary-differentiator" : "";

  return `
    <article class="project-card tone-${tone} ${project.featured ? "featured" : ""} ${primaryClass}">
      ${visual}
      <div class="tag-row">${tags.map(renderTag).join("")}</div>
      <p class="project-category">${escapeHtml(project.category || "Project")}</p>
      <h3>${renderLinkedTitle(project)}</h3>
      <p>${escapeHtml(project.summary || "")}</p>
      ${
        highlights.length
          ? `<ul class="evidence-list">${highlights.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : ""
      }
      ${links.length ? `<div class="project-links">${links.join("")}</div>` : ""}
    </article>`;
};

const renderProjectBrowserItem = (project, index) => {
  const tags = itemTags(project);
  const highlights = Array.isArray(project.highlights) ? project.highlights : [];
  const links = [
    project.caseStudyUrl ? `<a href="${escapeHtml(project.caseStudyUrl)}">Case study</a>` : "",
    project.repoUrl ? `<a href="${escapeHtml(project.repoUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : "",
  ].filter(Boolean);
  const imageSrc = projectImageSrc(project);
  const tone = projectTone(project);

  return `
    <details class="project-browser-item tone-${tone} ${project.featured ? "is-featured" : ""}" ${index === 0 ? "open" : ""} data-project-id="${escapeHtml(project.id)}">
      <summary class="project-browser-summary">
        <div class="project-browser-summary-text">
          <span class="project-browser-kicker">${escapeHtml(project.category || "Project")}</span>
          <h3>${renderLinkedTitle(project)}</h3>
          <p>${escapeHtml(project.summary || "")}</p>
        </div>
        <div class="project-browser-meta">
          <span>${escapeHtml((project.tools || []).slice(0, 3).join(" / ") || "Details available")}</span>
          ${project.featured ? "<span>Featured</span>" : ""}
        </div>
      </summary>
      <div class="project-browser-body">
        <img class="project-thumb" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(project.title)} visual" loading="lazy" width="960" height="540" />
        <div class="project-browser-copy">
          ${tags.length ? `<div class="tag-row">${tags.map(renderTag).join("")}</div>` : ""}
          ${highlights.length ? `<ul class="evidence-list">${highlights.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
          ${links.length ? `<div class="project-links">${links.join("")}</div>` : ""}
        </div>
      </div>
    </details>`;
};

const renderProjectFilters = () => {
  if (!projectFilters) return;
  const categories = ["Selected", "All", ...new Set(pageState.projects.map((project) => project.category).filter(Boolean))];
  projectFilters.innerHTML = categories
    .map(
      (category) =>
        `<button type="button" class="filter-chip ${category === pageState.activeProjectFilter ? "is-active" : ""}" data-project-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>`
    )
    .join("");
};

const renderProjectList = () => {
  if (!dynamicProjects) return;
  const filtered = pageState.projects.filter(projectMatches);
  dynamicProjects.innerHTML = filtered.length
    ? filtered.map(renderProjectBrowserItem).join("")
    : `<article class="project-browser-empty"><h3>No matching projects</h3><p>Try a different search or category filter.</p></article>`;
  if (projectCount) {
    projectCount.textContent =
      pageState.activeProjectFilter === "Selected"
        ? `${filtered.length} selected case ${filtered.length === 1 ? "study" : "studies"} shown`
        : `${filtered.length} project${filtered.length === 1 ? "" : "s"} shown`;
  }
  decorateSkillLinks(dynamicProjects);
};

const initializeProjects = async () => {
  if (!dynamicProjects && !featuredProjects) return;
  try {
    const fallbackUrl = `${basePath}api/linkedin-projects.json`;
    const [apiResult, staticResult] = await Promise.allSettled([
      fetchCollection("projects", fallbackUrl),
      fetchStaticCollection(fallbackUrl),
    ]);
    const apiData = apiResult.status === "fulfilled" ? apiResult.value : {};
    const staticData = staticResult.status === "fulfilled" ? staticResult.value : {};
    const projects = visibleItems(mergeById(Array.isArray(apiData.projects) ? apiData.projects : [], Array.isArray(staticData.projects) ? staticData.projects : []));
    pageState.projects = projects;

    if (featuredProjects) {
      const selected = projects.filter((project) => project.featured).slice(0, 10);
      featuredProjects.innerHTML = (selected.length ? selected : projects.slice(0, 10)).map(renderProjectCard).join("");
      decorateSkillLinks(featuredProjects);
    }

    renderProjectFilters();
    renderProjectList();
  } catch (error) {
    if (projectCount) projectCount.textContent = "Project records are being refreshed.";
  }
};

const renderExperienceItem = (item) => {
  const tags = item.tools || item.skills || [];
  const links = item.detailUrl ? `<div class="project-links"><a href="${escapeHtml(item.detailUrl)}">Experience details</a></div>` : "";
  const title = `${escapeHtml(item.role)} - ${escapeHtml(item.company)}`;
  const titleMarkup = item.detailUrl ? `<a class="title-link" href="${escapeHtml(item.detailUrl)}">${title}</a>` : title;
  const isPrimaryExperience = item.id === "test-engineer-master-thesis-student" || /siemens energy/i.test(item.company || "");
  return `
    <article class="timeline-item ${isPrimaryExperience ? "timeline-feature" : ""}">
      <div>
        <h2>${titleMarkup}</h2>
        <p class="meta">${escapeHtml([item.type, item.period, item.location].filter(Boolean).join(" - "))}</p>
      </div>
      <p>${escapeHtml(item.summary || "")}</p>
      ${tags.length ? `<div class="tag-row">${tags.slice(0, 6).map(renderTag).join("")}</div>` : ""}
      ${links}
    </article>`;
};

const initializeExperience = async () => {
  if (!dynamicExperienceBlocks.length) return;
  try {
    const data = await fetchCollection("experience", `${basePath}api/linkedin-experience.json`);
    const items = visibleItems(Array.isArray(data.experience) ? data.experience : []);
    dynamicExperienceBlocks.forEach((block) => {
      const limit = Number(block.dataset.limit) || items.length;
      block.innerHTML = items.slice(0, limit).map(renderExperienceItem).join("");
      decorateSkillLinks(block);
    });
  } catch {
    dynamicExperienceBlocks.forEach((block) => {
      block.innerHTML = `<article class="timeline-item"><h2>Experience records</h2><p>The experience timeline is being refreshed.</p></article>`;
    });
  }
};

const initializeCvLinks = () => {
  const links = document.querySelectorAll("[data-cv-link]");
  if (!links.length || location.protocol === "file:") return;

  links.forEach(async (link) => {
    const fallbackHref = link.dataset.fallbackHref;
    if (!fallbackHref) return;

    try {
      const response = await fetch(link.href, { method: "HEAD", cache: "no-store" });
      if (response.ok) return;
    } catch {
      // Fall through to mail fallback.
    }

    link.href = fallbackHref;
    link.removeAttribute("download");
    link.textContent = link.dataset.fallbackLabel || "Request via email";
    link.classList.add("is-fallback");
  });
};

let lastSkillTrigger = null;

const skillHref = (href = "") => {
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  if (pageKey === "home" && href.startsWith("index.html#")) return href.replace("index.html", "");
  return `${basePath}${href}`;
};

const ensureSkillPanel = () => {
  let backdrop = document.querySelector("[data-skill-panel]");
  if (backdrop) return backdrop;

  backdrop = document.createElement("div");
  backdrop.className = "skill-panel-backdrop";
  backdrop.dataset.skillPanel = "";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <aside class="skill-panel" role="dialog" aria-modal="true" aria-labelledby="skill-panel-title">
      <div class="skill-panel-head">
        <div>
          <p class="eyebrow">Skill detail</p>
          <h2 id="skill-panel-title" data-skill-panel-title></h2>
        </div>
        <button class="skill-panel-close" type="button" aria-label="Close skill detail" data-skill-panel-close>&times;</button>
      </div>
      <p data-skill-panel-summary></p>
      <div data-skill-panel-sections></div>
      <div class="project-links skill-panel-links" data-skill-panel-links></div>
    </aside>`;
  document.body.append(backdrop);

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop || event.target.closest("[data-skill-panel-close]")) {
      closeSkillPanel();
    }
  });

  return backdrop;
};

const renderSkillSections = (sections = []) =>
  sections
    .map(
      (section) => `
        <section class="skill-detail-group">
          <h3>${escapeHtml(section.heading)}</h3>
          <ul>${(section.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </section>`
    )
    .join("");

const openSkillPanel = (skillKey, trigger = null) => {
  const profile = skillProfiles[skillKey];
  if (!profile) return;

  lastSkillTrigger = trigger;
  const backdrop = ensureSkillPanel();
  backdrop.querySelector("[data-skill-panel-title]").textContent = profile.title;
  backdrop.querySelector("[data-skill-panel-summary]").textContent = profile.summary;
  backdrop.querySelector("[data-skill-panel-sections]").innerHTML = renderSkillSections(profile.sections);
  backdrop.querySelector("[data-skill-panel-links]").innerHTML = (profile.links || [])
    .map((link) => `<a href="${escapeHtml(skillHref(link.href))}">${escapeHtml(link.label)}</a>`)
    .join("");

  backdrop.hidden = false;
  document.body.classList.add("skill-panel-open");
  requestAnimationFrame(() => backdrop.querySelector("[data-skill-panel-close]")?.focus());
};

const closeSkillPanel = () => {
  const backdrop = document.querySelector("[data-skill-panel]");
  if (!backdrop || backdrop.hidden) return;

  backdrop.hidden = true;
  document.body.classList.remove("skill-panel-open");
  lastSkillTrigger?.focus?.();
  lastSkillTrigger = null;
};

const decorateSkillLinks = (root = document) => {
  root.querySelectorAll(".tag-row span, .hero-tag-row span, .skill-pill, .tool-icon-card").forEach((element) => {
    if (element.dataset.skillDecorated === "true") return;
    const skillKey = element.dataset.skillKey || skillKeyForLabel(element.textContent);
    if (!skillKey || !skillProfiles[skillKey]) return;

    element.dataset.skillDecorated = "true";
    element.dataset.skillKey = skillKey;
    element.classList.add("skill-link");
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", `Show ${skillProfiles[skillKey].title} details`);
  });
};

const initializeSkillExplorer = () => {
  decorateSkillLinks();
  if (document.body.dataset.skillExplorerReady === "true") return;
  document.body.dataset.skillExplorerReady = "true";

  document.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest("[data-skill-key]") : null;
    if (!trigger || !trigger.classList.contains("skill-link")) return;
    openSkillPanel(trigger.dataset.skillKey, trigger);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSkillPanel();
      return;
    }

    const trigger = event.target instanceof Element ? event.target.closest("[data-skill-key]") : null;
    if (!trigger || !trigger.classList.contains("skill-link")) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openSkillPanel(trigger.dataset.skillKey, trigger);
    }
  });
};

const initializeNavToggle = () => {
  if (!navLinks) return;
  const nav = navLinks.closest(".nav");
  if (!nav || nav.querySelector(".nav-toggle")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "nav-toggle";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Toggle navigation");
  button.innerHTML = "<span></span><span></span><span></span>";
  nav.insertBefore(button, navLinks);

  button.addEventListener("click", () => {
    const open = !document.body.classList.contains("nav-open");
    document.body.classList.toggle("nav-open", open);
    button.setAttribute("aria-expanded", String(open));
  });

  navLinks.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    button.setAttribute("aria-expanded", "false");
  });
};

const initializeFooter = () => {
  const footerContainer = document.querySelector(".footer .container");
  if (!footerContainer || footerContainer.dataset.enhanced === "true") return;
  footerContainer.dataset.enhanced = "true";
  footerContainer.innerHTML = `
    <div class="footer-grid">
      <div>
        <h2>Abhijith Sivaprasadan</h2>
        <p>Thermal-fluid, gas turbine CFD, instrumentation and energy systems engineering.</p>
        <p><a href="mailto:abhijithsivaprasadan@gmail.com">abhijithsivaprasadan@gmail.com</a></p>
        <p><a href="tel:+46769692014">Sweden: +46 76 969 2014</a></p>
        <p><a href="tel:+918129750386">India: +91 8129750386</a></p>
      </div>
      <nav aria-label="Footer quick links">
        <h3>Quick links</h3>
        <a href="${basePath}index.html#projects">Featured</a>
        <a href="${basePath}projects.html">Projects</a>
        <a href="${basePath}experience.html">Experience</a>
        <a href="${basePath}index.html#cv">CV</a>
        <a href="${basePath}about.html">About</a>
        <a href="${basePath}index.html#contact">Contact</a>
      </nav>
      <div>
        <h3>Social</h3>
        <div class="social-buttons">
          <a href="https://github.com/abhijith-sivaprasadan" target="_blank" rel="noreferrer" aria-label="GitHub">GitHub</a>
          <a href="https://www.linkedin.com/in/abhijith-sivaprasadan/" target="_blank" rel="noreferrer" aria-label="LinkedIn">LinkedIn</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">&copy; 2026 Abhijith Sivaprasadan. Built with GitHub Pages.</div>`;
};

const renderSkills = (items, compact = false) =>
  items
    .map((group) =>
      compact
        ? `<article class="compact-item"><h3>${escapeHtml(group.name)}</h3><p>${escapeHtml((group.skills || []).slice(0, 8).join(", "))}</p></article>`
        : `<div class="skill-block"><h3>${escapeHtml(group.name)}</h3><div class="skill-pills">${(group.skills || [])
            .map((skill) => `<span class="skill-pill ${isPrimarySkill(skill) ? "hot" : ""}">${escapeHtml(skill)}</span>`)
            .join("")}</div></div>`
    )
    .join("");

const initializeSkills = async () => {
  if (!dynamicSkillBlocks.length) return;
  try {
    const data = await fetchCollection("skills", `${basePath}api/skills.json`);
    const items = visibleItems(Array.isArray(data.skillGroups) ? data.skillGroups : []);
    dynamicSkillBlocks.forEach((block) => {
      block.innerHTML = renderSkills(items, block.dataset.compact === "true");
      decorateSkillLinks(block);
    });
  } catch {
    dynamicSkillBlocks.forEach((block) => {
      block.innerHTML = `<article class="compact-item"><h3>Skills and tools</h3><p>The skills list is being refreshed.</p></article>`;
    });
  }
};

const initializeCourses = async () => {
  if (!dynamicCourseBlocks.length) return;
  try {
    const data = await fetchCollection("courses", `${basePath}api/courses.json`);
    const items = visibleItems(Array.isArray(data.courses) ? data.courses : []);
    dynamicCourseBlocks.forEach((block) => {
      const limit = Number(block.dataset.limit) || items.length;
      block.innerHTML = items
        .slice(0, limit)
        .map(
          (course) =>
            `<article class="compact-item"><h3>${escapeHtml(course.name || course.title || "Course")}</h3><p>${escapeHtml([course.code, course.grade ? `Grade ${course.grade}` : "", course.credits, course.institution || course.associatedWith].filter(Boolean).join(" - "))}</p></article>`
        )
        .join("");
    });
  } catch {
    dynamicCourseBlocks.forEach((block) => {
      block.innerHTML = `<article class="compact-item"><h3>Course records</h3><p>The course list is being refreshed.</p></article>`;
    });
  }
};

const renderIdeaItem = (idea) => {
  const tags = [...(idea.tools || []), ...(idea.skills || [])].slice(0, 5);
  return `
    <article class="entry-card">
      <span class="entry-status">${escapeHtml(idea.category || "Idea")}</span>
      <h3>${escapeHtml(idea.title)}</h3>
      <p>${escapeHtml(idea.summary || "")}</p>
      ${tags.length ? `<div class="tag-row">${tags.map(renderTag).join("")}</div>` : ""}
    </article>`;
};

const initializeIdeas = async () => {
  if (!dynamicIdeaBlocks.length) return;
  try {
    const data = await fetchCollection("ideas", `${basePath}api/ideas.json`);
    const items = visibleItems(Array.isArray(data.ideas) ? data.ideas : []);
    dynamicIdeaBlocks.forEach((block) => {
      block.innerHTML = items.length
        ? items.map(renderIdeaItem).join("")
        : `<article class="entry-card"><h3>No ideas yet</h3><p>New experiment ideas can be added here over time.</p></article>`;
      decorateSkillLinks(block);
    });
  } catch {
    dynamicIdeaBlocks.forEach((block) => {
      block.innerHTML = `<article class="entry-card"><h3>Project ideas</h3><p>The idea list is being refreshed.</p></article>`;
    });
  }
};

const initializeCertifications = async () => {
  if (!certificationsList) return;

  try {
    const data = await fetchCollection(
      certificationsList.dataset.apiResource || "certifications",
      `${basePath}${certificationsList.dataset.certificationsEndpoint || "api/certifications.json"}`
    );
    const certifications = Array.isArray(data.certifications) ? data.certifications : [];
    certificationsList.innerHTML = certifications.length
      ? certifications.map(renderCertification).join("")
      : `<article class="certification-item"><div><h3>Certification records</h3><p>No certification records are listed yet.</p></div></article>`;
  } catch (error) {
    certificationsList.innerHTML = `
      <article class="certification-item">
        <div>
          <h3>Certification records</h3>
          <p>Credential records are being prepared for this section.</p>
        </div>
      </article>`;
  }
};

const updateProgress = () => {
  if (!progressBar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  document.documentElement.style.setProperty("--scroll-progress", progress.toString());
};

const updateScenes = () => {
  if (!scenes.length) return;

  let activeScene = scenes[0];
  let activeDistance = Number.POSITIVE_INFINITY;
  const viewportCenter = window.innerHeight / 2;

  scenes.forEach((scene) => {
    const rect = scene.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (viewportCenter - rect.top) / Math.max(rect.height, 1)));
    const sceneCenter = rect.top + rect.height / 2;
    const distance = Math.abs(sceneCenter - viewportCenter);

    scene.style.setProperty("--scene-progress", progress.toFixed(4));

    if (distance < activeDistance && rect.bottom > 0 && rect.top < window.innerHeight) {
      activeDistance = distance;
      activeScene = scene;
    }
  });

  if (activeScene?.dataset.scene) {
    document.body.dataset.scene = activeScene.dataset.scene;
  }
};

const revealTargets = document.querySelectorAll(
  ".section-heading, .card, .project-card, .skill-block, .timeline-item, .case-panel, .case-visual, .showcase-panel, .profile-meter, .page-orbit, .hero-stats, .button-row, .newsletter-cta-stack, .contact-links, .hero-slab, .tag-row, .thermal-visual, .role-signal, .tool-icon-card, .cv-card"
);

revealTargets.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
});

document.querySelectorAll(".profile-meter span").forEach((bar, i) => {
  bar.style.setProperty("--bar-delay", `${i * 130}ms`);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
}

// Counter animation for hero stats
const heroStatNumbers = document.querySelectorAll(".hero-stats strong");
if (heroStatNumbers.length && "IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.textContent, 10);
        if (isNaN(target)) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const startTime = performance.now();
        const duration = 1400;
        const tick = (now) => {
          const t = Math.min((now - startTime) / duration, 1);
          const ease = 1 - (1 - t) ** 3;
          el.textContent = t < 1 ? Math.round(target * ease) : target;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  heroStatNumbers.forEach((el) => counterObserver.observe(el));
}

// Cursor spotlight on hero section
const heroSection = document.querySelector(".hero");
if (heroSection) {
  heroSection.addEventListener("mousemove", (e) => {
    const rect = heroSection.getBoundingClientRect();
    heroSection.style.setProperty("--cursor-x", `${((e.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
    heroSection.style.setProperty("--cursor-y", `${((e.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
    heroSection.classList.add("cursor-glow");
  }, { passive: true });
  heroSection.addEventListener("mouseleave", () => heroSection.classList.remove("cursor-glow"));
}

const updateScrollState = () => {
  updateProgress();
  updateScenes();
};

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
updateProgress();
updateScenes();
document.body.classList.add("future-v3");
if (document.body.dataset.pageKey === "home") {
  document.body.classList.add("signal-rebuild");
}
initializePageLaunch();
injectNavLinks();
initializeNavToggle();
initializeFooter();
initializeSkillExplorer();
if (localEditorEnabled) {
  applySavedState();
  injectEditor();
  makeEditable(false);
  syncCollectionEditability();
}
loadPortfolioConfig().then(() => {
  initializeProjects();
  initializeExperience();
  initializeSkills();
  initializeCourses();
  initializeIdeas();
  initializeIdeaSubmission();
  initializeCertifications();
  initializeNewsletter();
  initializeCvLinks();
  if (localEditorEnabled) {
    initializeAdminAuth();
  }
});

projectFilters?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest("[data-project-filter]");
  if (!button) return;
  pageState.activeProjectFilter = button.dataset.projectFilter;
  renderProjectFilters();
  renderProjectList();
});

projectSearch?.addEventListener("input", () => {
  pageState.projectSearch = projectSearch.value;
  renderProjectList();
});
