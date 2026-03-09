const urlParams = new URLSearchParams(location.search);
const docId = urlParams.get("id");
let pdfDoc = null;
let pageNum = 1;

async function renderPage(num) {
  const canvas = document.getElementById("pdf-canvas");
  const context = canvas.getContext("2d");
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1.2 });
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: context, viewport }).promise;
  document.getElementById("pageInfo").textContent = `Page ${num} of ${pdfDoc.numPages}`;
}

async function loadDocument() {
  const titleEl = document.getElementById("docTitle");
  const metaEl = document.getElementById("docMeta");
  const htmlView = document.getElementById("htmlView");
  const viewer = document.getElementById("pdfViewer");
  if (!docId) {
    titleEl.textContent = "Document ID is missing.";
    return;
  }

  try {
    const doc = await API.get(`/api/documents/${docId}`);
    titleEl.textContent = doc.title;
    metaEl.innerHTML = `${doc.description || "No description"}<br><small>${doc.category?.name || ""}</small>`;
    document.getElementById("downloadLink").href = doc.downloadUrl;

    if (doc.htmlContent) {
      htmlView.innerHTML = doc.htmlContent;
    } else {
      htmlView.innerHTML = '<p class="muted">No converted HTML content available.</p>';
    }

    if (doc.downloadUrl && typeof pdfjsLib !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js";
      pdfDoc = await pdfjsLib.getDocument(doc.downloadUrl).promise;
      await renderPage(pageNum);
      viewer.style.display = "block";
    } else {
      if (doc.downloadUrl && typeof pdfjsLib === "undefined") {
        htmlView.insertAdjacentHTML(
          "afterbegin",
          '<p class="muted">PDF preview is unavailable right now. Use the download button.</p>'
        );
      }
      viewer.style.display = "none";
    }
  } catch (error) {
    titleEl.textContent = error.message;
  }
}

document.getElementById("prevPage").addEventListener("click", async () => {
  if (!pdfDoc || pageNum <= 1) return;
  pageNum -= 1;
  await renderPage(pageNum);
});

document.getElementById("nextPage").addEventListener("click", async () => {
  if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
  pageNum += 1;
  await renderPage(pageNum);
});

loadDocument();
