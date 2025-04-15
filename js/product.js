

// Renderiza las tarjetas de producto en el contenedor
function renderCards(productos) {
  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  productos.forEach(product => {
    const card = document.createElement("div");
    card.className = "card m-2 p-2";
    card.style.width = "18rem";

    card.innerHTML = `
     <img src="${product.imagen}" class="card-img-top rounded-top product-img" alt="${product.titulo}">
<div class="card-body d-flex flex-column justify-content-between">
  <h5 class="card-title text-primary">${product.titulo}</h5>
  <p class="card-text"><strong>Precio:</strong> <span class="text-success">$${product.precio}</span></p>
  <div class="d-flex justify-content-between mt-3">
    <button class="btn btn-outline-info btn-sm ver-mas-btn">Ver más</button>
    <button class="btn btn-success btn-sm agregar-btn">Agregar</button>
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

// Muestra más detalles del producto en un modal
function showProductModal(product) {
  const modalContent = document.getElementById("productModalContent");

  modalContent.innerHTML = `
  <div class="text-center mb-3">
    <h5 class="modal-title text-primary">${product.titulo}</h5>
  </div>
  <div class="text-center mb-3">
    <img src="${product.imagen}" class="img-fluid rounded shadow-sm" alt="${product.titulo}" style="max-height: 200px;" />
  </div>
  <div class="mb-2">
    <p><strong>Precio:</strong> <span class="text-success">$${product.precio}</span></p>
    <p><strong>Descripción:</strong> ${product.descripcion}</p>
    <p><strong>Talla:</strong> ${product.talla}</p>
    <p><strong>Disponible:</strong> ${product.cantidad}</p>
  </div>
  <div class="text-center mb-3">
    <h6 class="text-muted">Código QR del producto</h6>
    <img src="${product['QR Code URL']}" alt="QR Code" class="img-fluid rounded" style="max-height: 160px;" />
  </div>
  <div class="d-flex justify-content-end gap-2 mt-4">
    <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
    <button class="btn btn-success" onclick="addToCart(${product.id}, '${product.talla}', 1)">Agregar al carrito</button>
  </div>
`;
console.log("Producto en modal:", product);


  const modal = new bootstrap.Modal(document.getElementById("productModal"));
  modal.show();
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
      imagen: product.imagen,  // Asegúrate de agregar la imagen al carrito
    });
  }

  renderCart();
  updateCartBadge();  // Actualizar el badge del carrito
}

// Calcula el total del carrito
function calculateCartTotal() {
  let total = 0;
  carrito.forEach(item => {
    total += item.precio * item.cantidad;
  });
  return total;
}

// Función para contar los productos en el carrito
function getCartItemCount() {
  return carrito.reduce((total, item) => total + item.cantidad, 0);
}

// Función para actualizar el badge del carrito
function updateCartBadge() {
  const cartBadge = document.getElementById("cartBadge");
  const totalItems = getCartItemCount();
  if (totalItems > 0) {
    cartBadge.textContent = totalItems;  // Muestra la cantidad de productos
    cartBadge.style.display = "inline";  // Muestra el badge
  } else {
    cartBadge.style.display = "none";  // Oculta el badge si no hay productos
  }
}

// Muestra el carrito en un modal o div
function renderCart() {
  const container = document.getElementById("cartItems");
  container.innerHTML = "";

  if (carrito.length === 0) {
    container.innerHTML = "<p>Carrito vacío</p>";
    document.getElementById('cartTotal').textContent = "$0"; // Asegúrate de que el total esté a $0 si el carrito está vacío
    return;
  }

  carrito.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item d-flex justify-content-between align-items-center p-3 mb-2 bg-white rounded shadow-sm";

    div.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${item.imagen}" alt="${item.titulo}" class="rounded" style="width: 50px; height: 50px; object-fit: cover; margin-right: 15px;">
        <div>
          <p class="mb-1 fw-semibold">${item.titulo}</p>
          <small class="text-muted">Talla: ${item.talla} | $${item.precio} c/u</small>
        </div>
      </div>
      <div class="text-end">
        <div class="d-flex align-items-center gap-2">
          <input type="number" min="1" max="${item.disponible}" value="${item.cantidad}" data-index="${index}" class="cart-qty form-control form-control-sm" style="width: 70px;">
          <span class="fw-bold text-success">= $${item.precio * item.cantidad}</span>
          <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${index})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `;
    

    container.appendChild(div);
  });

  // Mostrar el total actualizado
  const total = calculateCartTotal();
  document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;

  // Listeners para cambio de cantidad
  document.querySelectorAll(".cart-qty").forEach(input => {
    input.addEventListener("change", (e) => {
      const i = e.target.dataset.index;
      const value = parseInt(e.target.value);
      if (value > 0 && value <= carrito[i].disponible) {
        carrito[i].cantidad = value;
        renderCart(); // Vuelve a renderizar el carrito y el total
        updateCartBadge();  // Actualiza el badge del carrito
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
  updateCartBadge();  // Actualiza el badge del carrito
}

// Checkout
async function checkout() {
  if (carrito.length === 0) {
    return alert("El carrito está vacío");
  }

  try {
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

    carrito = [];
    renderCart();
    updateCartBadge(); // Actualiza el badge del carrito a cero
  } catch (err) {
    console.error("Error en el checkout:", err);
    alert("Error al procesar el checkout");
  }
}

// Función para abrir el carrito en un modal
function abrirCarrito() {
  renderCart(); // Asegura que esté actualizado
  const modal = new bootstrap.Modal(document.getElementById("cartModal"));
  modal.show();
}
