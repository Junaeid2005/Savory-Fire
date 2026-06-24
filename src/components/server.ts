import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ইমেইল পাঠানোর জন্য ট্রান্সপোর্টার (SMTP না থাকলে টেস্ট অ্যাকাউন্ট তৈরি হবে)
async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    console.log("No SMTP credentials found. Generating a temporary Ethereal account...");
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // আসল ইমেইল পাঠানোর API Endpoint
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transporter = await getTransporter();
      const fromAddress = process.env.SMTP_FROM || '"Savory Green" <notifications@savorygreen.com>';

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>')
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        return res.json({
          success: true,
          messageId: info.messageId,
          previewUrl,
          message: "Email sent successfully (Test Mode)."
        });
      }

      return res.json({
        success: true,
        messageId: info.messageId,
        message: "Email sent successfully."
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => console.error(err));
