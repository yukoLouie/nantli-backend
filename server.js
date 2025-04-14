const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;

const Cart = require("./js/cart");
const CartManager = require("./js/cartManager");
const Product = require("./js/product");

const app = express();
const PORT = process.env.PORT || 3001;

// Autenticación con Google
const auth = new google.auth.GoogleAuth({
    keyFile: "/etc/secrets/nantli-456106-6f611c3d6987.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Crear instancia de CartManager
const cartManager = new CartManager(auth, SPREADSHEET_ID);

// Rutas del carrito
const cart = new Cart();

app.use(bodyParser.json());

// Agregar producto al carrito
app.post("/add-to-cart", async (req, res) => {
    try {
        const { productId, size, quantity } = req.body;

        const product = await cartManager.getProductById(productId);

        if (!product) {
            return res.status(404).send("Producto no encontrado.");
        }

        cart.addProduct(product, quantity);

        res.status(200).json({
            message: "Producto agregado al carrito.",
            cart: cart.getItems(),
            total: cart.getTotal(),
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Checkout del carrito
app.post("/checkout", async (req, res) => {
    try {
        await cartManager.updateProductQuantities(cart.getItems());
        cart.clear(); // Limpiar el carrito después del checkout
        res.status(200).json({ message: "Checkout exitoso. Cantidades actualizadas en la hoja." });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Carpeta para guardar imágenes y códigos QR
const IMAGE_FOLDER = path.join(__dirname, "images");
const QR_FOLDER = path.join(__dirname, "qrcodes");
fs.mkdirSync(IMAGE_FOLDER, { recursive: true });
fs.mkdirSync(QR_FOLDER, { recursive: true });

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: 'dopzonzq4',
  api_key: '828323364486141',
  api_secret: 'tuEV6WU4XR-UoULglLFNsRhOb64'
});

// Middleware para subir imágenes con Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMAGE_FOLDER),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

// Middlewares generales
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors());
app.use("/qrcodes", express.static(QR_FOLDER));
app.use("/images", express.static(IMAGE_FOLDER));
app.use(express.static(path.join(__dirname, "public")));

// ID de la hoja de cálculo de Google
const SPREADSHEET_ID = "1S9F85vLGgpcxcvPVH4nXVM_eB7aYsliBUBUCAwnPOkY";

// ========== Agregar producto ==========

app.post("/add-product", upload.single("image"), async (req, res) => {
    try {
        const body = req.body;
        const imageFile = req.file;

        if (!body.data) {
            return res.status(400).send("El campo 'data' es obligatorio.");
        }

        const data = JSON.parse(body.data); // 'data' debe ser un string JSON (arreglo de productos)

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).send("La solicitud debe ser un arreglo de productos.");
        }

        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Hoja 1",
        });

        const existingRows = sheetData.data.values || [];
        const qrResults = [];

        for (const product of data) {
            const {
                id, title, price, description, category,
                subcategory, color, size, quantity
            } = product;

            if (![id, title, price, description, category, color].every(Boolean)) {
                return res.status(400).send(`Producto inválido: ${JSON.stringify(product)}`);
            }

            if (existingRows.some(row => row[0] === id)) {
                console.log(`Producto con ID ${id} ya existe. Omitido.`);
                continue;
            }

            // Generar el archivo QR
            const qrFileName = `${id}_qr.png`;
            const qrFilePath = path.join(QR_FOLDER, qrFileName);
            await QRCode.toFile(qrFilePath, id, {
                color: { dark: "#000", light: "#FFF" },
            });

            // Subir el QR a Cloudinary
            const qrBuffer = fs.readFileSync(qrFilePath); // Leer el QR como buffer
            const cloudinaryResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: 'auto' },
                    (error, result) => {
                        if (error) reject(error);
                        resolve(result);
                    }
                ).end(qrBuffer);
            });

            const qrUrl = cloudinaryResult.secure_url;

            // Subir imagen del producto (si existe)
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

        res.status(200).json({
            message: "Producto(s) registrado(s) con éxito con QR.",
            qrResults
        });

    } catch (error) {
        console.error("Error al registrar producto:", error.message);
        res.status(500).send("Error interno al registrar producto.");
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

        const categoryIndex =
            headerMap["categoria"] ?? headerMap["category"] ?? -1;
        const subcategoryIndex =
            headerMap["subcategoria"] ?? headerMap["subcategory"] ?? -1;

        if (categoryIndex === -1 || subcategoryIndex === -1) {
            console.error(
                "No se encontraron las columnas 'categoria/category' o 'subcategoria/subcategory'."
            );
            return res
                .status(400)
                .json({ message: "Encabezados no encontrados en la hoja." });
        }

        const categorias = new Set();
        const subcategoriasPorCategoria = {};

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const categoria = row[categoryIndex]?.trim();
            const subcategoria = row[subcategoryIndex]?.trim();

            if (categoria) {
                categorias.add(categoria);
                if (!subcategoriasPorCategoria[categoria]) {
                    subcategoriasPorCategoria[categoria] = new Set();
                }
                if (subcategoria) {
                    subcategoriasPorCategoria[categoria].add(subcategoria);
                }
            }
        }

        const categoriasArray = Array.from(categorias);
        const subcategoriasObj = {};
        for (const cat of categoriasArray) {
            subcategoriasObj[cat] = Array.from(
                subcategoriasPorCategoria[cat] || []
            );
        }

        res.json({
            categorias: categoriasArray,
            subcategorias: subcategoriasObj,
        });
    } catch (error) {
        console.error("Error al obtener categorías y subcategorías:", error);
        res
            .status(500)
            .json({ message: "Error interno al obtener categorías y subcategorías." });
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

// ========== Servir index.html por defecto ==========

app.get("*", (req, res) => {
    const indexPath = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Archivo index.html no encontrado.");
    }
});

// ========== Iniciar servidor ==========

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
