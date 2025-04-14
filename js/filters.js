  

function renderButtons(values, containerId, selectedValue, availableValues) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  values.forEach(value => {
    const button = document.createElement("button");
    button.className = "btn btn-outline-primary btn-sm me-2 mb-2";
    button.textContent = value;

    const isAvailable = availableValues.has(value);
    const isSelected = value === selectedValue;

    if (isSelected) {
      button.classList.remove("btn-outline-primary");
      button.classList.add("btn-primary", "active");
    }

    if (!isAvailable) {
      button.classList.add("disabled-btn");
      button.disabled = true;
    }

    button.addEventListener("click", () => {
      const isSame = value === selectedValue;
    
      switch (containerId) {
        case 'categoryButtons':
          selectedCategory = isSame ? null : value;
          break;
        case 'subcategoryButtons':
          selectedSubcategory = isSame ? null : value;
          break;
        case 'sizeButtons':
          selectedSize = isSame ? null : value;
          break;
        case 'colorButtons':
          selectedColor = isSame ? null : value;
          break;
      }
    
      renderAllFilterButtons(productosOriginales);  // vuelve a renderizar todos los botones con el nuevo estado
      filterAndRender();                            // luego aplica los filtros y renderiza las tarjetas
    });
    
    

    container.appendChild(button);
  });
}

function clearFilters() {
  selectedCategory = null;
  selectedSubcategory = null;
  selectedSize = null;
  selectedColor = null;
  document.getElementById("searchInput").value = '';
  filterAndRender();
}

function filterAndRender() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const filtered = productosOriginales.filter(p => {
    const matchesSearch = Object.values(p).some(val =>
      val && val.toString().toLowerCase().includes(searchTerm)
    );
    const matchesCategory = !selectedCategory || p.categoria === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || p.subcategoria === selectedSubcategory;
    const matchesSize = !selectedSize || p.talla === selectedSize;
    const matchesColor = !selectedColor || p.color === selectedColor;
    return matchesSearch && matchesCategory && matchesSubcategory && matchesSize && matchesColor;
  });

  renderAllFilterButtons(productosOriginales); // <- esta línea es clave
  updateAvailableFilters(filtered);
  renderCards(filtered);
}


function updateAvailableFilters(filtered) {
  const allButtons = [
    { id: "categoryButtons", key: "categoria", selected: selectedCategory },
    { id: "subcategoryButtons", key: "subcategoria", selected: selectedSubcategory },
    { id: "sizeButtons", key: "talla", selected: selectedSize },
    { id: "colorButtons", key: "color", selected: selectedColor }
  ];

  for (const { id, key, selected } of allButtons) {
    const values = [...new Set(productosOriginales.map(p => p[key]).filter(Boolean))];
    updateButtonAvailability(id, key, values, filtered, selected);
  }
}

function updateButtonAvailability(containerId, key, values, baseFiltered, selectedValue) {
  const container = document.getElementById(containerId);

  for (let btn of container.children) {
    const value = btn.textContent;

    const tempFilters = {
      categoria: selectedCategory,
      subcategoria: selectedSubcategory,
      talla: selectedSize,
      color: selectedColor
    };

    tempFilters[key] = (value === selectedValue) ? null : value;

    const possibleMatch = productosOriginales.some(p => {
      return (
        (!tempFilters.categoria || p.categoria === tempFilters.categoria) &&
        (!tempFilters.subcategoria || p.subcategoria === tempFilters.subcategoria) &&
        (!tempFilters.talla || p.talla === tempFilters.talla) &&
        (!tempFilters.color || p.color === tempFilters.color) &&
        Object.values(p).some(val =>
          val && val.toString().toLowerCase().includes(document.getElementById("searchInput").value.toLowerCase())
        )
      );
    });

    if (value === selectedValue) {
      btn.classList.remove("btn-outline-primary");
      btn.classList.add("btn-primary", "active");
    } else {
      btn.classList.add("btn-outline-primary");
      btn.classList.remove("btn-primary", "active");
    }

    if (!possibleMatch) {
      btn.classList.add("disabled-btn");
      btn.disabled = true;
    } else {
      btn.classList.remove("disabled-btn");
      btn.disabled = false;
    }
  }
}

function setupFilters(productos) {
  productosOriginales = productos;
  renderAllFilterButtons(productos);
  document.getElementById("searchInput").addEventListener("input", filterAndRender);
}
 

function renderAllFilterButtons(productos) {
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  const subcategorias = [...new Set(productos.map(p => p.subcategoria).filter(Boolean))];
  const tallas = [...new Set(productos.map(p => p.talla).filter(Boolean))];
  const colores = [...new Set(productos.map(p => p.color).filter(Boolean))];

  const availableCategories = new Set(productos.map(p => p.categoria));
  const availableSubcategories = new Set(productos.map(p => p.subcategoria));
  const availableSizes = new Set(productos.map(p => p.talla));
  const availableColors = new Set(productos.map(p => p.color));

  renderButtons(categorias, "categoryButtons", selectedCategory, availableCategories);
  renderButtons(subcategorias, "subcategoryButtons", selectedSubcategory, availableSubcategories);
  renderButtons(tallas, "sizeButtons", selectedSize, availableSizes);
  renderButtons(colores, "colorButtons", selectedColor, availableColors);
}
