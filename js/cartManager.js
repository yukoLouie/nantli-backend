// cartManager.js
const { google } = require("googleapis");
const Product = require("./product");

class CartManager {
    constructor() {
      this.cart = new Map(); // clave: id+talla, valor: { product, quantity }
    }
  
    _getKey(product) {
      return `${product.id}_${product.size}`;
    }
  
    addToCart(product, quantity) {
      const key = this._getKey(product);
      const existing = this.cart.get(key);
  
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > product.quantity) {
          throw new Error('No hay suficiente stock');
        }
        this.cart.set(key, { ...existing, quantity: newQuantity });
      } else {
        if (quantity > product.quantity) {
          throw new Error('No hay suficiente stock');
        }
        this.cart.set(key, { product, quantity });
      }
    }
  
    updateQuantity(product, quantity) {
      const key = this._getKey(product);
      if (!this.cart.has(key)) return false;
  
      if (quantity > product.quantity) {
        throw new Error('No hay suficiente stock');
      }
  
      this.cart.set(key, { product, quantity });
      return true;
    }
  
    removeFromCart(product) {
      const key = this._getKey(product);
      this.cart.delete(key);
    }
  
    getCartItems() {
      return Array.from(this.cart.values());
    }
  
    clearCart() {
      this.cart.clear();
    }
  }
  
  module.exports = CartManager;
  