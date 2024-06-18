const admin = require('firebase-admin');
const serviceAccount = require('./config.json'); // Reemplaza con la ruta correcta

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://bubbamilanesas-61c38.firebaseio.com' // Asegúrate de que esta URL sea correcta
});

const db = admin.firestore();

module.exports = db;
