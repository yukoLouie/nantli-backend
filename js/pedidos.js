import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Función para obtener los pedidos del backend
async function obtenerPedidos() {
  try {
    const token = localStorage.getItem("authToken");
    console.log("Token obtenido:", token);

    const res = await fetch("https://nantli-backend.onrender.com/fetch-pedidos", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    console.log("Respuesta del servidor:", res.status);

    if (res.ok) {
      const pedidos = await res.json();
      console.log("Pedidos recibidos:", pedidos);
      mostrarPedidos(pedidos);
    } else {
      const errorText = await res.text();
      console.error("Error al obtener los pedidos:", res.status, errorText);
    }
  } catch (error) {
    console.error("Excepción al obtener los pedidos:", error);
  }
}

// Función para mostrar los pedidos en el menú desplegable
function mostrarPedidos(pedidos) {
    const pedidoList = document.getElementById("pedidoList");
    pedidoList.innerHTML = "";
  
    pedidos.forEach(pedido => {
        console.log("Pedido individual:", pedido);
        // Asignación de valores, con valores predeterminados si no existen
        const cliente = pedido.cliente || "Sin cliente";
        const telefono = pedido.telefono || "Sin teléfono";
        const fecha = pedido.fecha || "Sin fecha";
  
        const li = document.createElement("li");
        li.classList.add("list-group-item");
        li.textContent = `Cliente: ${cliente} - Teléfono: ${telefono} - Fecha: ${fecha}`;
        pedidoList.appendChild(li);
    });
}

  

// Definir auth antes de usarlo
const auth = getAuth();

// Esperar que Firebase confirme el usuario
onAuthStateChanged(auth, async (user) => {
  console.log("Cambio de estado de autenticación:", user);

  if (user) {
    const token = await user.getIdToken();
    console.log("Usuario autenticado. Token guardado.");
    localStorage.setItem("authToken", token);

    document.getElementById("adminMenu").style.display = "block";
    obtenerPedidos();
  } else {
    console.log("Usuario no autenticado.");
  }
});
