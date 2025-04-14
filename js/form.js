document.addEventListener("DOMContentLoaded", async function () {
  const categoriasSelect = document.getElementById("category");
  const subcategoriasSelect = document.getElementById("subcategory");
  const newCategoryInput = document.getElementById("newCategory");
  const newSubcategoryInput = document.getElementById("newSubcategory");
  const form = document.getElementById("addProductForm");

  if (!categoriasSelect || !subcategoriasSelect || !form) {
    console.warn("Formulario o campos de categoría/subcategoría no encontrados en el DOM.");
    return;
  }

  // Mostrar formulario
  function showForm() {
    const formContainer = document.getElementById("formContainer");
    if (formContainer) {
      formContainer.classList.remove("hidden");
    } else {
      console.error("No se encontró el formulario (formContainer)");
    }
  }
  window.showForm = showForm;

  // Ocultar formulario
  window.hideForm = function () {
    document.getElementById("formContainer").classList.add("hidden");
  };

  let categoriasDisponibles = [];
  let subcategoriasPorCategoria = {};

  async function cargarCategoriasYSubcategorias() {
    try {
      const res = await fetch("https://nantli-backend.onrender.com/categorias-subcategorias");
      const data = await res.json();
      categoriasDisponibles = data.categorias || [];
      subcategoriasPorCategoria = data.subcategorias || {};

      categoriasSelect.innerHTML = `
        <option value="">Seleccione una categoría</option>
        <option value="nueva">Agregar nueva categoría</option>`;

      categoriasDisponibles.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categoriasSelect.insertBefore(opt, categoriasSelect.lastElementChild);
      });
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  }

  categoriasSelect.addEventListener("change", () => {
    const value = categoriasSelect.value;
    newCategoryInput.style.display = value === "nueva" ? "block" : "none";

    // Limpiar y cargar las subcategorías dinámicamente
    subcategoriasSelect.innerHTML = `
      <option value="">Seleccione una subcategoría</option>
      <option value="nueva">Agregar nueva subcategoría</option>`;
    newSubcategoryInput.style.display = "none";

    if (subcategoriasPorCategoria[value]) {
      subcategoriasPorCategoria[value].forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subcategoriasSelect.insertBefore(opt, subcategoriasSelect.lastElementChild);
      });
    }
  });

  subcategoriasSelect.addEventListener("change", () => {
    newSubcategoryInput.style.display = subcategoriasSelect.value === "nueva" ? "block" : "none";
  });

  await cargarCategoriasYSubcategorias();

  // Agregar múltiples tallas
  window.addSizeInput = function (size = "", quantity = "") {
    const div = document.createElement("div");
    div.className = "size-entry d-flex align-items-center mb-2";
    div.innerHTML = `
      <input type="text" placeholder="Talla" class="form-control size-select mr-2" style="width: 100px;" value="${size}">
      <input type="number" placeholder="Cantidad" class="form-control quantity-input" style="width: 100px;" value="${quantity}" min="0">
      <button type="button" class="btn btn-sm btn-danger ml-2" onclick="this.parentNode.remove()">✕</button>
    `;
    document.getElementById("sizeContainer").appendChild(div);
  };

  // Envío del formulario
 // Envío del formulario
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  const productId = crypto.randomUUID();

  // Recoger las tallas y cantidades
  const sizes = Array.from(document.querySelectorAll(".size-entry")).map(entry => ({
    size: entry.querySelector(".size-select").value,
    quantity: parseInt(entry.querySelector(".quantity-input").value)
  })).filter(s => s.size && !isNaN(s.quantity));

  const category = formData.get("category") === "nueva" ? formData.get("newCategory") : formData.get("category");
  const subcategory = formData.get("subcategory") === "nueva" ? formData.get("newSubcategory") : formData.get("subcategory");

  // Verificar que se tienen productos antes de crear el arreglo
  const productos = sizes.length > 0
    ? sizes.map(s => ({
        id: productId,
        title: formData.get("title"),
        description: formData.get("description"),
        price: parseFloat(formData.get("price")),
        category,
        subcategory,
        color: formData.get("color"),
        size: s.size,
        quantity: s.quantity,
        imageUrl: formData.get("imageUrl"),
    }))
    : [];

  if (productos.length > 0) {
    // Verificación adicional para asegurar que los campos no estén vacíos
    const productosJSON = JSON.stringify(productos);
    
    try {
      const response = await fetch("https://nantli-backend.onrender.com/add-product", {
        method: "POST",
        body: productosJSON,
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const productosExistentes = await fetch("https://nantli-backend.onrender.com/fetch-sheet");
        const productosData = await productosExistentes.json();
        renderCards(productosData); // Usamos el método renderCards

        alert("Producto registrado exitosamente!");
        hideForm(); // Ocultar el formulario
      } else {
        alert("Error al registrar el producto.");
      }
    } catch (error) {
      console.error("Error al registrar el producto:", error);
      alert("Hubo un error al registrar el producto. Intenta nuevamente.");
    }
  } else {
    alert("Por favor, agrega al menos una talla con cantidad.");
  }
});



  
  
});
