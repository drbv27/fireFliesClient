// Carga las variables de entorno definidas en el archivo .env
// para su uso en toda la aplicación. Es una práctica estándar para
// gestionar configuraciones y secretos fuera del código fuente.
require("dotenv").config();

// Importación de módulos esenciales.
const express = require("express"); // Framework principal para la construcción de la API web.
const bodyParser = require("body-parser"); // Middleware para el parseo del cuerpo de las solicitudes HTTP.
const crypto = require("crypto"); // Módulo nativo de Node.js para operaciones criptográficas, usado para la verificación de firmas de webhooks.

// Importación de funciones específicas del cliente de la API de Fireflies.
// Este módulo encapsula la lógica de comunicación con el servicio externo.
const {
  submitAudioForTranscription,
  getTranscriptById,
} = require("./firefliesClient");

// Instanciación de la aplicación Express.
const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARES ---

// Middleware condicional para el parseo de cuerpos JSON.
// Este middleware se aplica a todas las rutas, excepto a '/fireflies-webhook'.
// Para la ruta del webhook, se requiere el cuerpo en formato raw (Buffer)
// para la verificación de la firma, por lo que se omite el parseo JSON allí.
app.use((req, res, next) => {
  if (req.path === "/fireflies-webhook") {
    // Si la ruta es '/fireflies-webhook', se invoca next() para ceder el control
    // al siguiente middleware o manejador de ruta sin parsear el cuerpo como JSON.
    return next();
  }
  // Para todas las demás rutas, se utiliza bodyParser.json() para parsear
  // automáticamente los cuerpos de solicitud con Content-Type 'application/json'.
  bodyParser.json()(req, res, next);
});

// --- DEFINICIÓN DE RUTAS Y ENDPOINTS DE LA API ---

/**
 * Endpoint raíz (GET /).
 * Proporciona una respuesta simple para verificar la operatividad del servidor.
 * Comúnmente utilizado como health check.
 */
app.get("/", (req, res) => {
  res.send("¡Hola! El servidor de transcripción está funcionando.");
});

/**
 * Endpoint POST /transcribe.
 * Recibe la URL de un video para iniciar su proceso de transcripción.
 * Espera un cuerpo JSON con 'videoUrl' y opcionalmente 'title'.
 */
app.post("/transcribe", async (req, res) => {
  // Extracción de 'videoUrl' y 'title' del cuerpo de la solicitud.
  // Se asume que el middleware bodyParser.json() (condicional) ya ha parseado req.body.
  const { videoUrl, title } = req.body;

  // Validación de la entrada: 'videoUrl' es un campo obligatorio.
  if (!videoUrl) {
    console.warn("Endpoint /transcribe: Intento de solicitud sin 'videoUrl'.");
    return res.status(400).send({ error: 'El campo "videoUrl" es requerido.' });
  }

  // Construcción de la URL de notificación del webhook.
  // Esta URL, compuesta por la base del servidor (obtenida de variables de entorno,
  // usualmente una URL pública de ngrok durante el desarrollo) y la ruta específica del webhook,
  // se enviará a Fireflies.ai para notificaciones asíncronas.
  const webhookNotificationUrl = `${process.env.SERVER_BASE_URL}/fireflies-webhook`;

  try {
    console.log(
      `Endpoint /transcribe: Solicitud recibida para transcribir video: ${videoUrl}`
    );
    console.log(
      `Endpoint /transcribe: URL de notificación para Fireflies (webhook) configurada como: ${webhookNotificationUrl}`
    );

    // Invocación asíncrona al servicio cliente para enviar el audio/video a Fireflies.ai.
    const firefliesResponse = await submitAudioForTranscription(
      videoUrl,
      // Provee un título por defecto si no se especifica uno, extrayéndolo del nombre del archivo en la URL.
      title ||
        `Transcripción para ${videoUrl.substring(
          videoUrl.lastIndexOf("/") + 1
        )}`,
      webhookNotificationUrl,
      "es" // Especificación del idioma del audio. Considerar parametrizar si es necesario.
    );

    console.log(
      "Endpoint /transcribe: Respuesta de Fireflies.ai al encolar el audio:",
      JSON.stringify(firefliesResponse, null, 2)
    );

    // Respuesta al cliente (HTTP 202 Accepted).
    // Indica que la solicitud ha sido aceptada para procesamiento, pero este aún no ha finalizado.
    // Se devuelve la respuesta de Fireflies.ai para referencia del cliente.
    res.status(202).send({
      message:
        "Video enviado a Fireflies.ai para transcripción. La notificación llegará al webhook configurado.",
      details: firefliesResponse,
    });
  } catch (error) {
    console.error(
      "Endpoint /transcribe: Excepción al intentar enviar video a Fireflies.ai:",
      error.message
    );
    // Si el error incluye una respuesta específica de la API de Fireflies, se registra y devuelve.
    if (error.response && error.response.data) {
      console.error(
        "Endpoint /transcribe: Detalles del error específico de Fireflies:",
        JSON.stringify(error.response.data, null, 2)
      );
      return res.status(500).send({
        error: "Error en la comunicación con el servicio Fireflies.ai.",
        details: error.response.data,
      });
    }
    // Respuesta para errores genéricos del servidor durante el procesamiento de /transcribe.
    res.status(500).send({
      error: "Error interno del servidor al procesar la solicitud /transcribe.",
    });
  }
});

/**
 * Endpoint POST /fireflies-webhook.
 * Configurado para recibir notificaciones asíncronas (webhooks) desde Fireflies.ai,
 * primariamente el evento de finalización de transcripción.
 * Utiliza bodyParser.raw() para obtener el cuerpo de la solicitud como Buffer,
 * lo cual es indispensable para la verificación de la firma HMAC.
 */
app.post(
  "/fireflies-webhook",
  bodyParser.raw({ type: "application/json" }), // Middleware específico para esta ruta.
  async (req, res) => {
    console.log(
      "Endpoint /fireflies-webhook: Notificación de webhook de Fireflies.ai recibida."
    );

    // Logs de depuración para inspeccionar las cabeceras y el cuerpo de la solicitud entrante.
    // Estos son útiles para verificar el Content-Type, la presencia de la firma, y el estado del req.body.
    console.log(
      "Endpoint /fireflies-webhook: Cabeceras HTTP recibidas:",
      JSON.stringify(req.headers, null, 2)
    );
    console.log(
      "Endpoint /fireflies-webhook: Tipo de dato de req.body:",
      typeof req.body
    );
    console.log(
      "Endpoint /fireflies-webhook: ¿Es req.body una instancia de Buffer?:",
      req.body instanceof Buffer
    );
    if (req.body instanceof Buffer) {
      console.log(
        "Endpoint /fireflies-webhook: Contenido de req.body (Buffer como String, primeros 500 caracteres):",
        req.body.toString().substring(0, 500)
      );
    } else {
      console.log(
        "Endpoint /fireflies-webhook: Contenido de req.body (inesperado, no es Buffer):",
        JSON.stringify(req.body, null, 2)
      );
    }

    // Extracción de la firma del webhook de las cabeceras HTTP.
    // Fireflies.ai envía la firma en la cabecera 'x-hub-signature'.
    const firefliesSignature = req.headers["x-hub-signature"];
    // El secreto del webhook, configurado en variables de entorno y en el panel de Fireflies.ai.
    const webhookSecret = process.env.WEBHOOK_SECRET;

    try {
      // Verificación de la firma del webhook. Es una medida de seguridad crítica.
      if (firefliesSignature) {
        if (!webhookSecret) {
          console.error(
            "Endpoint /fireflies-webhook: WEBHOOK_SECRET no está definido en la configuración del servidor. Imposible verificar firma."
          );
          // Se lanza una excepción para ser capturada por el bloque catch general.
          throw new Error(
            "WEBHOOK_SECRET no configurado, la verificación de firma no puede proceder."
          );
        }

        // Creación de un HMAC (Hash-based Message Authentication Code) usando SHA256 y el secreto.
        const hmac = crypto.createHmac("sha256", webhookSecret);
        // Actualización del HMAC con el cuerpo raw de la solicitud (req.body debe ser un Buffer).
        hmac.update(req.body);
        // Cálculo de la firma esperada.
        const calculatedSignature = `sha256=${hmac.digest("hex")}`;

        // Comparación segura de la firma calculada con la firma recibida para prevenir ataques de temporización.
        const isValidSignature = crypto.timingSafeEqual(
          Buffer.from(calculatedSignature),
          Buffer.from(firefliesSignature)
        );

        if (!isValidSignature) {
          console.warn(
            "Endpoint /fireflies-webhook: Verificación de firma fallida. La firma recibida no coincide con la calculada."
          );
          return res.status(403).send("Firma inválida. Acceso denegado.");
        }
        console.log(
          "Endpoint /fireflies-webhook: Verificación de firma del webhook exitosa."
        );
      } else {
        // Si no se recibe la cabecera 'x-hub-signature'.
        // Esto podría indicar una configuración incorrecta o una solicitud no auténtica.
        // En producción, se debería considerar rechazar estas solicitudes si se espera firma.
        console.warn(
          "Endpoint /fireflies-webhook: Webhook recibido SIN firma (x-hub-signature). La verificación de firma fue omitida. Revisar configuración en Fireflies.ai."
        );
        // return res.status(400).send('Firma (x-hub-signature) esperada pero no proporcionada.');
      }

      // Parseo del payload del webhook.
      // Se asume que req.body es un Buffer (verificado por bodyParser.raw() para esta ruta).
      if (!(req.body instanceof Buffer)) {
        // Esta condición no debería cumplirse si la configuración de middleware es correcta.
        console.error(
          "Endpoint /fireflies-webhook: ¡ERROR CRÍTICO INTERNO! req.body no es un Buffer antes de JSON.parse. Tipo actual:",
          typeof req.body
        );
        throw new Error(
          "El cuerpo de la solicitud del webhook no es un Buffer como se esperaba. Problema en la configuración de bodyParser."
        );
      }
      const payload = JSON.parse(req.body.toString()); // Conversión del Buffer a String, y luego a objeto JSON.
      console.log(
        "Endpoint /fireflies-webhook: Payload del webhook parseado exitosamente:",
        JSON.stringify(payload, null, 2)
      );

      // Procesamiento del evento de transcripción completada.
      if (
        payload.eventType === "Transcription completed" && // Verifica el tipo de evento.
        payload.meetingId // Verifica la presencia del ID de la transcripción/reunión.
      ) {
        const transcriptId = payload.meetingId;
        console.log(
          `Endpoint /fireflies-webhook: Evento 'Transcription completed' detectado para ID: ${transcriptId}`
        );

        try {
          // Solicitud asíncrona para obtener los detalles de la transcripción usando el ID.
          const transcriptData = await getTranscriptById(transcriptId);
          console.log(
            "--- TRANSCRIPCIÓN RECUPERADA EXITOSAMENTE VÍA WEBHOOK ---"
          );
          if (transcriptData && transcriptData.transcript) {
            console.log(
              `Título de la transcripción: ${transcriptData.transcript.title}`
            );
            if (
              transcriptData.transcript.sentences &&
              transcriptData.transcript.sentences.length > 0
            ) {
              // Muestra un extracto de las frases transcritas para logging.
              transcriptData.transcript.sentences
                .slice(0, 5) // Limita a las primeras 5 frases.
                .forEach((sentence) => {
                  console.log(
                    `  ${sentence.speaker_name || "Hablante"}: ${sentence.text}`
                  );
                });
            } else {
              console.log(
                "La transcripción recuperada no contiene frases (array 'sentences' vacío o ausente)."
              );
            }
          } else {
            console.warn(
              "Endpoint /fireflies-webhook: No se encontró el objeto 'transcript' en los datos recuperados o la estructura es inesperada.",
              transcriptData
            );
          }
          console.log("-----------------------------------------------------");
        } catch (error) {
          console.error(
            `Endpoint /fireflies-webhook: Excepción al intentar recuperar la transcripción ${transcriptId} desde el cliente API:`,
            error.message
          );
          // No se re-lanza el error para asegurar que se envíe una respuesta 200 a Fireflies si la firma fue válida.
          // El error de recuperación de transcripción se maneja internamente (logging).
        }
      } else {
        console.log(
          "Endpoint /fireflies-webhook: Evento de webhook no reconocido o 'meetingId' ausente. Evento recibido:",
          payload.eventType
        );
      }
      // Respuesta a Fireflies.ai para confirmar la recepción exitosa del webhook.
      // Es crucial responder con un 200 OK para evitar reintentos por parte de Fireflies.
      res.status(200).send("Webhook recibido y procesado.");
    } catch (error) {
      // Captura de errores generales durante el procesamiento del webhook (ej. fallo en verificación de firma, parseo de JSON).
      console.error(
        "Endpoint /fireflies-webhook: Excepción general durante el procesamiento del webhook:",
        error.message
      );
      console.error(error.stack); // Stack trace para depuración detallada.
      // Respuesta de error al emisor del webhook.
      res
        .status(500)
        .send("Error interno del servidor al procesar el webhook.");
    }
  }
);

// --- INICIALIZACIÓN DEL SERVIDOR HTTP ---
// Configuración del puerto del servidor, obtenido de variables de entorno o usando un valor por defecto.
const PORT = process.env.PORT || 3001;

// Inicio del servidor Express para que escuche las solicitudes entrantes en el puerto configurado.
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando activamente en el puerto ${PORT}`);
  console.log(
    `URL base del servidor (esperada para ngrok en desarrollo): ${process.env.SERVER_BASE_URL}`
  );
  console.log(
    `Endpoint para iniciar transcripciones: POST ${
      process.env.SERVER_BASE_URL || `http://localhost:${PORT}`
    }/transcribe`
  );
  console.log(
    `Endpoint para recibir notificaciones webhook: POST ${
      process.env.SERVER_BASE_URL || `http://localhost:${PORT}`
    }/fireflies-webhook`
  );
  // Advertencias sobre la configuración de SERVER_BASE_URL para el correcto funcionamiento de webhooks en desarrollo.
  if (
    process.env.SERVER_BASE_URL &&
    process.env.SERVER_BASE_URL.includes("localhost") &&
    process.env.NODE_ENV !== "development_local_only" // Permite 'localhost' si se establece explícitamente un entorno solo local.
  ) {
    console.warn(
      "ADVERTENCIA: SERVER_BASE_URL actualmente apunta a 'localhost'. Los webhooks de servicios externos como Fireflies.ai no podrán alcanzar este servidor a menos que se utilice una herramienta de túnel como ngrok y SERVER_BASE_URL se actualice a la URL pública https proporcionada por dicha herramienta."
    );
  } else if (!process.env.SERVER_BASE_URL) {
    console.warn(
      "ADVERTENCIA: La variable de entorno SERVER_BASE_URL no está definida. Los webhooks no funcionarán como se espera, ya que Fireflies.ai no sabrá a qué URL pública notificar."
    );
  }
});
