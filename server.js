const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const cors = require("cors");
const fs = require("fs");
const https = require("https");

const app = express();
const PORT = 3001;

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

            const qrUrl = `https://localhost:3001/qrcodes/${qrFileName}`;

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


// ===================== ACTUALIZAR INVENTARIO =====================
app.post("/update-inventory", async (req, res) => {
    try {
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).send("La solicitud debe contener productos válidos.");
        }

        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Hoja 1",
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return res.status(400).send("No hay productos registrados.");
        }

        for (const { id, quantity } of products) {
            const rowIndex = rows.findIndex(row => row[0] === id);
            if (rowIndex === -1) continue;

            const currentQuantity = parseInt(rows[rowIndex][8]) || 0;
            const newQuantity = currentQuantity - quantity;

            if (newQuantity < 0) {
                return res.status(400).send(`No hay suficiente inventario para el producto ${id}`);
            }

            const range = `Hoja 1!I${rowIndex + 1}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range,
                valueInputOption: "USER_ENTERED",
                resource: {
                    values: [[newQuantity]],
                },
            });
        }

        res.status(200).send("Inventario actualizado correctamente.");
    } catch (error) {
        console.error("Error al actualizar el inventario:", error.message);
        res.status(500).send("Ocurrió un error al actualizar el inventario.");
    }
});

// ===================== BUSCAR POR QR =====================
app.get("/get-product-by-qr/:qrCode", async (req, res) => {
    const qrCode = decodeURIComponent(req.params.qrCode);

    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Hoja 1",
        });

        const rows = response.data.values;
        const headers = rows[0];
        const data = rows.slice(1);

        const productRow = data.find(row => row[10] === qrCode); // QR está en columna K (índice 10)
        if (!productRow) {
            return res.status(404).send("Producto no encontrado.");
        }

        const product = Object.fromEntries(headers.map((key, i) => [key, productRow[i] || ""]));
        res.json(product);
    } catch (error) {
        console.error("Error al buscar producto por QR:", error.message);
        res.status(500).send("Error al buscar producto.");
    }
});

// ===================== BUSCAR POR ID =====================
// ===================== BUSCAR POR ID =====================
app.get("/get-product-by-id/:id", async (req, res) => {
    const productId = req.params.id;
    console.log("ID recibido:", productId);  // Log para verificar el ID recibido

    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Hoja 1",
        });

        const rows = response.data.values;
        console.log("Filas recibidas:", rows);  // Log para verificar los datos recibidos

        const headers = rows[0];  // Obtener los encabezados
        const data = rows.slice(1);  // Excluir encabezados

        // Log para verificar las filas sin encabezado
        console.log("Datos sin encabezados:", data);

        // Buscar el producto con el UUID (ID) en la primera columna de las filas de datos
        const productRow = data.find(row => row[0] === productId);  // Buscar en la columna 0 (ID)
        
        // Log para verificar si se encontró el producto
        console.log("Producto encontrado:", productRow);

        if (!productRow) {
            return res.status(404).send("Producto no encontrado.");
        }

        // Crear un objeto con los valores del producto usando los encabezados
        const product = Object.fromEntries(headers.map((key, i) => [key, productRow[i] || ""]));
        res.json(product);
    } catch (error) {
        console.error("Error al buscar producto:", error.message);
        res.status(500).send("Error al buscar producto.");
    }
});






// ===================== OBTENER TODOS =====================
app.get("/fetch-sheet", async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "Hoja 1",
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            return res.status(404).send("No se encontraron datos en la hoja.");
        }

        const productos = rows.slice(1).map(row => ({
            id: row[0] || "Sin ID",
            title: row[1] || "Sin título",
            price: row[2] || "0.00",
            description: row[3] || "Sin descripción",
            category: row[4] || "Sin categoría",
            subcategory: row[5] || "Sin subcategoría",
            color: row[6] || "Sin color",
            size: row[7] || "N/A",
            quantity: row[8] || "0",
            imageUrl: row[9] || "https://via.placeholder.com/150",
            qrCode: row[10] || ""
        }));

        res.json(productos);
    } catch (error) {
        console.error("Error al obtener los datos de la hoja de cálculo:", error.message);
        res.status(500).send("Ocurrió un error al obtener los datos.");
    }
});

app.get("/", (req, res) => {
    res.send("Servidor funcionando. Usa /add-product para agregar productos.");
});

const httpsOptions = {
    key: fs.readFileSync("certificates/localhost.key"),
    cert: fs.readFileSync("certificates/localhost.crt"),
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Servidor HTTPS corriendo en https://localhost:${PORT}`);
});
