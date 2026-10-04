import { supabase } from "./supabase.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `form-message ${type}`;
}

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: allowed } = await supabase.rpc("is_admin");
    if (allowed === true) location.replace("dashboard.html");
    else await supabase.auth.signOut();
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMessage("Please enter your email and password.");
    return;
  }

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Signing in...";

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showMessage("Login failed. Please check your credentials.");
    button.disabled = false;
    button.textContent = "Login";
    return;
  }

  const { data: allowed, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || allowed !== true) {
    await supabase.auth.signOut();
    showMessage("This account is not authorized as an administrator.");
    button.disabled = false;
    button.textContent = "Login";
    return;
  }

  location.replace("dashboard.html");
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" && location.pathname.endsWith("dashboard.html")) {
    location.replace("login.html");
  }
});

init();
