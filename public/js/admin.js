function getToken() {
  return localStorage.getItem("docuhub_token");
}

function setToken(token) {
  localStorage.setItem("docuhub_token", token);
}

function clearToken() {
  localStorage.removeItem("docuhub_token");
}

async function login(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  try {
    const response = await API.post("/api/auth/login", { username, password });
    setToken(response.token);
    showMessage("authMessage", "Login successful.");
    toggleAdminPanels();
    await bootstrapAdminData();
  } catch (error) {
    showMessage("authMessage", error.message, "error");
  }
}

function logout() {
  clearToken();
  toggleAdminPanels();
}

function toggleAdminPanels() {
  const authed = Boolean(getToken());
  document.getElementById("loginPanel").style.display = authed ? "none" : "block";
  document.getElementById("adminPanel").style.display = authed ? "grid" : "none";
}

async function loadCategories(selectId = "categoryId") {
  const categories = await API.get("/api/categories");
  const select = document.getElementById(selectId);
  select.innerHTML = categories.map((c) => `<option value="${c._id}">${c.name}</option>`).join("");

  const manageList = document.getElementById("categoryManageList");
  manageList.innerHTML = "";
  categories.forEach((c) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div><strong>${c.name}</strong><br><small class="muted">${c.description || ""}</small></div>
      <button class="btn btn-danger" data-id="${c._id}" data-type="delete-category">Delete</button>
    `;
    manageList.appendChild(row);
  });
}

async function loadDocumentsForAdmin() {
  const root = document.getElementById("adminDocumentList");
  root.innerHTML = "<p>Loading...</p>";
  const response = await API.get("/api/documents?limit=50&page=1");
  root.innerHTML = "";
  response.data.forEach((doc) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div>
        <strong>${doc.title}</strong><br>
        <small>${doc.category?.name || ""}</small>
      </div>
      <div style="display:flex;gap:0.4rem;">
        <button class="btn btn-ghost" data-id="${doc._id}" data-type="prefill-doc">Edit</button>
        <button class="btn btn-danger" data-id="${doc._id}" data-type="delete-doc">Delete</button>
      </div>
    `;
    root.appendChild(row);
  });
}

async function bootstrapAdminData() {
  await loadCategories();
  await loadDocumentsForAdmin();
}

async function createCategory(event) {
  event.preventDefault();
  const name = document.getElementById("newCategoryName").value.trim();
  const description = document.getElementById("newCategoryDescription").value.trim();
  if (!name) return;
  try {
    await API.post("/api/categories", { name, description });
    showMessage("categoryMessage", "Category created");
    event.target.reset();
    await loadCategories();
  } catch (error) {
    showMessage("categoryMessage", error.message, "error");
  }
}

async function uploadOrUpdateDocument(event) {
  event.preventDefault();
  const form = document.getElementById("documentForm");
  const formData = new FormData(form);
  const docId = document.getElementById("documentId").value;

  try {
    if (docId) {
      await API.put(`/api/documents/${docId}`, formData, true);
      showMessage("documentMessage", "Document updated");
    } else {
      await API.post("/api/documents", formData, true);
      showMessage("documentMessage", "Document created");
    }
    form.reset();
    document.getElementById("documentId").value = "";
    await loadDocumentsForAdmin();
  } catch (error) {
    showMessage("documentMessage", error.message, "error");
  }
}

async function handleAdminActions(event) {
  const target = event.target;
  const actionType = target.dataset.type;
  const id = target.dataset.id;
  if (!actionType || !id) return;

  try {
    if (actionType === "delete-doc") {
      await API.delete(`/api/documents/${id}`);
      await loadDocumentsForAdmin();
      return;
    }

    if (actionType === "delete-category") {
      await API.delete(`/api/categories/${id}`);
      await loadCategories();
      return;
    }

    if (actionType === "prefill-doc") {
      const doc = await API.get(`/api/documents/${id}`);
      document.getElementById("documentId").value = doc._id;
      document.getElementById("title").value = doc.title;
      document.getElementById("description").value = doc.description || "";
      document.getElementById("categoryId").value = doc.category?._id || "";
      document.getElementById("externalUrl").value = doc.externalUrl || "";
      document.getElementById("convertToHtml").checked = Boolean(doc.convertToHtml);
    }
  } catch (error) {
    showMessage("documentMessage", error.message, "error");
  }
}

document.getElementById("loginForm").addEventListener("submit", login);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("categoryForm").addEventListener("submit", createCategory);
document.getElementById("documentForm").addEventListener("submit", uploadOrUpdateDocument);
document.getElementById("adminPanel").addEventListener("click", handleAdminActions);

toggleAdminPanels();
if (getToken()) {
  bootstrapAdminData().catch((error) => {
    clearToken();
    toggleAdminPanels();
    showMessage("authMessage", error.message, "error");
  });
}
