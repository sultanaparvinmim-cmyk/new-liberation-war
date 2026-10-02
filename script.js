import { documents, interviews, gallery } from "./data.js";

const $ = (id) => document.getElementById(id);

// Shared Tailwind class groups
const CARD = "group flex flex-col overflow-hidden border border-dashed border-zinc-500 bg-white transition hover:border-solid hover:bg-lime-50";
const BODY = "flex flex-1 flex-col gap-2 p-5";
const TITLE = "text-xl font-bold text-zinc-950";
const BTN = "rounded-sm border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-800 hover:text-white";
const BTN_FILL = "rounded-sm bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900";
const MEDIA = "mt-3 rounded-sm border border-zinc-100 bg-zinc-50 p-5";

// ---------- Card templates ----------
const documentCard = (doc) => `
  <article class="${CARD}">
    <div class="${BODY}">
      <div class="self-start rounded-sm bg-lime-100 px-3 py-1 text-xs font-bold text-lime-700">${doc.category}</div>
      <h2 class="${TITLE}">${doc.title}</h2>
      <p class="text-sm text-zinc-500"><strong class="text-zinc-700">Date:</strong> ${doc.date}</p>
      <p class="text-zinc-600">${doc.description}</p>
      <p class="text-sm text-zinc-500"><strong class="text-zinc-700">Source:</strong> ${doc.source}</p>
      <div class="mt-auto flex justify-end pt-3">
        <button class="${BTN}" data-id="${doc.id}">View Details</button>
      </div>
    </div>
  </article>`;

const mediaBox = (item) => {
  if (item.mediaType === "Audio") {
    return `
      <div class="${MEDIA}">
        <p class="mb-3 font-semibold text-zinc-900">Audio Interview</p>
        <audio controls class="w-full"><source src="${item.audioUrl}" type="audio/mpeg"></audio>
      </div>`;
  }
  if (item.mediaType === "Video") {
    return `
      <div class="${MEDIA}">
        <p class="mb-3 font-semibold text-zinc-900">Video Interview</p>
        <div class="aspect-video">
          <iframe class="h-full w-full rounded-sm" src="${item.videoUrl}" title="${item.name} Interview" allowfullscreen></iframe>
        </div>
      </div>`;
  }
  return `
    <div class="mt-3 rounded-sm border border-zinc-200 bg-zinc-100 p-5 text-center">
      <p class="font-semibold text-zinc-600">Media not available</p>
    </div>`;
};

const interviewCard = (item) => `
  <article class="${CARD}">
    <div class="${BODY}">
      <div class="self-start rounded-sm bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-800">${item.role}</div>
      <h2 class="${TITLE}">${item.name}</h2>
      <p class="text-zinc-600"><strong class="text-zinc-800">Biography:</strong> ${item.biography}</p>
      <p class="text-zinc-600"><strong class="text-zinc-800">Interview Summary:</strong> ${item.summary}</p>
      ${mediaBox(item)}
    </div>
  </article>`;

const galleryCard = (photo) => `
  <article class="${CARD}">
    <figure class="overflow-hidden">
      <img src="${photo.image}" alt="${photo.title}" class="h-56 w-full cursor-pointer object-cover grayscale transition duration-500 group-hover:grayscale-0" data-download="${photo.id}" title="Click to download">
    </figure>
    <div class="${BODY}">
      <div class="self-start rounded-sm bg-lime-100 px-3 py-1 text-xs font-bold text-lime-800">${photo.category}</div>
      <h2 class="${TITLE}">${photo.title}</h2>
      <p class="text-zinc-600">${photo.description}</p>
      <div class="mt-auto flex justify-end gap-2 pt-3">
        <button class="${BTN}" data-id="${photo.id}">Zoom</button>
        <button class="${BTN_FILL}" data-download="${photo.id}">Download</button>
      </div>
    </div>
  </article>`;

// ---------- Small reusable helpers ----------
function render(containerId, items, cardTemplate) {
  $(containerId).innerHTML = items.map(cardTemplate).join("");
}

// Buttons with data-filter="Category" re-render the list
function setupFilter(containerId, items, cardTemplate) {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.filter;
      const list = category === "All" ? items : items.filter((item) => item.category === category);
      render(containerId, list, cardTemplate);
    });
  });
}

// Buttons with data-id="1" inside a container open a modal for that item
function setupModal(containerId, items, openModal) {
  $(containerId).addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    openModal(items.find((item) => item.id === Number(button.dataset.id)));
  });
}

// Fetch the image as a file, then save it directly (no new tab)
async function downloadPhoto(photo) {
  try {
    const response = await fetch(photo.image);
    const blob = await response.blob();
    console.log("Blob type:", blob.type); // Log the MIME type of the blob
    const extension = blob.type.split("/")[1] || "jpg";

    const link = document.createElement("a");
    console.log("Link href:", URL.createObjectURL(blob)); // Log the object URL
    link.href = URL.createObjectURL(blob);
    link.download = photo.title.toLowerCase().replace(/\s+/g, "-") + "." + extension;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    window.open(photo.image, "_blank"); // fallback if the download is blocked
  }
}

// Image or Download button with data-download="1" saves that photo
function setupDownload(containerId, items) {
  $(containerId).addEventListener("click", (event) => {
    const target = event.target.closest("[data-download]");
    if (!target) return;
    downloadPhoto(items.find((item) => item.id === Number(target.dataset.download)));
  });
}

// ---------- Modals ----------
function openDocument(doc) {
  $("modalTitle").innerText = doc.title;
  $("modalCategory").innerText = "Category: " + doc.category;
  $("modalDate").innerText = "Date: " + doc.date;
  $("modalSource").innerText = "Source: " + doc.source;
  $("modalDescription").innerText = doc.description;
  $("documentModal").showModal();
}

function openPhoto(photo) {
  $("imageModalTitle").innerText = photo.title;
  $("imageModalPhoto").src = photo.image;
  $("imageModalDescription").innerText = photo.description;
  $("imageModal").showModal();
}

// ---------- Contact form ----------
function setupContactForm() {
  const form = $("contactForm");
  const messageBox = $("formMessage");

  const showMessage = (text, colorClass) => {
    messageBox.innerText = text;
    messageBox.className = "text-sm font-semibold " + colorClass;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("name").value.trim();
    const email = $("email").value.trim();
    const subject = $("subject").value.trim();
    const message = $("message").value.trim();

    if (!name || !email || !subject || !message) {
      return showMessage("Please fill in all required fields.", "text-lime-600");
    }
    if (!email.includes("@")) {
      return showMessage("Please enter a valid email address.", "text-lime-600");
    }

    showMessage("Your message has been submitted successfully.", "text-zinc-700");
    form.reset();
  });
}

// ---------- Start (each page only runs what it has) ----------
if ($("documentsContainer")) {
  render("documentsContainer", documents, documentCard);
  setupFilter("documentsContainer", documents, documentCard);
  setupModal("documentsContainer", documents, openDocument);
}

if ($("interviewsContainer")) {
  render("interviewsContainer", interviews, interviewCard);
}

if ($("galleryContainer")) {
  render("galleryContainer", gallery, galleryCard);
  setupFilter("galleryContainer", gallery, galleryCard);
  setupModal("galleryContainer", gallery, openPhoto);
  setupDownload("galleryContainer", gallery);
}

if ($("contactForm")) {
  setupContactForm();
}