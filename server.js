const express = require("express");
const app = express();
const cors = require("cors");
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: "APP_USR-4072506350930351-122920-1476b0073389bef23ff181ab511922e7-1070363034",
});

app.use(express.json());
app.use(cors());

// Variable global en el objeto app
app.set('globalInfo', {});

app.post("/create_preference", (req, res) => {
  // Crear un objeto con la información del req.body.description
  const requestBodyInfo = {
    description: req.body.description,
    price: Number(req.body.price),
    quantity: Number(req.body.quantity),
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    telefono: req.body.telefono,
    horario: req.body.horario,
    local: req.body.local
  };

  console.log(requestBodyInfo)

  // Guardar la información en el objeto app
  app.set('globalInfo', requestBodyInfo);

  let preference = {
    items: [
      {
        title: req.body.description,
        unit_price: requestBodyInfo.price,
        quantity: Number(req.body.quantity),
      }
    ],
    back_urls: {
      "success": `http://localhost:5173/CompraFinalizada?title=${req.body.description}&unit_price=${req.body.price}&quantity=${req.body.quantity}`,
      "failure": "https://deluxe-jalebi-133777.netlify.app/",
      "pending": ""
    },
    auto_return: "approved",
  };

  mercadopago.preferences.create(preference)
    .then(function (response) {
      res.json({
        id: response.body.id,
        RequestBodyInfo: app.get('globalInfo') // Obtener la información del objeto app
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get('https://deluxe-jalebi-133777.netlify.app/CompraFinalizada', (req, res) => {
  // Puedes acceder a todos los parámetros de la URL a través de req.query
  const requestBodyInfo = req.query;

  // Obtén la información del objeto app
  const appInfo = app.get('globalInfo');

  // Agrega requestBodyInfo al objeto appInfo
  const responseInfo = {
    RequestBodyInfo: appInfo,
    QueryParams: requestBodyInfo
  };

  // Aquí deberías tener la lógica para obtener la información del pago, por ejemplo, consultando una base de datos
  // Puedes ajustar esta parte según tus necesidades

  console.log(responseInfo)
  res.json(responseInfo);
});

app.listen(8080, () => {
  console.log("The server is now running on Port 8080");
});
