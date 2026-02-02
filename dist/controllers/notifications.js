"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccount = {
    type: "service_account",
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN,
};
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
    });
}
const sendNotification = async (req, res) => {
    const { tokens, title, body } = req.body;
    if (!Array.isArray(tokens) || tokens.length === 0) {
        res.status(400).json({ success: false, error: "Tokens array required" });
        return;
    }
    const message = {
        notification: { title, body },
        tokens,
    };
    try {
        const response = await firebase_admin_1.default.messaging().sendEachForMulticast(message);
        res.json({ success: true, response });
    }
    catch (error) {
        res.status(500).json({ success: false, error });
    }
};
exports.sendNotification = sendNotification;
//# sourceMappingURL=notifications.js.map