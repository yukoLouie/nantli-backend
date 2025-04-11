const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(bodyParser.json());
app.use(cors());
app.use("/qrcodes", express.static("qrcodes"));

// ✅ Servir archivos estáticos (como index.html y otros recursos)
app.use(express.static(path.join(__dirname, "public")));

// Google Auth
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "nantli-456106-91324fb63687.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1S9F85vLGgpcxcvPVH4nXVM_eB7aYsliBUBUCAwnPOkY";

// ===================== AGREGAR PRODUCTOS =====================
app.post("/add-product", async (req, res) => {
    try {
        const data = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).send("La solicitud debe ser un arreglo de productos.");
        }

        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        const checkResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Hoja 1",
        });

        const rows = checkResponse.data.values || [];

        for (const product of data) {
            const {
                id, title, price, description, category,
                subcategory, color, size, quantity,
                imageUrl, qrCode
            } = product;

            // ✅ Validación estricta de parámetros faltantes
            if (![id, title, price, description, category, color, imageUrl, qrCode].every(Boolean)) {
                console.error("Producto con información incompleta:", product);
                return res.status(400).send(`Producto inválido: ${JSON.stringify(product)}`);
            }

            // ✅ Evitar duplicados
            if (rows.some(row => row[0] === id)) {
                console.log(`Producto con ID ${id} ya existe. Omitiendo registro.`);
                continue;
            }

            // Guardar QR code como archivo
            const qrBuffer = Buffer.from(qrCode, "base64");
            const qrFileName = `${id}_qr.png`;
            const qrFilePath = path.join(__dirname, "qrcodes", qrFileName);
            fs.writeFileSync(qrFilePath, qrBuffer);

            const qrUrl = `https://nantli-backend.onrender.com/qrcodes/${qrFileName}`;

            const values = [
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
                resource: { values: [values] },
            });
        }

        res.status(200).send("Producto(s) registrado(s) con éxito con código QR.");
    } catch (error) {
        console.error("Error al registrar el producto:", error.message);
        res.status(500).send("Ocurrió un error al registrar el producto.");
    }
});

// ✅ Mejor manejo de archivos estáticos e index.html
app.get("*", (req, res) => {
    const filePath = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send("index.html no encontrado en la carpeta pública.");
    }
});

// ===================== INICIAR SERVIDOR =====================
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
