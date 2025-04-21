const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const CartManager = require("./js/cartManager");

const app = express();
const PORT = process.env.PORT || 3001;

const IMAGE_FOLDER = path.join(__dirname, "images");
const QR_FOLDER = path.join(__dirname, "qrcodes");
fs.mkdirSync(IMAGE_FOLDER, { recursive: true });
fs.mkdirSync(QR_FOLDER, { recursive: true });

cloudinary.config({
  cloud_name: 'dopzonzq4',
  api_key: '828323364486141',
  api_secret: 'tuEV6WU4XR-UoULglLFNsRhOb64'
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGE_FOLDER),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());
app.use("/qrcodes", express.static(QR_FOLDER));
app.use("/images", express.static(IMAGE_FOLDER));
app.use(express.static(path.join(__dirname, "public")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/css", express.static(path.join(__dirname, "css")));


const SPREADSHEET_ID = "1S9F85vLGgpcxcvPVH4nXVM_eB7aYsliBUBUCAwnPOkY";
const auth = new google.auth.GoogleAuth({
  keyFile: "/etc/secrets/nantli-456106-6f611c3d6987.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// ========== Agregar producto ==========
app.post("/add-product", upload.single("image"), async (req, res) => {
  try {
    const body = req.body;
    const imageFile = req.file;
    if (!body.data) return res.status(400).send("El campo 'data' es obligatorio.");
    const data = JSON.parse(body.data);
    if (!Array.isArray(data) || data.length === 0) return res.status(400).send("Debe ser un arreglo de productos.");

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const existingRows = (await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Hoja 1",
    })).data.values || [];

    const qrResults = [];

    for (const product of data) {
      const { id, title, price, description, category, subcategory, color, size, quantity } = product;

      if (![id, title, price, description, category, color].every(Boolean)) {
        return res.status(400).send(`Producto inválido: ${JSON.stringify(product)}`);
      }

      if (existingRows.some(row => row[0] === id)) continue;

      const qrFileName = `${id}_qr.png`;
      const qrFilePath = path.join(QR_FOLDER, qrFileName);
      await QRCode.toFile(qrFilePath, id, { color: { dark: "#000", light: "#FFF" } });

      const cloudinaryResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }).end(fs.readFileSync(qrFilePath));
      });

      const qrUrl = cloudinaryResult.secure_url;
      let imageUrl = product.imageUrl || "";
      if (imageFile) {
        imageUrl = `https://nantli-backend.onrender.com/images/${imageFile.filename}`;
      }

      const row = [
        id,
        title,
        price,
        description,
        category,
        subcategory || "",
        color,
        size || "N/A",
        quantity || 0,
        imageUrl,
        qrUrl
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Hoja 1!A1:K1",
        valueInputOption: "USER_ENTERED",
        resource: { values: [row] },
      });

      qrResults.push({ id, qrUrl });
    }

    res.status(200).json({ message: "Producto(s) registrado(s) con éxito con QR.", qrResults });
  } catch (error) {
    console.error("Error al registrar producto:", error.message);
    res.status(500).send("Error interno al registrar producto.");
  }
});

// ========== Obtener productos ==========
app.get("/fetch-sheet", async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Hoja 1",
    });

    const rows = response.data.values || [];
    const headers = rows[0];
    const products = rows.slice(1).map(row => {
      const product = {};
      headers.forEach((header, i) => product[header] = row[i] || "");
      return product;
    });

    res.json(products);
  } catch (error) {
    console.error("Error al obtener hoja:", error.message);
    res.status(500).send("Error al obtener datos.");
  }
});

// ========== Obtener categorías y subcategorías ==========
app.get("/categorias-subcategorias", async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Hoja 1",
    });

    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const headerMap = headers.reduce((acc, h, i) => {
      acc[h.toLowerCase().trim()] = i;
      return acc;
    }, {});

    const categoryIndex = headerMap["categoria"] ?? headerMap["category"] ?? -1;
    const subcategoryIndex = headerMap["subcategoria"] ?? headerMap["subcategory"] ?? -1;

    if (categoryIndex === -1 || subcategoryIndex === -1) {
      return res.status(400).json({ message: "Encabezados no encontrados en la hoja." });
    }

    const categorias = new Set();
    const subcategoriasPorCategoria = {};

    for (let i = 1; i < rows.length; i++) {
      const categoria = rows[i][categoryIndex]?.trim();
      const subcategoria = rows[i][subcategoryIndex]?.trim();
      if (categoria) {
        categorias.add(categoria);
        if (!subcategoriasPorCategoria[categoria]) {
          subcategoriasPorCategoria[categoria] = new Set();
        }
        if (subcategoria) subcategoriasPorCategoria[categoria].add(subcategoria);
      }
    }

    const categoriasArray = Array.from(categorias);
    const subcategoriasObj = {};
    for (const cat of categoriasArray) {
      subcategoriasObj[cat] = Array.from(subcategoriasPorCategoria[cat] || []);
    }

    res.json({ categorias: categoriasArray, subcategorias: subcategoriasObj });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ message: "Error interno al obtener categorías y subcategorías." });
  }
});

// ========== Agregar producto al carrito ==========
app.post("/add-to-cart", async (req, res) => {
  try {
    const item = req.body; // { productId, size, quantity }
    if (!item || !item.productId || !item.size || !item.quantity) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const manager = new CartManager(sheets, SPREADSHEET_ID);
    await manager.addItemToCart(item);

    res.json({ message: "Producto agregado al carrito." });
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res.status(500).json({ message: "Error al agregar al carrito." });
  }
});

const SHEET_NAME = 'Hoja 1'; // Sustituye 'Productos' con el nombre real de tu hoja

// ========== Checkout ==========
// ========== Checkout ========== 
app.post("/checkout", async (req, res) => {
    try {
      const productos = req.body.productos;
  
      if (!Array.isArray(productos)) {
        return res.status(400).json({ message: "Formato de productos incorrecto" });
      }
  
      // Obtener el cliente de Google Sheets y la instancia de Sheets API
      const client = await auth.getClient();
      const sheets = google.sheets({ version: "v4", auth: client });
  
      // Obtener datos actuales de la hoja
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:Z`, // Asume que la fila 1 son encabezados
      });
  
      const rows = data.values;
      const updates = [];
  
      productos.forEach(producto => {
        const { id, talla, cantidad } = producto;
  
        // Buscar fila que coincida con ID y talla
        const rowIndex = rows.findIndex(row => row[0] === id && row[7] === talla); // A=ID (0), H=Talla (7)
  
        if (rowIndex === -1) {
          console.warn(`Producto no encontrado: ${id} talla ${talla}`);
          return;
        }
  
        const cantidadActual = parseInt(rows[rowIndex][8]); // I=Cantidad (8)
        const nuevaCantidad = cantidadActual - cantidad;
  
        if (nuevaCantidad < 0) {
          console.warn(`Cantidad insuficiente para ${id} talla ${talla}`);
          return;
        }
  
        // Registrar update
        updates.push({
          range: `${SHEET_NAME}!I${rowIndex + 2}`,
          values: [[nuevaCantidad]],
        });
      });
  
      // Aplicar todos los updates con batchUpdate
      const result = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          data: updates,
          valueInputOption: "RAW",
        },
      });
   // Enviar respuesta exitosa
res.status(200).json({ message: "Checkout completado con éxito" });

    } catch (error) {
      console.error("Error en /checkout:", error);
      res.status(500).json({ message: "Error interno al procesar el checkout" });
    }
  });
  


  app.post('/enviar-pedido', async (req, res) => {
    try {
      const cliente = req.body.cliente || 'Anónimo';
      const telefono = req.body.telefono || '';
      const productos = req.body.productos || [];
  
      if (productos.length === 0) {
        return res.status(400).json({ message: 'No hay productos en el pedido.' });
      }
  
      const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
      const pedidosSheet = doc.sheetsByTitle['Pedidos'];
  
      await pedidosSheet.addRow({
        fecha: fecha,
        cliente: cliente,
        telefono: telefono,
        productos: JSON.stringify(productos)
      });
  
      res.status(200).json({ message: 'Pedido enviado exitosamente.' });
  
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      res.status(500).json({ message: 'Error al enviar pedido.' });
    }
  });
  
  
  

// ========== Servir HTML por defecto ==========
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  fs.existsSync(indexPath)
    ? res.sendFile(indexPath)
    : res.status(404).send("Archivo index.html no encontrado.");
});

// ========== Iniciar servidor ==========
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
