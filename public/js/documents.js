const params = new URLSearchParams(location.search);
let currentPage = Number(params.get("page") || 1);
let currentCategory = params.get("category") || "";
let currentSearch = params.get("search") || "";

async function loadFilters() {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter) return;
  const categories = await API.get("/api/categories");
  categoryFilter.innerHTML =
    '<option value="">All Categories</option>' +
    categories
      .map((category) => `<option value="${category._id}">${category.name}</option>`)
      .join("");
  categoryFilter.value = currentCategory;
}

function updateUrl() {
  const query = new URLSearchParams();
  if (currentPage > 1) query.set("page", String(currentPage));
  if (currentCategory) query.set("category", currentCategory);
  if (currentSearch) query.set("search", currentSearch);
  const qs = query.toString();
  history.replaceState({}, "", qs ? `/documents.html?${qs}` : "/documents.html");
}

async function loadDocuments() {
  const list = document.getElementById("document-list");
  const pagination = document.getElementById("pagination");
  list.innerHTML = "<p>Loading documents...</p>";
  pagination.innerHTML = "";

  try {
    const query = new URLSearchParams({
      page: String(currentPage),
      limit: "8"
    });
    if (currentCategory) query.set("category", currentCategory);
    if (currentSearch) query.set("search", currentSearch);

    const response = await API.get(`/api/documents?${query.toString()}`);
    list.innerHTML = "";
    response.data.forEach((doc) => {
      const row = document.createElement("div");
      row.className = "card list-item";
      row.innerHTML = `
        <div>
          <h3 style="margin:0 0 0.3rem;">${doc.title}</h3>
          <p class="muted" style="margin:0;">${doc.description || "No description"}</p>
          <small>${doc.category?.name || "Uncategorized"}</small>
        </div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <a class="btn btn-primary" href="/document.html?id=${doc._id}">View in Browser</a>
          <a class="btn btn-ghost" href="${doc.downloadUrl || "#"}" target="_blank" ${doc.downloadUrl ? "" : 'aria-disabled="true"'}>Download PDF</a>
        </div>
      `;
      list.appendChild(row);
    });

    if (!response.data.length) {
      list.innerHTML = '<div class="card"><p class="muted">No documents found.</p></div>';
    }

    for (let i = 1; i <= response.pagination.totalPages; i += 1) {
      const btn = document.createElement("button");
      btn.className = i === currentPage ? "btn btn-primary" : "btn btn-ghost";
      btn.textContent = String(i);
      btn.addEventListener("click", () => {
        currentPage = i;
        updateUrl();
        loadDocuments();
      });
      pagination.appendChild(btn);
    }
  } catch (error) {
    list.innerHTML = `<div class="notice error">${error.message}</div>`;
  }
}

function bindActions() {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  searchInput.value = currentSearch;
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    currentPage = 1;
    currentSearch = searchInput.value.trim();
    updateUrl();
    loadDocuments();
  });

  categoryFilter.addEventListener("change", () => {
    currentPage = 1;
    currentCategory = categoryFilter.value;
    updateUrl();
    loadDocuments();
  });
}

async function init() {
  await loadFilters();
  bindActions();
  await loadDocuments();
}

init();
