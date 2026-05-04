const progressBar = document.querySelector(".scroll-progress");
const scenes = document.querySelectorAll(".scroll-scene");
const navLinks = document.querySelector(".nav-links");
const newsletterForm = document.querySelector("[data-newsletter-form]");
const certificationsList = document.querySelector("[data-certifications-endpoint]");
const isNestedPage = location.pathname.includes("/projects/") || location.pathname.includes("/experience/");
const basePath = isNestedPage ? "../" : "";
const inferredPageKey = (() => {
  const currentFile = location.pathname.split("/").pop() || "index.html";
  if (currentFile === "index.html") return "home";
  return currentFile.replace(/\.html$/, "");
})();
const pageKey = document.body.dataset.pageKey || inferredPageKey;
const storeKey = "abhijith-portfolio-edit-v1";
let authConfig = window.PORTFOLIO_AUTH_CONFIG || {};
let newsletterAction = window.PORTFOLIO_NEWSLETTER_ACTION || "";
let apiBaseUrl = window.PORTFOLIO_API_BASE_URL || "";
let adminEmailHashes = new Set(
  window.PORTFOLIO_ADMIN_EMAIL_HASHES || [
    "82ff3995db9c955db8a17b3565c7b354a53bb6d0b6351e783e3ff8b2a5910b8f",
    "ad42bd9249794a48b4f0b94bff7e0c54a330fac37ee239db64441448a901cf2d",
  ]
);

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
    await import(`${basePath}scripts/config.js`);
  } catch {
    // Optional local config. Missing config keeps the admin editor disabled.
  }

  authConfig = window.PORTFOLIO_AUTH_CONFIG || authConfig;
  newsletterAction = window.PORTFOLIO_NEWSLETTER_ACTION || newsletterAction;
  apiBaseUrl = window.PORTFOLIO_API_BASE_URL || apiBaseUrl;
  adminEmailHashes = new Set(window.PORTFOLIO_ADMIN_EMAIL_HASHES || Array.from(adminEmailHashes));
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
    const button = event.target.closest("[data-editor-action]");
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
    const addButton = event.target.closest("[data-add-entry]");
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

    const removeButton = event.target.closest(".entry-remove");
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
  return `${apiBaseUrl.replace(/\/$/, "")}/api/${resource.replace(/^\//, "")}`;
};

const initializeCertifications = async () => {
  if (!certificationsList) return;

  try {
    const endpoint = apiUrl(
      certificationsList.dataset.apiResource,
      certificationsList.dataset.certificationsEndpoint
    );
    const response = await fetch(endpoint, { cache: "no-cache" });
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
  ".section-heading, .card, .project-card, .skill-block, .timeline-item, .case-panel, .case-visual, .showcase-panel, .profile-meter, .page-orbit, .hero-stats, .button-row, .newsletter-cta-stack, .contact-links, .hero-slab, .tag-row"
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
applySavedState();
injectNavLinks();
injectEditor();
makeEditable(false);
syncCollectionEditability();
loadPortfolioConfig().then(() => {
  initializeCertifications();
  initializeNewsletter();
  initializeAdminAuth();
});
