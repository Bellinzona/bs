const express = require("express");
const cors = require("cors");
const mercadopago = require("mercadopago");
const path = require("path");
const db = require("./firebaseConfig");

const app = express();

mercadopago.configure({
  access_token: "APP_USR-4072506350930351-122920-1476b0073389bef23ff181ab511922e7-1070363034",
});

app.use(express.json());
app.use(cors());

// Variable global en el objeto app
app.set('globalInfo', {});

// Endpoints de la API
app.post("/create_preference", (req, res) => {
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

  console.log(requestBodyInfo);

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
      "success": `https://bubbamilanesas.com/`,
      "failure": "https://bubbamilanesas.com/",
      "pending": ""
    },
    auto_return: "approved",
    notification_url: "https://bs-i4ni.onrender.com/webHook"
  };

  mercadopago.preferences.create(preference)
    .then(function (response) {
      res.json({
        id: response.body.id,
        RequestBodyInfo: app.get('globalInfo')
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/webHook", (req, res) => {
  const payment = req.body;
  const RequestBodyInfo = app.get('globalInfo');

  res.sendStatus(200);

  if (payment.action === 'payment.created') {
    console.log(`Payment created: ${JSON.stringify(payment)}`);

    db.collection("Pagos").add(RequestBodyInfo)
      .then(docRef => {
        console.log("Document written with ID: ", docRef.id);
        console.log("esto se tiene que guardar: ", RequestBodyInfo);
      })
      .catch(error => {
        console.error("Error adding document: ", error);
      });
  } else if (payment.action === 'payment.updated') {
    console.log(`Payment updated: ${JSON.stringify(payment)}`);

    db.collection("Pagos").add(RequestBodyInfo)
      .then(docRef => {
        console.log("esto se tiene que guardar: ", RequestBodyInfo);
        console.log("Document written with ID: ", docRef.id);
      })
      .catch(error => {
        console.error("Error adding document: ", error);
      });
  }
});

app.get('/CompraFinalizada', (req, res) => {
  const requestBodyInfo = req.query;
  const appInfo = app.get('globalInfo');
  const responseInfo = {
    RequestBodyInfo: appInfo,
    QueryParams: requestBodyInfo
  };

  console.log(responseInfo);
  res.json(responseInfo);
});

// Servir archivos estáticos de React desde la carpeta client/build
app.use(express.static(path.join(__dirname, '../client/dist')));

// Servir index.html para todas las rutas no manejadas explícitamente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// Iniciar el servidor
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`The server is now running on Port ${port}`);
});
