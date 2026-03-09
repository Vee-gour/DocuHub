async function loadCategorySummary() {
  const container = document.getElementById("category-grid");
  if (!container) return;

  try {
    const categories = await API.get("/api/categories/summary");
    container.innerHTML = "";
    categories.forEach((category) => {
      const article = document.createElement("article");
      article.className = "card";
      article.innerHTML = `
        <h3>${category.name}</h3>
        <p class="muted">${category.description || "No description"}</p>
        <p><strong>${category.documentCount}</strong> documents</p>
        <a class="btn btn-primary" href="/documents.html?category=${category._id}">View Documents</a>
      `;
      container.appendChild(article);
    });
  } catch (error) {
    container.innerHTML = `<div class="notice error">${error.message}</div>`;
  }
}

loadCategorySummary();
