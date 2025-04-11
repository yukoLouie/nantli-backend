const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/fetch-sheet", async (req, res) => {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTq7EKNQ7_yeoxdh3hr9aKfM8QeAcg59umwRQ1AJqWtKQ9EjlrXnGd7OhG20zC68sL70TG9BiYzXJYV/pubhtml";
    try {
        const response = await fetch(sheetUrl);
        const html = await response.text();
        res.send(html);
    } catch (error) {
        res.status(500).send("Error al obtener los datos.");
    }
});

app.listen(3000, () => console.log("Proxy en ejecución en http://localhost:3000"));
