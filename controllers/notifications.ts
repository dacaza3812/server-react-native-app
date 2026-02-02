import { Request, Response } from "express";
import admin from "firebase-admin";

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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}

export const sendNotification = async (req: Request, res: Response): Promise<void> => {
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
    const response = await admin.messaging().sendEachForMulticast(message);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
};
