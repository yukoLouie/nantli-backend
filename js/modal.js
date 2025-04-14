function showProductModal(product) {
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalQrContainer = document.getElementById("modalQrContainer");
  const qrPreview = document.getElementById("qr-preview");

  // Update modal content directly
  modalTitle.textContent = product.titulo;
  modalBody.innerHTML = `
    <img src="${product.imagen}" alt="${product.titulo}" class="img-fluid mb-3">
    <p><strong>Descripción:</strong> ${product.descripcion}</p>
    <p><strong>Precio:</strong> $${product.precio}</p>
    <p><strong>Categoría:</strong> ${product.categoria}</p>
    <p><strong>Subcategoría:</strong> ${product.subcategoria}</p>
    <p><strong>Color:</strong> ${product.color}</p>
    <p><strong>Talla:</strong> ${product.talla}</p>
    <p><strong>Cantidad:</strong> ${product.cantidad}</p>
  `;

  if (product['QR Code URL']) {
    modalQrContainer.style.display = 'block';
    qrPreview.src = product['QR Code URL'];
  } else {
    modalQrContainer.style.display = 'none';
  }

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('productModal'));
  modal.show();
}
