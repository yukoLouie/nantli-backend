// cart.js
class Cart {
    constructor() {
        this.items = []; // Productos en el carrito
    }

    // Agregar producto al carrito
    addProduct(product, quantity) {
        const existingProduct = this.items.find(item => item.id === product.id && item.size === product.size);
        if (existingProduct) {
            if (existingProduct.quantity + quantity > product.availableQuantity) {
                throw new Error(`No puedes agregar más de ${product.availableQuantity} unidades de ${product.title} en talla ${product.size}`);
            }
            existingProduct.quantity += quantity;
        } else {
            if (quantity > product.availableQuantity) {
                throw new Error(`No puedes agregar más de ${product.availableQuantity} unidades de ${product.title} en talla ${product.size}`);
            }
            this.items.push({ ...product, quantity });
        }
    }

    // Calcular el total del carrito
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Obtener los productos del carrito
    getItems() {
        return this.items;
    }

    // Limpiar el carrito
    clear() {
        this.items = [];
    }

    // Eliminar un producto del carrito
    removeProduct(productId, size) {
        this.items = this.items.filter(item => !(item.id === productId && item.size === size));
    }

    // Actualizar la cantidad de un producto
    updateProductQuantity(productId, size, quantity) {
        const product = this.items.find(item => item.id === productId && item.size === size);
        if (product) {
            if (quantity <= 0) {
                this.removeProduct(productId, size);
            } else {
                product.quantity = quantity;
            }
        }
    }
}

module.exports = Cart;
