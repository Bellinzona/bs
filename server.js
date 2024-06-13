const express = require("express");
const app = express();
const cors = require("cors");
const mercadopago = require("mercadopago");
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // o admin.credential.cert(serviceAccount)
  databaseURL: "https://bubbamilanesas-61c38.firebaseio.com"
});

const db = admin.database();

mercadopago.configure({
  access_token: "APP_USR-4072506350930351-122920-1476b0073389bef23ff181ab511922e7-1070363034",
});

app.use(express.json());
app.use(cors());

app.post("/create_preference", async (req, res) => {
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

  // Generar un identificador único
  const uuid = uuidv4();

  // Guardar requestBodyInfo en Firebase bajo el identificador único
  await db.ref(`payment_requests/${uuid}`).set(requestBodyInfo);

  let preference = {
    items: [
      {
        title: req.body.description,
        unit_price: requestBodyInfo.price,
        quantity: Number(req.body.quantity),
      }
    ],
    back_urls: {
      "success": `https://main--mellifluous-crumble-6f8160.netlify.app`,
      "failure": "https://bubbamilanesas.netlify.app/",
      "pending": ""
    },
    auto_return: "approved",
    notification_url: "https://bs-i4ni.onrender.com/webHook",
    external_reference: uuid  // Agregar el identificador único como referencia externa
  };

  mercadopago.preferences.create(preference)
    .then(function (response) {
      res.json({
        id: response.body.id,
        RequestBodyInfo: requestBodyInfo  // Obtener la información del objeto app
      });
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/webHook", async (req, res) => {
  const payment = req.body;

  if (payment.action === 'payment.created' || payment.action === 'payment.updated') {
    try {
      // Obtener el identificador único desde la notificación
      const externalReference = payment.data.external_reference;

      // Recuperar requestBodyInfo desde Firebase usando el identificador único
      const snapshot = await db.ref(`payment_requests/${externalReference}`).once('value');
      const requestBodyInfo = snapshot.val();

      if (requestBodyInfo) {
        // Guardar la información del pago en Firebase
        await db.ref("Pagos").push({
          ...requestBodyInfo,
          paymentInfo: payment
        });
        console.log(`Payment ${payment.action}: ${JSON.stringify(payment)}`);
      } else {
        console.error('No requestBodyInfo found for external reference:', externalReference);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
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

app.listen(8080, () => {
  console.log("The server is now running on Port 8080");
});
