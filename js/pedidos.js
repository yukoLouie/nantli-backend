import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Función para obtener los pedidos del backend
async function obtenerPedidos() {
  try {
    const token = localStorage.getItem("authToken");
    const res = await fetch("/fetch-pedidos", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (res.ok) {
      const pedidos = await res.json();
      mostrarPedidos(pedidos);
    } else {
      console.error("No se pudieron obtener los pedidos.");
    }
  } catch (error) {
    console.error("Error al obtener los pedidos:", error);
  }
}

// Función para mostrar los pedidos en el menú desplegable
function mostrarPedidos(pedidos) {
  const pedidoList = document.getElementById("pedidoList");
  pedidoList.innerHTML = "";

  pedidos.forEach(pedido => {
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.textContent = `Pedido #${pedido.ID} - Cliente: ${pedido.Cliente} - Fecha: ${pedido.Fecha}`;
    pedidoList.appendChild(li);
  });
}

// Esperar que Firebase confirme el usuario y sus claims
document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const tokenResult = await user.getIdTokenResult();
      const isAdmin = tokenResult.claims.admin === true;

      if (isAdmin) {
        localStorage.setItem("authToken", tokenResult.token); // Usado en fetch
        document.getElementById("adminMenu").style.display = "block";
        obtenerPedidos();
      } else {
        console.log("Usuario autenticado pero no es administrador.");
      }
    } else {
      console.log("Usuario no autenticado.");
    }
  });
});
