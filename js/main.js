// Variables globales
let productosOriginales = [];
let selectedCategory = null;
let selectedSubcategory = null;
let selectedSize = null;
let selectedColor = null;

// Cargar productos desde el backend
async function loadProducts() {
  try {
    const res = await fetch("https://nantli-backend.onrender.com/fetch-sheet");
    const data = await res.json();

    productosOriginales = data;

    // Asegúrate de que los contenedores de productos y filtros existen antes de renderizarlos
    const cardContainer = document.getElementById("cardContainer");
    const filtersContainer = document.getElementById("filtersContainer");

    if (cardContainer && filtersContainer) {
      renderCards(productosOriginales);       // product.js
      setupFilters(productosOriginales);      // filters.js
    } else {
      console.error("No se encontró el contenedor de productos o filtros.");
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// Ejecutar al cargar el script
document.addEventListener('DOMContentLoaded', function() {
  loadProducts(); // Asegúrate de que se ejecute después de que el DOM esté listo
});
