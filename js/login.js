import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxctSpM7t83T2Piu5L1vmyy3oEIatvJzQ",
  authDomain: "nantli-8bf92.firebaseapp.com",
  projectId: "nantli-8bf92",
  storageBucket: "nantli-8bf92.appspot.com",
  messagingSenderId: "1048095137675",
  appId: "1:1048095137675:web:77ce2175cdb95ba9cdd98e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Referencias a botones y elementos del DOM
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const floatingBtn = document.querySelector(".floating-btn");
const formContainer = document.getElementById("formContainer");

// Manejar login
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // Cerrar modal
    const modalEl = document.getElementById("loginModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance?.hide();

    modalEl.addEventListener("hidden.bs.modal", () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
      loginForm.reset();
    }, { once: true });

  } catch (error) {
    alert("Error al iniciar sesión: " + error.message);
  }
});

// Cerrar sesión
logoutBtn?.addEventListener("click", () => {
  signOut(auth).catch(error => {
    alert("Error al cerrar sesión: " + error.message);
  });
});

// Cambios de sesión
onAuthStateChanged(auth, async (user) => {
  const adminMenu = document.getElementById("adminMenu");
  const pedidosWrapper = document.getElementById("pedidosWrapper");

  if (user) {
    const token = await user.getIdToken();

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("authToken", token);

    loginBtn?.classList.add("d-none");
    logoutBtn?.classList.remove("d-none");
    floatingBtn?.classList.remove("d-none");
    formContainer?.classList.remove("d-none");
    if (adminMenu) adminMenu.style.display = "block";
    if (pedidosWrapper) pedidosWrapper.style.display = "block";

  } else {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("authToken");

    loginBtn?.classList.remove("d-none");
    logoutBtn?.classList.add("d-none");
    floatingBtn?.classList.add("d-none");
    formContainer?.classList.add("hidden");
    if (adminMenu) adminMenu.style.display = "none";
    if (pedidosWrapper) pedidosWrapper.style.display = "none";
  }
});


// Exportar utilidad
export function isUserLoggedIn() {
  const auth = getAuth();
  return !!auth.currentUser;
}
