const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const cors = require("cors");
const fs = require("fs");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3001; // Usa el puerto proporcionado por Render si está disponible

app.use(bodyParser.json());
app.use(cors());
app.use("/qrcodes", express.static("qrcodes"));

const auth = new google.auth.GoogleAuth({
    keyFile: "nantli-456106-91324fb63687.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1S9F85vLGgpcxcvPVH4nXVM_eB7aYsliBUBUCAwnPOkY";

// ===================== AGREGAR PRODUCTOS =====================
// ===================== AGREGAR PRODUCTOS ===================== 
app.post("/add-product", async (req, res) => {
    try {
        const data = req.body; // data es ahora un arreglo de productos

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

            if (!id || !title || !price || !description || !category || !color || !imageUrl || !qrCode) {
                return res.status(400).send(`Producto inválido: ${JSON.stringify(product)}`);
            }

            if (rows.find(row => row[0] === id)) {
                console.log(`Producto con ID ${id} ya existe. Omitiendo registro.`);
                continue;
            }

            const qrBuffer = Buffer.from(qrCode, "base64");
            const qrFileName = `${id}_qr.png`;
            const qrFilePath = `./qrcodes/${qrFileName}`;
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

// Otros endpoints aquí...

// Asegúrate de que el servidor escuche en el puerto proporcionado por Render
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor HTTPS corriendo en https://localhost:${PORT}`);
});
