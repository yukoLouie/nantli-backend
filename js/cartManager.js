// cartManager.js
const { google } = require("googleapis");
const Product = require("./product");

class CartManager {
    constructor(auth, spreadsheetId) {
        this.auth = auth;
        this.spreadsheetId = spreadsheetId;
        this.sheets = google.sheets({ version: "v4", auth: this.auth });
    }

    // Obtener los productos desde la hoja de cálculo
    async getProductsFromSheet() {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: "Hoja 1",
        });

        const rows = response.data.values || [];
        const headers = rows[0] || [];

        return rows.slice(1).map(row => {
            const product = {};
            headers.forEach((header, i) => product[header] = row[i] || "");
            return new Product(
                product.id,
                product.title,
                parseFloat(product.price),
                product.description,
                product.category,
                product.subcategory,
                product.color,
                product.size,
                parseInt(product.quantity),
                product.imageUrl,
                product.qrUrl
            );
        });
    }

    // Actualizar la cantidad de productos en la hoja de cálculo después del checkout
    async updateProductQuantities(cartItems) {
        for (const item of cartItems) {
            const product = await this.getProductById(item.id);
            const newQuantity = product.availableQuantity - item.quantity;

            if (newQuantity < 0) {
                throw new Error(`No hay suficiente stock de ${item.title} en talla ${item.size}.`);
            }

            // Actualizamos la cantidad en la hoja de cálculo
            await this.updateProductQuantityInSheet(item.id, newQuantity);
        }
    }

    // Obtener un producto específico desde la hoja de cálculo
    async getProductById(id) {
        const products = await this.getProductsFromSheet();
        return products.find(product => product.id === id);
    }

    // Actualizar la cantidad de un producto en la hoja de cálculo
    async updateProductQuantityInSheet(id, newQuantity) {
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: "Hoja 1",
        });

        const rows = response.data.values;
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            throw new Error(`Producto con ID ${id} no encontrado.`);
        }

        rows[rowIndex][8] = newQuantity; // Suponiendo que la cantidad está en la columna 9 (índice 8)

        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `Hoja 1!A${rowIndex + 2}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [rows[rowIndex]],
            },
        });
    }
}

module.exports = CartManager;
