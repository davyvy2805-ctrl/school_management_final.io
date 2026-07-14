
const USERS_KEY = "edunova_users";
const SESSION_KEY = "edunova_session";

document.addEventListener("DOMContentLoaded", () => {
  createDefaultAdmin();
  bindPasswordToggles();

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if(loginForm){
    if(getSession()) window.location.href = "index.html";
    loginForm.addEventListener("submit", handleLogin);
    document.getElementById("forgotPasswordBtn").addEventListener("click", () => {
      showAuthToast("Demo project: password reset needs a backend/email service.");
    });
  }

  if(registerForm){
    registerForm.addEventListener("submit", handleRegister);
  }
});

function createDefaultAdmin(){
  const users = getUsers();
  const exists = users.some(u => u.email.toLowerCase() === "admin@edunova.edu");
  if(!exists){
    users.push({
      id: Date.now(),
      name: "Admin Dara",
      role: "Administrator",
      email: "admin@edunova.edu",
      password: "admin123"
    });
    saveUsers(users);
  }
}

function handleLogin(event){
  event.preventDefault();
  hideAlert("loginAlert");

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const remember = document.getElementById("rememberMe").checked;
  const user = getUsers().find(u => u.email.toLowerCase() === email && u.password === password);

  if(!user){
    showAlert("loginAlert","Incorrect email or password.");
    return;
  }

  const session = {id:user.id,name:user.name,email:user.email,role:user.role};
  if(remember){
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem(SESSION_KEY);
  }else{
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.removeItem(SESSION_KEY);
  }

window.location.replace("../../../index.html");
}

function handleRegister(event){
  event.preventDefault();
  hideAlert("registerAlert");

  const name = document.getElementById("registerName").value.trim();
  const role = document.getElementById("registerRole").value;
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if(password.length < 6){
    showAlert("registerAlert","Password must contain at least 6 characters.");
    return;
  }
  if(password !== confirmPassword){
    showAlert("registerAlert","Passwords do not match.");
    return;
  }

  const users = getUsers();
  if(users.some(u => u.email.toLowerCase() === email)){
    showAlert("registerAlert","An account with this email already exists.");
    return;
  }

  users.push({id:Date.now(),name,role,email,password});
  saveUsers(users);
  alert("Account created successfully. You can now login.");
  window.location.href = "login.html";
}

function bindPasswordToggles(){
  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const icon = button.querySelector("i");
      input.type = input.type === "password" ? "text" : "password";
      icon.className = input.type === "password" ? "bi bi-eye" : "bi bi-eye-slash";
    });
  });
}

function getUsers(){
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getSession(){
  return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "null");
}
function showAlert(id,message){
  const alert = document.getElementById(id);
  alert.textContent = message;
  alert.classList.remove("d-none");
}
function hideAlert(id){
  document.getElementById(id)?.classList.add("d-none");
}
function showAuthToast(message){
  const el = document.getElementById("authToast");
  if(!el) return;
  document.getElementById("authToastMessage").textContent = message;
  bootstrap.Toast.getOrCreateInstance(el,{delay:2800}).show();
}
