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

// Función para agregar un producto al carrito
async function addToCart(productId, size, quantity) {
  const body = { productId, size, quantity };

  try {
    const response = await fetch('/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(data); // Aquí puedes manejar la respuesta, como mostrar un mensaje o actualizar el carrito
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
  }
}

// Función para realizar checkout
async function checkout() {
  try {
    const response = await fetch('/checkout', { method: 'POST' });
    const data = await response.json();
    console.log(data.message); // Aquí recibes un mensaje de confirmación
  } catch (error) {
    console.error("Error al hacer checkout:", error);
  }
}

// Muestra el modal con los detalles del producto
function showProductModal(product) {
  const modal = document.getElementById("productModal");
  modal.querySelector(".modal-title").textContent = product.titulo;
  modal.querySelector(".modal-body").innerHTML = `
    <img src="${product.imagen}" class="img-fluid" alt="${product.titulo}">
    <p><strong>Descripción:</strong> ${product.descripcion}</p>
    <p><strong>Precio:</strong> $${product.precio}</p>
    <p><strong>Categoría:</strong> ${product.categoria}</p>
    <p><strong>Subcategoría:</strong> ${product.subcategoria}</p>
    <p><strong>Color:</strong> ${product.color}</p>
    <p><strong>Talla:</strong> ${product.talla}</p>
    <p><strong>Cantidad disponible:</strong> ${product.cantidad}</p>
    <button class="btn btn-primary" onclick="addToCart('${product.id}', '${product.talla}', 1)">Agregar al carrito</button>
  `;
  $('#productModal').modal('show');
}
