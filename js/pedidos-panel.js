document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openPedidosBtn');
    const panelEl = document.getElementById('pedidosPanel');
    const container = document.getElementById('pedidosContainer');
    const detalleModal = new bootstrap.Modal(document.getElementById('detallePedidoModal'));
    const detalleBody = document.getElementById('detallePedidoBody');
  
    const bsOffcanvas = new bootstrap.Offcanvas(panelEl);
  
    openBtn.addEventListener('click', async () => {
      bsOffcanvas.show();
      container.innerHTML = '<p>Cargando pedidos...</p>';
  
      try {
        const res = await fetch('https://nantli-backend.onrender.com/fetch-pedidos');
        const pedidos = await res.json();
  
        if (pedidos.length === 0) {
          container.innerHTML = '<p>No hay pedidos.</p>';
          return;
        }
  
        container.innerHTML = pedidos.map((p, i) => `
          <div class="card mb-3" data-index="${i}">
            <div class="card-body">
              <p><strong>Fecha:</strong> ${p.fecha}</p>
              <p><strong>Cliente:</strong> ${p.cliente}</p>
              <p><strong>Teléfono:</strong> ${p.telefono}</p>
              <p><strong>Dirección:</strong> ${p.direccion}</p>
              <div class="d-flex gap-2 mt-3">
                <button class="btn btn-info btn-sm ver-detalle-btn">Ver Detalle</button>
                <button class="btn btn-success btn-sm aceptar-btn">Aceptar</button>
                <button class="btn btn-danger btn-sm eliminar-btn">Eliminar</button>
              </div>
            </div>
          </div>
        `).join('');
  
        // Asignar eventos
        document.querySelectorAll('.aceptar-btn').forEach((btn, i) => {
          btn.addEventListener('click', () => aceptarPedido(pedidos[i]));
        });
  
        document.querySelectorAll('.eliminar-btn').forEach((btn, i) => {
          btn.addEventListener('click', () => eliminarPedido(pedidos[i]));
        });
  
        document.querySelectorAll('.ver-detalle-btn').forEach((btn, i) => {
          btn.addEventListener('click', () => mostrarDetalle(pedidos[i]));
        });
  
      } catch (err) {
        container.innerHTML = '<p class="text-danger">Error al cargar los pedidos.</p>';
        console.error(err);
      }
    });
  
    function aceptarPedido(pedido) {
      console.log("Pedido aceptado:", pedido);
      // Aquí puedes enviar al backend con fetch('/aceptar-pedido', ...)
    }
  
    function eliminarPedido(pedido) {
      console.log("Pedido eliminado:", pedido);
      // Aquí puedes enviar al backend con fetch('/eliminar-pedido', ...)
    }
  
    async function mostrarDetalle(pedido) {
        detalleBody.innerHTML = "<p>Cargando detalles...</p>";
        detalleModal.show();
      
        try {
          const res = await fetch('https://nantli-backend.onrender.com/fetch-sheet');
          const productos = await res.json();
      
          const ids = JSON.parse(pedido.productos);
          const articulos = productos.filter(prod => ids.includes(prod.id));
      
          if (articulos.length === 0) {
            detalleBody.innerHTML = "<p>No se encontraron productos para este pedido.</p>";
            return;
          }
      
          // Precio total
          const total = articulos.reduce((sum, prod) => {
            const precio = parseFloat(prod.precio) || 0;
            return sum + precio;
          }, 0);
      
          // Cantidad total de artículos
          const cantidadTotal = articulos.length;
      
          detalleBody.innerHTML = `
            <h6><strong>Cliente:</strong> ${pedido.cliente}</h6>
            <h6><strong>Teléfono:</strong> ${pedido.telefono}</h6>
            <h6><strong>Dirección:</strong> ${pedido.direccion}</h6>
            <h6><strong>Mensaje:</strong> ${pedido.mensaje}</h6>
            <h5 class="mt-3"><strong>Total del pedido:</strong> $${total.toFixed(2)}</h5>
            <h6><strong>Cantidad total de artículos:</strong> ${cantidadTotal}</h6>
            <hr>
            <div class="row">
              ${articulos.map(prod => `
                <div class="col-md-6 mb-4">
                  <div class="card h-100">
                    <img src="${prod.imagen || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${prod.titulo}">
                    <div class="card-body">
                      <h5 class="card-title">${prod.titulo}</h5>
                      <p class="card-text">${prod.descripcion || ''}</p>
                      <p><strong>Precio:</strong> $${prod.precio || '0'}</p>
                      <p><strong>Color:</strong> ${prod.color || '-'}</p>
                      <p><strong>Talla:</strong> ${prod.talla || '-'}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        } catch (err) {
          detalleBody.innerHTML = '<p class="text-danger">Error al cargar los productos.</p>';
          console.error(err);
        }
      }
      
      
  });
  