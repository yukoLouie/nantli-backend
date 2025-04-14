const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;

// Carpeta para guardar imágenes y códigos QR
const IMAGE_FOLDER = path.join(__dirname, "images");
const QR_FOLDER = path.join(__dirname, "qrcodes");
fs.mkdirSync(IMAGE_FOLDER, { recursive: true });
fs.mkdirSync(QR_FOLDER, { recursive: true });

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

// Autenticación con Google
const auth = new google.auth.GoogleAuth({
    keyFile: "/etc/secrets/nantli-456106-6f611c3d6987.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// ========== Agregar producto ==========
app.post("/add-product", upload.single("image"), async (req, res) => {
    try {
        // Obtener datos del cuerpo de la solicitud
        const body = req.body;
        const imageFile = req.file;

        // Verificar que los datos estén presentes en el campo 'data'
        if (!body.data) {
            return res.status(400).send("El campo 'data' es obligatorio.");
        }

        // Parsear el campo 'data' que contiene los productos
        const data = JSON.parse(body.data); // Enviar campo "data" como string JSON si usas FormData

        // Verificar que el cuerpo contenga un arreglo de productos
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).send("La solicitud debe ser un arreglo de productos.");
        }

        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        // Obtener los datos de la hoja de cálculo
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Hoja 1",
        });

        const existingRows = sheetData.data.values || [];

        // Iterar sobre los productos a registrar
        for (const product of data) {
            const {
                id, title, price, description, category,
                subcategory, color, size, quantity,
            } = product;

            // Verificar que los campos requeridos estén presentes
            if (![id, title, price, description, category, color].every(Boolean)) {
                return res.status(400).send(`Producto inválido: ${JSON.stringify(product)}`);
            }

            // Verificar si el producto ya existe en la hoja
            if (existingRows.some(row => row[0] === id)) {
                console.log(`Producto con ID ${id} ya existe. Omitido.`);
                continue;
            }

            // Generar código QR para el producto
            const qrFileName = `${id}_qr.png`;
            const qrFilePath = path.join(QR_FOLDER, qrFileName);
            await QRCode.toFile(qrFilePath, id, {
                color: { dark: "#000", light: "#FFF" },
            });
            const qrUrl = `https://nantli-backend.onrender.com/qrcodes/${qrFileName}`;

            // Obtener la URL de la imagen (si se subió una imagen con FormData)
            let imageUrl = product.imageUrl || "";
            if (imageFile) {
                imageUrl = `https://nantli-backend.onrender.com/images/${imageFile.filename}`;
            }

            // Crear una fila para agregar al documento de Google Sheets
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

            // Agregar la fila a la hoja de cálculo
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: "Hoja 1!A1:K1",
                valueInputOption: "USER_ENTERED",
                resource: { values: [row] },
            });
        }

        // Responder con éxito
        res.status(200).send("Producto(s) registrado(s) con éxito con QR.");
    } catch (error) {
        console.error("Error al registrar producto:", error.message);
        res.status(500).send("Error interno al registrar producto.");
    }
});


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
  
      // Mapeo de encabezados a índice (en minúsculas para mayor robustez)
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
