// Cargar las variables de entorno del archivo .env al inicio de la aplicación
require("dotenv").config();

// Importar los módulos necesarios
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const {
  submitAudioForTranscription,
  getTranscriptById,
} = require("./firefliesClient"); // Usará la versión con cabeceras replicadas

const app = express();

// --- MIDDLEWARES ---
// Aplicamos bodyParser.json() de forma condicional:
// Se aplicará a TODAS las rutas EXCEPTO a la ruta específica del webhook.
app.use((req, res, next) => {
  // La ruta completa del webhook es ahora /marketplace/files/fireflies
  if (req.path === "/marketplace/files/fireflies") {
    return next();
  }
  bodyParser.json()(req, res, next);
});

// --- DEFINICIÓN DE RUTAS / ENDPOINTS ---
app.get("/", (req, res) => {
  res.send(
    "¡Hola! El servidor de transcripción está funcionando (Producción)."
  );
});

app.post("/transcribe", async (req, res) => {
  const { videoUrl, title } = req.body;

  if (!videoUrl) {
    return res.status(400).send({ error: 'El campo "videoUrl" es requerido.' });
  }

  // Construcción de la URL completa del webhook que se enviará a Fireflies.ai.
  // SERVER_BASE_URL será 'https://api.nevtis.com' desde .env.
  // La ruta del webhook es ahora '/marketplace/files/fireflies'.
  const webhookNotificationUrl = `${process.env.SERVER_BASE_URL}/marketplace/files/fireflies`;
  try {
    console.log(
      `Endpoint /transcribe: Solicitud recibida para transcribir video: ${videoUrl}`
    );
    console.log(
      `Endpoint /transcribe: URL de notificación para Fireflies (webhook) A ENVIAR: ${webhookNotificationUrl}`
    );
    const firefliesResponse = await submitAudioForTranscription(
      videoUrl,
      title ||
        `Transcripción para ${videoUrl.substring(
          videoUrl.lastIndexOf("/") + 1
        )}`,
      webhookNotificationUrl, // Se pasa la URL completa del webhook de producción.
      "es"
    );
    console.log(
      "Endpoint /transcribe: Respuesta de Fireflies.ai al encolar el audio:",
      JSON.stringify(firefliesResponse, null, 2)
    );
    res.status(202).send({
      message:
        "Video enviado a Fireflies.ai para transcripción. La notificación llegará al webhook configurado.",
      details: firefliesResponse,
    });
  } catch (error) {
    console.error(
      "Endpoint /transcribe: Error al enviar video a Fireflies.ai:",
      error.message
    );
    if (error.response && error.response.data) {
      console.error(
        "Endpoint /transcribe: Detalles del error de Fireflies:",
        JSON.stringify(error.response.data, null, 2)
      );
      return res.status(500).send({
        error: "Error al comunicarse con Fireflies.ai.",
        details: error.response.data,
      });
    }
    res.status(500).send({
      error: "Error interno del servidor al procesar la solicitud /transcribe.",
    });
  }
});

// Endpoint para recibir las notificaciones (webhooks) de Fireflies.ai.
// La ruta ahora es '/marketplace/files/fireflies'.
app.post(
  "/marketplace/files/fireflies", // <-- RUTA ACTUALIZADA
  bodyParser.raw({ type: "application/json" }), // Middleware para cuerpo raw en ESTA ruta.
  async (req, res) => {
    console.log(
      "Endpoint /marketplace/files/fireflies: ¡Notificación de webhook de Fireflies recibida!"
    );
    console.log(
      "Endpoint /marketplace/files/fireflies: Headers recibidos:",
      JSON.stringify(req.headers, null, 2)
    );
    console.log(
      "Endpoint /marketplace/files/fireflies: Tipo de req.body:",
      typeof req.body
    );
    console.log(
      "Endpoint /marketplace/files/fireflies: ¿Es req.body un Buffer?:",
      req.body instanceof Buffer
    );
    if (req.body instanceof Buffer) {
      console.log(
        "Endpoint /marketplace/files/fireflies: Contenido de req.body (Buffer como String - primeros 500 chars):",
        req.body.toString().substring(0, 500)
      );
    } else {
      console.log(
        "Endpoint /marketplace/files/fireflies: Contenido de req.body (NO es Buffer):",
        JSON.stringify(req.body, null, 2)
      );
    }

    const firefliesSignature = req.headers["x-hub-signature"];
    const webhookSecret = process.env.WEBHOOK_SECRET;

    try {
      if (firefliesSignature) {
        if (!webhookSecret) {
          console.error(
            "Endpoint /marketplace/files/fireflies: WEBHOOK_SECRET no está configurado."
          );
          throw new Error(
            "WEBHOOK_SECRET no configurado, no se puede verificar la firma."
          );
        }
        const hmac = crypto.createHmac("sha256", webhookSecret);
        hmac.update(req.body);
        const calculatedSignature = `sha256=${hmac.digest("hex")}`;
        const isValidSignature = crypto.timingSafeEqual(
          Buffer.from(calculatedSignature),
          Buffer.from(firefliesSignature)
        );

        if (!isValidSignature) {
          console.warn(
            "Endpoint /marketplace/files/fireflies: Firma de webhook inválida."
          );
          return res.status(403).send("Firma inválida. Acceso denegado.");
        }
        console.log(
          "Endpoint /marketplace/files/fireflies: Firma del webhook verificada correctamente."
        );
      } else {
        console.warn(
          "Endpoint /marketplace/files/fireflies: Webhook recibido SIN firma (x-hub-signature). NO SE REALIZÓ VERIFICACIÓN."
        );
        // En producción, se debería rechazar si se espera firma:
        // return res.status(400).send('Firma (x-hub-signature) esperada pero no proporcionada.');
      }

      if (!(req.body instanceof Buffer)) {
        console.error(
          "Endpoint /marketplace/files/fireflies: ¡ERROR CRÍTICO! req.body no es un Buffer ANTES de JSON.parse. Tipo:",
          typeof req.body
        );
        throw new Error(
          "El cuerpo de la solicitud no es un Buffer como se esperaba."
        );
      }
      const payload = JSON.parse(req.body.toString());
      console.log(
        "Endpoint /marketplace/files/fireflies: Payload del webhook procesado:",
        JSON.stringify(payload, null, 2)
      );

      if (
        payload.eventType === "Transcription completed" &&
        payload.meetingId
      ) {
        const transcriptId = payload.meetingId;
        console.log(
          `Endpoint /marketplace/files/fireflies: Evento 'Transcription completed' para ID: ${transcriptId}`
        );

        try {
          const transcriptData = await getTranscriptById(transcriptId);
          console.log("--- TRANSCRIPCIÓN RECUPERADA POR WEBHOOK ---");
          if (transcriptData && transcriptData.transcript) {
            console.log(`Título: ${transcriptData.transcript.title}`);
            if (
              transcriptData.transcript.sentences &&
              transcriptData.transcript.sentences.length > 0
            ) {
              transcriptData.transcript.sentences
                .slice(0, 5)
                .forEach((sentence) => {
                  console.log(
                    `  ${sentence.speaker_name || "Hablante"}: ${sentence.text}`
                  );
                });
            } else {
              console.log("La transcripción no contiene frases (sentences).");
            }
          } else {
            console.log(
              "Endpoint /marketplace/files/fireflies: No se encontró la transcripción o la estructura es inesperada.",
              transcriptData
            );
          }
          console.log("-----------------------------------------");
        } catch (error) {
          console.error(
            `Endpoint /marketplace/files/fireflies: Error al recuperar la transcripción ${transcriptId}:`,
            error.message
          );
        }
      } else {
        console.log(
          "Endpoint /marketplace/files/fireflies: Evento de webhook no manejado o meetingId faltante. Evento:",
          payload.eventType
        );
      }
      res.status(200).send("Webhook recibido y procesado.");
    } catch (error) {
      console.error(
        "Endpoint /marketplace/files/fireflies: Error general procesando el webhook:",
        error.message
      );
      console.error(error.stack);
      res.status(500).send("Error interno al procesar el webhook.");
    }
  }
);

// --- INICIAR EL SERVIDOR ---
const PORT = process.env.PORT || 3001; // El puerto interno donde escucha Node.js
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando activamente en el puerto ${PORT}`);
  console.log(
    `URL base del servidor configurada en .env: ${process.env.SERVER_BASE_URL}`
  );
  console.log(
    `El endpoint para iniciar transcripciones es: POST ${
      process.env.SERVER_BASE_URL || `http://localhost:${PORT}` // En producción, SERVER_BASE_URL será el dominio público
    }/transcribe`
  );
  console.log(
    `El endpoint para recibir webhooks de Fireflies es: POST ${
      process.env.SERVER_BASE_URL || `http://localhost:${PORT}`
    }/marketplace/files/fireflies` // Refleja la URL completa
  );

  if (!process.env.SERVER_BASE_URL) {
    console.warn(
      "ADVERTENCIA: SERVER_BASE_URL no está definida en el archivo .env. La URL del webhook enviada a Fireflies podría ser incorrecta."
    );
  } else if (process.env.SERVER_BASE_URL.includes("localhost")) {
    console.warn(
      "ADVERTENCIA: SERVER_BASE_URL apunta a 'localhost'. Para producción, esta debe ser la URL pública del servidor (ej. https://api.nevtis.com) y para desarrollo local con webhooks, se necesita ngrok o similar."
    );
  }
});
