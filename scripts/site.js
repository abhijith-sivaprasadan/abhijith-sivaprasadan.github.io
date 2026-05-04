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
const assetVersion = "20260504-data-v7";
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
  activeProjectFilter: "All",
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
        <h3 data-editable="title">New note</h3>
        <p data-editable="summary">Replace this with a short note about your background, routine or current direction.</p>
      </article>`,
    hobbies: `
      <article class="entry-card">
        <h3 data-editable="title">New hobby</h3>
        <p data-editable="summary">Describe the hobby and why it matters to you.</p>
      </article>`,
    interests: `
      <article class="entry-card">
        <h3 data-editable="title">New interest</h3>
        <p data-editable="summary">Add a field, topic or reading thread you want to keep exploring.</p>
      </article>`,
    ideas: `
      <article class="entry-card">
        <span class="entry-status">Idea</span>
        <h3 data-editable="title">New project idea</h3>
        <p data-editable="summary">Write the concept, the reason it matters and the main toolchain you want to use.</p>
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

  const links = [
    { label: "Projects", href: `${basePath}projects.html` },
    { label: "Experience", href: `${basePath}experience.html` },
    { label: "About", href: `${basePath}about.html` },
    { label: "Hobbies", href: `${basePath}hobbies.html` },
    { label: "Interests", href: `${basePath}interests.html` },
    { label: "Ideas", href: `${basePath}ideas.html` },
  ];

  links.forEach(({ label, href }) => {
    if (!navLinks.querySelector(`a[href="${href}"]`)) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      const currentFile = location.pathname.split("/").pop();
      const targetFile = href.split("/").pop();
      if (currentFile === targetFile) {
        link.setAttribute("aria-current", "page");
      }
      navLinks.append(link);
    }
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
  const endpoint = apiUrl(resource, fallback || `${basePath}api/${resource}.json`);
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) throw new Error(`${resource} API returned ${response.status}`);
  return response.json();
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

const itemTags = (item) => [...(item.tools || []), ...(item.skills || [])].slice(0, 5);

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
  const filterMatch = filter === "All" || project.category === filter;
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

const renderProjectCard = (project) => {
  const tags = itemTags(project);
  const imageSrc = projectImageSrc(project);
  const highlights = Array.isArray(project.highlights) ? project.highlights : [];
  const links = [
    project.caseStudyUrl ? `<a href="${escapeHtml(project.caseStudyUrl)}">Case study</a>` : "",
    project.repoUrl ? `<a href="${escapeHtml(project.repoUrl)}" target="_blank" rel="noreferrer">GitHub</a>` : "",
  ].filter(Boolean);
  const tone = projectTone(project);

  return `
    <article class="project-card tone-${tone} ${project.featured ? "featured" : ""}">
      <img class="project-thumb" src="${escapeHtml(imageSrc)}" alt="${escapeHtml(project.title)} visual" loading="lazy" width="960" height="540" />
      <div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
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
          ${tags.length ? `<div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          ${highlights.length ? `<ul class="evidence-list">${highlights.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
          ${links.length ? `<div class="project-links">${links.join("")}</div>` : ""}
        </div>
      </div>
    </details>`;
};

const renderProjectFilters = () => {
  if (!projectFilters) return;
  const categories = ["All", ...new Set(pageState.projects.map((project) => project.category).filter(Boolean))];
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
    projectCount.textContent = `${filtered.length} project${filtered.length === 1 ? "" : "s"} shown`;
  }
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
    }

    renderProjectFilters();
    renderProjectList();
  } catch (error) {
    if (projectCount) projectCount.textContent = "Project data could not be loaded from the API.";
  }
};

const renderExperienceItem = (item) => {
  const tags = item.tools || item.skills || [];
  const links = item.detailUrl ? `<div class="project-links"><a href="${escapeHtml(item.detailUrl)}">Experience details</a></div>` : "";
  const title = `${escapeHtml(item.role)} - ${escapeHtml(item.company)}`;
  const titleMarkup = item.detailUrl ? `<a class="title-link" href="${escapeHtml(item.detailUrl)}">${title}</a>` : title;
  return `
    <article class="timeline-item ${item.featured ? "timeline-feature" : ""}">
      <div>
        <h2>${titleMarkup}</h2>
        <p class="meta">${escapeHtml([item.type, item.period, item.location].filter(Boolean).join(" - "))}</p>
      </div>
      <p>${escapeHtml(item.summary || "")}</p>
      ${tags.length ? `<div class="tag-row">${tags.slice(0, 6).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
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
    });
  } catch {
    dynamicExperienceBlocks.forEach((block) => {
      block.innerHTML = `<article class="timeline-item"><h2>Experience unavailable</h2><p>Experience data could not be loaded from the API.</p></article>`;
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
        <a href="${basePath}projects.html">Projects</a>
        <a href="${basePath}experience.html">Experience</a>
        <a href="${basePath}about.html">About</a>
        <a href="${basePath}index.html#cv">CV</a>
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
        : `<div class="skill-block"><h3>${escapeHtml(group.name)}</h3><p>${escapeHtml((group.skills || []).join(", "))}</p></div>`
    )
    .join("");

const initializeSkills = async () => {
  if (!dynamicSkillBlocks.length) return;
  try {
    const data = await fetchCollection("skills", `${basePath}api/skills.json`);
    const items = visibleItems(Array.isArray(data.skillGroups) ? data.skillGroups : []);
    dynamicSkillBlocks.forEach((block) => {
      block.innerHTML = renderSkills(items, block.dataset.compact === "true");
    });
  } catch {
    dynamicSkillBlocks.forEach((block) => {
      block.innerHTML = `<article class="compact-item"><h3>Skills unavailable</h3><p>Skill data could not be loaded from the API.</p></article>`;
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
      block.innerHTML = `<article class="compact-item"><h3>Courses unavailable</h3><p>Course data could not be loaded from the API.</p></article>`;
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
      ${tags.length ? `<div class="tag-row">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
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
        : `<article class="entry-card"><h3>No ideas yet</h3><p>Add ideas from the admin content manager.</p></article>`;
    });
  } catch {
    dynamicIdeaBlocks.forEach((block) => {
      block.innerHTML = `<article class="entry-card"><h3>Ideas unavailable</h3><p>Idea data could not be loaded from the API.</p></article>`;
    });
  }
};

const initializeCertifications = async () => {
  if (!certificationsList) return;

  try {
    const endpoint = apiUrl(
      certificationsList.dataset.apiResource,
      certificationsList.dataset.certificationsEndpoint
    );
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error(`Certification API returned ${response.status}`);

    const data = await response.json();
    const certifications = Array.isArray(data.certifications) ? data.certifications : [];
    certificationsList.innerHTML = certifications.length
      ? certifications.map(renderCertification).join("")
      : `<article class="certification-item"><div><h3>No certifications found</h3><p>The certifications API returned an empty list.</p></div></article>`;
  } catch (error) {
    certificationsList.innerHTML = `
      <article class="certification-item">
        <div>
          <h3>Certifications unavailable</h3>
          <p>The certifications API could not be loaded in this browser session.</p>
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
injectNavLinks();
initializeNavToggle();
initializeFooter();
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
