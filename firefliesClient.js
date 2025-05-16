// Importación del módulo 'axios' para realizar solicitudes HTTP.
// Es un cliente HTTP popular basado en Promesas para el navegador y Node.js.
const axios = require("axios");

// Carga de variables de entorno desde el archivo .env.
// Esto permite acceder a configuraciones como la clave API de forma segura.
require("dotenv").config();

// URL base del endpoint GraphQL de la API de Fireflies.ai.
const FIREFLIES_API_URL = "https://api.fireflies.ai/graphql";
// Clave API de Fireflies.ai, obtenida de las variables de entorno.
// Esta clave es necesaria para la autenticación de todas las solicitudes a la API.
const API_KEY = process.env.FIREFLIES_API_KEY;

/**
 * Realiza una solicitud GraphQL genérica al endpoint de Fireflies.ai.
 * Esta función encapsula la lógica común para todas las interacciones GraphQL,
 * incluyendo la configuración de cabeceras de autenticación y el manejo básico de errores.
 *
 * @param {string} query La cadena de la consulta o mutación GraphQL a ejecutar.
 * @param {object} variables Un objeto que contiene las variables requeridas por la consulta/mutación.
 * @returns {Promise<object>} Una promesa que resuelve con los datos (`data`) de la respuesta GraphQL.
 * @throws {Error} Lanza un error si la solicitud HTTP falla, si la API de Fireflies devuelve
 * un error HTTP, o si la respuesta GraphQL contiene errores en su campo 'errors'.
 */
async function makeGraphQLRequest(query, variables) {
  // Verificación de la disponibilidad de la clave API antes de intentar la solicitud.
  if (!API_KEY) {
    console.error(
      "Error crítico: FIREFLIES_API_KEY no está definida en las variables de entorno. No se puede autenticar con la API."
    );
    throw new Error(
      "FIREFLIES_API_KEY no configurada. La autenticación fallará."
    );
  }

  try {
    // Ejecución de la solicitud HTTP POST usando axios.
    const response = await axios.post(
      FIREFLIES_API_URL, // URL del endpoint GraphQL.
      {
        // Cuerpo de la solicitud GraphQL estándar.
        query: query,
        variables: variables,
      },
      {
        // Configuración de las cabeceras HTTP.
        headers: {
          "Content-Type": "application/json", // Indica que el cuerpo de la solicitud es JSON.
          Authorization: `Bearer ${API_KEY}`, // Cabecera de autorización con el Bearer token.
        },
      }
    );

    // Las APIs GraphQL suelen devolver un código de estado HTTP 200 incluso si hay errores
    // a nivel de la consulta. Estos errores se detallan en el array 'errors' del cuerpo de la respuesta.
    if (response.data.errors) {
      console.error(
        "Errores devueltos en la respuesta GraphQL de Fireflies.ai:",
        JSON.stringify(response.data.errors, null, 2)
      );
      // Se lanza un error para indicar que la operación GraphQL no fue completamente exitosa.
      throw new Error(
        `Error en la operación GraphQL: ${JSON.stringify(response.data.errors)}`
      );
    }

    // Si no hay errores, se devuelven los datos principales de la respuesta GraphQL.
    // Usualmente, el resultado de la query/mutation está en response.data.data.
    return response.data.data;
  } catch (error) {
    // Manejo de errores a nivel de la solicitud HTTP (ej. problemas de red, errores HTTP no-2xx).
    if (error.response) {
      // El servidor de Fireflies.ai respondió con un código de estado de error.
      console.error(
        "Error en la solicitud a Fireflies.ai (respuesta del servidor con error):",
        `Status: ${error.response.status}`,
        `Data: ${JSON.stringify(error.response.data, null, 2)}`
      );
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta (ej. timeout, problema de red).
      console.error(
        "Error en la solicitud a Fireflies.ai (no se recibió respuesta):",
        error.request
      );
    } else {
      // Error ocurrido durante la configuración de la solicitud que impidió su envío.
      console.error(
        "Error al configurar la solicitud HTTP para Fireflies.ai:",
        error.message
      );
    }
    // Se re-lanza el error para que la función llamadora pueda manejarlo o registrarlo.
    throw error;
  }
}

/**
 * Envía una URL de un archivo de audio/video a Fireflies.ai para su transcripción.
 * Utiliza la mutación GraphQL 'uploadAudio'.
 *
 * @param {string} audioUrl La URL pública y accesible del archivo multimedia a transcribir.
 * @param {string} title Un título descriptivo para la transcripción o reunión.
 * @param {string} webhookUrl La URL del endpoint que Fireflies.ai notificará (POST)
 * cuando la transcripción esté completada. Debe ser HTTPS y pública.
 * @param {string} [customLanguage='es'] Código del idioma del audio (ej. 'es' para español, 'en' para inglés).
 * Por defecto es español.
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta de la API de Fireflies,
 * confirmando que el audio ha sido encolado para procesamiento.
 * No contiene la transcripción en sí misma.
 */
async function submitAudioForTranscription(
  audioUrl,
  title,
  webhookUrl,
  customLanguage = "es"
) {
  // Definición de la mutación GraphQL 'uploadAudio'.
  // Solicita campos como 'success', 'title', y 'message' en la respuesta.
  const mutation = `
        mutation($input: AudioUploadInput) {
            uploadAudio(input: $input) {
                success
                title
                message
            }
        }
    `;

  // Construcción del objeto de variables para la mutación.
  // El campo 'webhook' (antes 'webhookUrl' en pruebas previas) es el nombre correcto según la API.
  const variables = {
    input: {
      url: audioUrl,
      title: title,
      webhook: webhookUrl, // Nombre del campo para la URL del webhook.
      custom_language: customLanguage,
    },
  };

  console.log(
    "Cliente API: Preparando envío de audio para transcripción con variables:",
    JSON.stringify(variables, null, 2)
  );
  // Invocación a la función genérica para realizar la solicitud GraphQL.
  return makeGraphQLRequest(mutation, variables);
}

/**
 * Recupera los detalles de una transcripción específica de Fireflies.ai usando su ID.
 * Utiliza la query GraphQL 'transcript'.
 *
 * @param {string} transcriptId El ID único de la transcripción, usualmente obtenido del
 * payload del webhook (campo 'meetingId').
 * @returns {Promise<object>} Una promesa que resuelve con los datos detallados de la transcripción,
 * incluyendo frases, hablantes, etc.
 */
async function getTranscriptById(transcriptId) {
  // Definición de la query GraphQL 'transcript'.
  // Solicita campos clave como id, título, frases (con texto y tiempos), y hablantes.
  // Se han eliminado campos como 'status' y 'text' a nivel raíz de 'transcript'
  // ya que la API indicó que no son válidos en ese contexto (GRAPHQL_VALIDATION_FAILED).
  const query = `
        query Transcript($transcriptId: String!) {
            transcript(id: $transcriptId) {
                id
                title
                sentences {
                    text # El texto transcrito de cada frase.
                    start_time
                    end_time
                    speaker_name
                    speaker_id
                }
                speakers {
                    id
                    name
                }
            }
        }
    `;

  // Variables para la query, conteniendo el ID de la transcripción.
  const variables = {
    transcriptId: transcriptId,
  };

  console.log(
    `Cliente API: Solicitando transcripción con ID: ${transcriptId} (utilizando query GraphQL corregida)`
  );
  // Invocación a la función genérica para realizar la solicitud GraphQL.
  return makeGraphQLRequest(query, variables);
}

// Exportación de las funciones públicas del módulo para que puedan ser
// importadas y utilizadas en otras partes de la aplicación (ej. en index.js).
module.exports = {
  submitAudioForTranscription,
  getTranscriptById,
};
