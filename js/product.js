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
        <button class="btn btn-primary btn-sm" onclick='showProductModal(${JSON.stringify(product)})'>Ver más</button>
      </div>
    `;

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
