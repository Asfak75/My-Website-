import { supabase } from "./supabase.js";

const grid = document.getElementById("servicesGrid");
document.getElementById("year").textContent = new Date().getFullYear();

function whatsappUrl(number, serviceName) {
  const digits = String(number || "").replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? "88" + digits : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(`Hello, I would like to order ${serviceName}.`)}`;
}

async function loadServices() {
  grid.innerHTML = '<div class="loading">Loading services...</div>';

  const [{ data: services, error: serviceError }, { data: setting, error: settingError }] =
    await Promise.all([
      supabase.from("services").select("id,name,display_order").eq("status", true).order("display_order", { ascending: true }).order("created_at", { ascending: true }),
      supabase.from("settings").select("whatsapp_number").eq("id", 1).maybeSingle()
    ]);

  if (serviceError || settingError) {
    grid.innerHTML = '<div class="empty">Services are temporarily unavailable. Please try again later.</div>';
    return;
  }

  if (!services?.length) {
    grid.innerHTML = '<div class="empty">No services are currently available.</div>';
    return;
  }

  const number = setting?.whatsapp_number || "01728405841";
  grid.innerHTML = "";

  services.forEach(service => {
    const card = document.createElement("article");
    card.className = "service-card";

    const title = document.createElement("h3");
    title.textContent = service.name;

    const button = document.createElement("a");
    button.className = "btn btn-primary";
    button.textContent = "Order Now";
    button.href = whatsappUrl(number, service.name);
    button.target = "_blank";
    button.rel = "noopener noreferrer";

    card.append(title, button);
    grid.appendChild(card);
  });
}

loadServices();
