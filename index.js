// Cargar las variables de entorno del archivo .env al inicio de la aplicación
require("dotenv").config();

// Importar los módulos necesarios
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const {
  submitAudioForTranscription,
  getTranscriptById,
} = require("./firefliesClient"); // Usará la versión actualizada de arriba

const app = express();

// --- MIDDLEWARES ---
// Aplicamos bodyParser.json() de forma condicional:
app.use((req, res, next) => {
  if (req.path === "/fireflies-webhook") {
    return next();
  }
  bodyParser.json()(req, res, next);
});

// --- DEFINICIÓN DE RUTAS / ENDPOINTS ---
app.get("/", (req, res) => {
  res.send(
    "¡Hola! El servidor de transcripción está funcionando (versión completa y estable)."
  );
});

app.post("/transcribe", async (req, res) => {
  const { videoUrl, title } = req.body;

  if (!videoUrl) {
    return res.status(400).send({ error: 'El campo "videoUrl" es requerido.' });
  }
  // webhookNotificationUrl se construye con SERVER_BASE_URL de .env (AHORA tu URL de ngrok estática)
  const webhookNotificationUrl = `${process.env.SERVER_BASE_URL}/fireflies-webhook`;
  try {
    console.log(
      `Endpoint /transcribe: Solicitud recibida para transcribir video: ${videoUrl}`
    );
    console.log(
      `Endpoint /transcribe: URL de notificación para Fireflies (webhook): ${webhookNotificationUrl}`
    );
    const firefliesResponse = await submitAudioForTranscription(
      videoUrl,
      title ||
        `Transcripción para ${videoUrl.substring(
          videoUrl.lastIndexOf("/") + 1
        )}`,
      webhookNotificationUrl, // Se pasa la URL de ngrok estática
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

app.post(
  "/fireflies-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    console.log(
      "Endpoint /fireflies-webhook: ¡Notificación de webhook de Fireflies recibida!"
    );
    console.log(
      "Endpoint /fireflies-webhook: Headers recibidos:",
      JSON.stringify(req.headers, null, 2)
    );
    console.log(
      "Endpoint /fireflies-webhook: Tipo de req.body:",
      typeof req.body
    );
    console.log(
      "Endpoint /fireflies-webhook: ¿Es req.body un Buffer?:",
      req.body instanceof Buffer
    );
    if (req.body instanceof Buffer) {
      console.log(
        "Endpoint /fireflies-webhook: Contenido de req.body (Buffer como String - primeros 500 chars):",
        req.body.toString().substring(0, 500)
      );
    } else {
      console.log(
        "Endpoint /fireflies-webhook: Contenido de req.body (NO es Buffer):",
        JSON.stringify(req.body, null, 2)
      );
    }

    const firefliesSignature = req.headers["x-hub-signature"];
    const webhookSecret = process.env.WEBHOOK_SECRET;

    try {
      if (firefliesSignature) {
        if (!webhookSecret) {
          console.error(
            "Endpoint /fireflies-webhook: WEBHOOK_SECRET no está configurado."
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
            "Endpoint /fireflies-webhook: Firma de webhook inválida."
          );
          return res.status(403).send("Firma inválida. Acceso denegado.");
        }
        console.log(
          "Endpoint /fireflies-webhook: Firma del webhook verificada correctamente."
        );
      } else {
        console.warn(
          "Endpoint /fireflies-webhook: Webhook recibido SIN firma (x-hub-signature). NO SE REALIZÓ VERIFICACIÓN."
        );
      }

      if (!(req.body instanceof Buffer)) {
        console.error(
          "Endpoint /fireflies-webhook: ¡ERROR CRÍTICO! req.body no es un Buffer ANTES de JSON.parse. Tipo:",
          typeof req.body
        );
        throw new Error(
          "El cuerpo de la solicitud no es un Buffer como se esperaba."
        );
      }
      const payload = JSON.parse(req.body.toString());
      console.log(
        "Endpoint /fireflies-webhook: Payload del webhook procesado:",
        JSON.stringify(payload, null, 2)
      );

      if (
        payload.eventType === "Transcription completed" &&
        payload.meetingId
      ) {
        const transcriptId = payload.meetingId;
        console.log(
          `Endpoint /fireflies-webhook: Evento 'Transcription completed' para ID: ${transcriptId}`
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
              "Endpoint /fireflies-webhook: No se encontró la transcripción o la estructura es inesperada.",
              transcriptData
            );
          }
          console.log("-----------------------------------------");
        } catch (error) {
          console.error(
            `Endpoint /fireflies-webhook: Error al recuperar la transcripción ${transcriptId}:`,
            error.message
          );
        }
      } else {
        console.log(
          "Endpoint /fireflies-webhook: Evento de webhook no manejado o meetingId faltante. Evento:",
          payload.eventType
        );
      }
      res.status(200).send("Webhook recibido y procesado.");
    } catch (error) {
      console.error(
        "Endpoint /fireflies-webhook: Error general procesando el webhook:",
        error.message
      );
      console.error(error.stack);
      res.status(500).send("Error interno al procesar el webhook.");
    }
  }
);

// --- INICIAR EL SERVIDOR ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando activamente en el puerto ${PORT}`);
  console.log(
    `URL base del servidor (esperada para ngrok en desarrollo): ${process.env.SERVER_BASE_URL}`
  );
  // ... (otros logs de inicio)
});
