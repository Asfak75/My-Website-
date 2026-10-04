import { supabase } from "./supabase.js";

const tableBody = document.getElementById("servicesTable");
const modal = document.getElementById("serviceModal");
const serviceForm = document.getElementById("serviceForm");
const serviceMessage = document.getElementById("serviceMessage");
const modalMessage = document.getElementById("modalMessage");
const settingsMessage = document.getElementById("settingsMessage");

let services = [];

function message(el, text, type = "error") {
  el.textContent = text;
  el.className = text ? `form-message ${type}` : "form-message";
}

function openModal(service = null) {
  message(modalMessage, "");
  document.getElementById("modalTitle").textContent = service ? "Edit Service" : "Add Service";
  document.getElementById("serviceId").value = service?.id || "";
  document.getElementById("serviceName").value = service?.name || "";
  document.getElementById("serviceStatus").value = String(service?.status ?? true);
  document.getElementById("serviceOrder").value = service?.display_order ?? (services.length + 1);
  modal.hidden = false;
  document.getElementById("serviceName").focus();
}

function closeModal() {
  modal.hidden = true;
  serviceForm.reset();
}

async function requireAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.replace("login.html");
    return false;
  }

  const { data: allowed, error } = await supabase.rpc("is_admin");
  if (error || allowed !== true) {
    await supabase.auth.signOut();
    location.replace("login.html");
    return false;
  }

  document.getElementById("adminEmail").textContent = session.user.email || "";
  return true;
}

async function loadServices() {
  const { data, error } = await supabase.from("services")
    .select("id,name,status,display_order,created_at,updated_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    message(serviceMessage, "Could not load services.");
    return;
  }
  services = data || [];
  renderServices();
}

function renderServices() {
  if (!services.length) {
    tableBody.innerHTML = '<tr><td colspan="4" class="empty">No services yet.</td></tr>';
    return;
  }

  tableBody.innerHTML = "";
  services.forEach(service => {
    const row = document.createElement("tr");

    const name = document.createElement("td");
    name.textContent = service.name;

    const status = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status ${service.status ? "active" : "disabled"}`;
    badge.textContent = service.status ? "Active" : "Disabled";
    status.appendChild(badge);

    const order = document.createElement("td");
    order.textContent = service.display_order;

    const actions = document.createElement("td");
    actions.className = "actions";

    const edit = document.createElement("button");
    edit.className = "btn btn-outline small-btn";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openModal(service));

    const toggle = document.createElement("button");
    toggle.className = "btn btn-outline small-btn";
    toggle.textContent = service.status ? "Disable" : "Enable";
    toggle.addEventListener("click", () => toggleService(service));

    const del = document.createElement("button");
    del.className = "btn btn-danger small-btn";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteService(service));

    actions.append(edit, toggle, del);
    row.append(name, status, order, actions);
    tableBody.appendChild(row);
  });
}

async function toggleService(service) {
  const { error } = await supabase.from("services")
    .update({ status: !service.status })
    .eq("id", service.id);
  if (error) {
    message(serviceMessage, "Could not update service.");
    return;
  }
  await loadServices();
}

async function deleteService(service) {
  if (!confirm(`Delete "${service.name}"? This cannot be undone.`)) return;

  const { error } = await supabase.from("services").delete().eq("id", service.id);
  if (error) {
    message(serviceMessage, "Could not delete service.");
    return;
  }
  message(serviceMessage, "Service deleted.", "success");
  await loadServices();
}

serviceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message(modalMessage, "");

  const id = document.getElementById("serviceId").value;
  const name = document.getElementById("serviceName").value.trim();
  const status = document.getElementById("serviceStatus").value === "true";
  const displayOrder = Number(document.getElementById("serviceOrder").value);

  if (!name || name.length > 100 || !Number.isInteger(displayOrder) || displayOrder < 0) {
    message(modalMessage, "Enter a valid service name and display order.");
    return;
  }

  const payload = { name, status, display_order: displayOrder };
  const result = id
    ? await supabase.from("services").update(payload).eq("id", id)
    : await supabase.from("services").insert(payload);

  if (result.error) {
    message(modalMessage, "Could not save service. Please check your input.");
    return;
  }

  closeModal();
  message(serviceMessage, id ? "Service updated." : "Service added.", "success");
  await loadServices();
});

async function loadSettings() {
  const { data, error } = await supabase.from("settings").select("whatsapp_number").eq("id", 1).single();
  if (error) {
    message(settingsMessage, "Could not load settings.");
    return;
  }
  document.getElementById("whatsappNumber").value = data.whatsapp_number || "";
}

document.getElementById("settingsForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.getElementById("whatsappNumber");
  const digits = input.value.replace(/\D/g, "");

  if (digits.length < 8 || digits.length > 15) {
    message(settingsMessage, "Enter a valid WhatsApp number.");
    return;
  }

  const { error } = await supabase.from("settings")
    .update({ whatsapp_number: input.value.trim() })
    .eq("id", 1);

  if (error) {
    message(settingsMessage, "Could not save the WhatsApp number.");
    return;
  }
  message(settingsMessage, "Settings saved successfully.", "success");
});

document.getElementById("addServiceBtn").addEventListener("click", () => openModal());
document.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", closeModal));
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.replace("login.html");
});

async function init() {
  if (!(await requireAdmin())) return;
  await Promise.all([loadServices(), loadSettings()]);
}
init();
