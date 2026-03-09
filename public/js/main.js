function initNavigation() {
  const menu = document.getElementById("nav-menu");
  const toggle = document.getElementById("nav-toggle");
  if (!menu || !toggle) return;

  toggle.setAttribute("aria-expanded", "false");

  toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", menu.classList.contains("open") ? "true" : "false");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setActiveNav() {
  const path = location.pathname;
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (
      (path === "/" && href === "/") ||
      (href !== "/" && path.includes(href)) ||
      (path === "/document.html" && href === "/documents.html")
    ) {
      link.classList.add("active");
    }
  });
}

function showMessage(targetId, text, type = "success") {
  const root = document.getElementById(targetId);
  if (!root) return;
  root.innerHTML = `<div class="notice ${type}">${text}</div>`;
}

initNavigation();
setActiveNav();
