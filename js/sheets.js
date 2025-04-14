async function updateProductQuantity(id, size, quantityToSubtract) {
    const doc = await loadSpreadsheet();
    const sheet = doc.sheetsByTitle['Productos'];
    const rows = await sheet.getRows();
  
    const productRow = rows.find(row => row.id === id && row.size === size);
    if (!productRow) throw new Error(`Producto ${id} talla ${size} no encontrado`);
  
    const currentQty = parseInt(productRow.quantity);
    const newQty = currentQty - quantityToSubtract;
  
    if (newQty < 0) throw new Error(`Stock insuficiente para ${id} - ${size}`);
  
    productRow.quantity = newQty;
    await productRow.save();
  }
  
  module.exports = {
    loadSpreadsheet,
    getAllProducts,
    updateProductQuantity,
    // otros métodos
  };
  