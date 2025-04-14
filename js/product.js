// product.js

// Renderiza las tarjetas de producto en el contenedor
function renderCards(productos) {
  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  productos.forEach(product => {
    const card = document.createElement("div");
    card.className = "card m-2 p-2";
    card.style.width = "18rem";

    card.innerHTML = `
      <img src="${product.imagen}" class="card-img-top" alt="${product.titulo}">
      <div class="card-body">
        <h5 class="card-title">${product.titulo}</h5>
        <p class="card-text"><strong>Precio:</strong> $${product.precio}</p>
        <div class="d-flex justify-content-between">
          <button class="btn btn-sm btn-secondary ver-mas-btn">Ver más</button>
          <button class="btn btn-sm btn-success agregar-btn">Agregar</button>
        </div>
      </div>
    `;

    // Botón "Ver más"
    const verMasBtn = card.querySelector(".ver-mas-btn");
    verMasBtn.addEventListener("click", () => showProductModal(product));

    // Botón "Agregar al carrito"
    const agregarBtn = card.querySelector(".agregar-btn");
    agregarBtn.addEventListener("click", () => {
      addToCart(product.id, product.talla, 1);
    });

    container.appendChild(card);
  });
}

// Ordenar productos por precio
function sortByPrice(order) {
  const sorted = [...productosOriginales].sort((a, b) =>
    order === 'asc' ? a.precio - b.precio : b.precio - a.precio
  );
  renderCards(sorted);
}

// Ordenar productos por título
function sortByTitle(order) {
  const sorted = [...productosOriginales].sort((a, b) =>
    order === 'asc'
      ? a.titulo.localeCompare(b.titulo)
      : b.titulo.localeCompare(a.titulo)
  );
  renderCards(sorted);
}

let carrito = [];

// Agrega un producto al carrito
function addToCart(productId, talla, cantidad = 1) {
  const existing = carrito.find(item => item.id === productId && item.talla === talla);
  if (existing) {
    if (existing.cantidad + cantidad <= existing.disponible) {
      existing.cantidad += cantidad;
    } else {
      alert("No puedes agregar más de la cantidad disponible");
    }
  } else {
    const product = productosOriginales.find(p => p.id === productId && p.talla === talla);
    if (!product) return alert("Producto no encontrado");

    carrito.push({
      id: product.id,
      titulo: product.titulo,
      talla: product.talla,
      precio: product.precio,
      cantidad: cantidad,
      disponible: product.cantidad,
    });
  }

  renderCart();
}

// Muestra el carrito en un modal o div
function renderCart() {
  const container = document.getElementById("cartContainer");
  container.innerHTML = "";

  if (carrito.length === 0) {
    container.innerHTML = "<p>Carrito vacío</p>";
    return;
  }

  carrito.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item mb-2";

    div.innerHTML = `
      <p><strong>${item.titulo}</strong> (Talla: ${item.talla}) - $${item.precio} x 
      <input type="number" min="1" max="${item.disponible}" value="${item.cantidad}" data-index="${index}" class="cart-qty" style="width: 60px"> 
      = $${item.precio * item.cantidad}</p>
      <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">Eliminar</button>
    `;

    container.appendChild(div);
  });

  // Listeners para cambio de cantidad
  document.querySelectorAll(".cart-qty").forEach(input => {
    input.addEventListener("change", (e) => {
      const i = e.target.dataset.index;
      const value = parseInt(e.target.value);
      if (value > 0 && value <= carrito[i].disponible) {
        carrito[i].cantidad = value;
        renderCart();
      } else {
        e.target.value = carrito[i].cantidad;
      }
    });
  });
}

// Eliminar producto del carrito
function removeFromCart(index) {
  carrito.splice(index, 1);
  renderCart();
}

// Checkout
async function checkout() {
  if (carrito.length === 0) {
    return alert("El carrito está vacío");
  }

  try {
    // Cambiar la URL de la solicitud a la URL del backend en Render
    const response = await fetch("https://nantli-backend.onrender.com/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productos: carrito }),
    });

    if (!response.ok) {
      throw new Error("Error al procesar el checkout");
    }

    const data = await response.json();
    alert(data.message || "Checkout exitoso");

    // Limpiar carrito y recargar productos
    carrito = [];
    renderCart();
    fetchProductos(); // <- función que deberías tener para recargar productos desde el backend

  } catch (err) {
    console.error("Error en el checkout:", err);
    alert("Error al procesar el checkout");
  }
}
