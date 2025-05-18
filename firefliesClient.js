// Importación del módulo 'axios' para realizar solicitudes HTTP.
const axios = require("axios");
// Carga de variables de entorno desde el archivo .env.
require("dotenv").config();

// Log para verificar la carga de la API Key.
console.log(
  "firefliesClient.js (Con Cabeceras Replicadas y Webhook Dinámico): FIREFLIES_API_KEY cargada:",
  `'${process.env.FIREFLIES_API_KEY}'`
);

const FIREFLIES_API_URL = "https://api.fireflies.ai/graphql";
const API_KEY = process.env.FIREFLIES_API_KEY;

async function makeGraphQLRequest(query, variables) {
  if (!API_KEY) {
    console.error(
      "Error crítico en makeGraphQLRequest: FIREFLIES_API_KEY no está definida."
    );
    throw new Error(
      "FIREFLIES_API_KEY no configurada. La autenticación fallará."
    );
  }

  // Cabeceras replicadas de la solicitud Postman exitosa.
  const replicatedPostmanHeaders = {
    "User-Agent": "PostmanRuntime/7.43.4", // Ajusta si tu Postman usa otra versión.
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
  };

  const requestConfig = {
    method: "post",
    url: FIREFLIES_API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...replicatedPostmanHeaders,
    },
    data: { query: query, variables: variables },
  };

  console.log("-----------------------------------------------------");
  console.log(
    "Cliente API (Con Cabeceras Replicadas): Solicitud Axios ENVIADA a Fireflies.ai:"
  );
  console.log("URL:", requestConfig.url);
  console.log("Método:", requestConfig.method);
  console.log(
    "Cabeceras Enviadas:",
    JSON.stringify(requestConfig.headers, null, 2)
  );
  console.log(
    "Cuerpo Enviado (data):",
    JSON.stringify(requestConfig.data, null, 2)
  );
  console.log("-----------------------------------------------------");

  try {
    const response = await axios(requestConfig);
    if (response.data.errors) {
      console.error(
        "Errores GraphQL:",
        JSON.stringify(response.data.errors, null, 2)
      );
      throw new Error(`Error GraphQL: ${JSON.stringify(response.data.errors)}`);
    }
    return response.data.data;
  } catch (error) {
    if (error.response) {
      console.error(
        "Error API Fireflies:",
        error.response.status,
        JSON.stringify(error.response.data, null, 2)
      );
    } else if (error.request) {
      console.error(
        "Error de red (sin respuesta de Fireflies):",
        error.request
      );
    } else {
      console.error("Error configurando solicitud:", error.message);
    }
    throw error;
  }
}

async function submitAudioForTranscription(
  audioUrl,
  title,
  webhookUrl, // Parámetro esperado
  customLanguage = "es"
) {
  // --- NUEVO LOG DE DEPURACIÓN ---
  console.log(
    "submitAudioForTranscription: Parámetro webhookUrl recibido:",
    webhookUrl
  );
  if (typeof webhookUrl === "undefined") {
    console.error(
      "¡ALERTA! submitAudioForTranscription fue llamada SIN el parámetro webhookUrl."
    );
    // Podríamos lanzar un error aquí para detener la ejecución si es crítico.
    // throw new Error("webhookUrl no fue proporcionado a submitAudioForTranscription");
  }
  // -----------------------------

  const mutation =
    "mutation($input: AudioUploadInput) { uploadAudio(input: $input) { success title message } }";
  const variables = {
    input: {
      url: audioUrl,
      title: title,
      webhook: webhookUrl, // Usa el parámetro webhookUrl
      custom_language: customLanguage,
    },
  };
  console.log(
    "Cliente API (Con Cabeceras Replicadas): Variables para submitAudioForTranscription:",
    JSON.stringify(variables, null, 2)
  );
  return makeGraphQLRequest(mutation, variables);
}

async function getTranscriptById(transcriptId) {
  const query = `query Transcript($transcriptId: String!) { transcript(id: $transcriptId) { id title sentences { text start_time end_time speaker_name speaker_id } speakers { id name } } }`;
  const variables = { transcriptId: transcriptId };
  console.log(`Cliente API: Solicitando transcripción ID: ${transcriptId}`);
  return makeGraphQLRequest(query, variables);
}

module.exports = {
  submitAudioForTranscription,
  getTranscriptById,
};
