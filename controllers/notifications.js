const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN,
};

// Inicializa Firebase Admin con la cuenta de servicio
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const sendNotification = async (req, res) => {
    const { tokens, title, body } = req.body;
    if (!Array.isArray(tokens) || tokens.length === 0) {
        return res.status(400).json({ success: false, error: "El campo 'tokens' debe ser un array no vacío." });
    }

    // Crea el objeto de notificación, incluyendo la imagen si está definida
    const notificationPayload = {
        title,
        body,
    };

    const message = {
        notification: notificationPayload,
        tokens, // Array de tokens de los dispositivos a notificar
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log('Notificaciones enviadas:', response);
        res.json({ success: true, response });
      } catch (error) {
        console.error('Error al enviar notificaciones:', error);
        res.status(500).json({ success: false, error });
      }
}

module.exports = { sendNotification };
