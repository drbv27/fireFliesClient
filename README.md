# Servidor de Transcripción de Video con Fireflies.ai

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?logo=axios&logoColor=white)](https://axios-http.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![ngrok](https://img.shields.io/badge/ngrok-007ACC?&logoColor=white)](https://ngrok.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Fireflies.ai](https://img.shields.io/badge/Fireflies.ai-7A00F9?logo=firefliesdotai&logoColor=white)](https://fireflies.ai/)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098?logo=graphql&logoColor=white)](https://graphql.org/)
[![dotenv](https://img.shields.io/badge/dotenv-ECD53F?logoColor=black)](https://www.npmjs.com/package/dotenv)

Este proyecto implementa un servidor backend en Node.js y Express.js que interactúa con la API de Fireflies.ai para transcribir archivos de video (MP4) a partir de URLs públicas. El servidor maneja el envío de videos para transcripción, la recepción de notificaciones de webhook cuando el proceso se completa, y la recuperación de la transcripción final.

## Tabla de Contenidos

1.  [Prerrequisitos](#prerrequisitos)
2.  [Configuración de Fireflies.ai](#configuración-de-firefliesai)
    - [Crear Cuenta en Fireflies.ai](#crear-cuenta-en-firefliesai)
    - [Obtener Clave API (API Key)](#obtener-clave-api-api-key)
    - [Configurar Webhooks en Fireflies.ai](#configurar-webhooks-en-firefliesai)
3.  [Instalación y Configuración Local](#instalación-y-configuración-local)
    - [Clonar Repositorio](#clonar-repositorio)
    - [Instalar Dependencias](#instalar-dependencias)
    - [Variables de Entorno (`.env`)](#variables-de-entorno-env)
    - [Configurar y Ejecutar `ngrok` (para Webhooks Locales)](#configurar-y-ejecutar-ngrok-para-webhooks-locales)
    - [Ejecutar la Aplicación Localmente](#ejecutar-la-aplicación-localmente)
    - [Probar Localmente](#probar-localmente)
4.  [Despliegue a Producción](#despliegue-a-producción)
    - [Preparar Servidor de Producción](#preparar-servidor-de-producción)
    - [Desplegar Código](#desplegar-código)
    - [Variables de Entorno en Producción](#variables-de-entorno-en-producción)
    - [Actualizar URL del Webhook en Fireflies.ai](#actualizar-url-del-webhook-en-firefliesai)
    - [Configurar Proxy Inverso (Ejemplo con Nginx)](#configurar-proxy-inverso-ejemplo-con-nginx)
    - [Ejecutar la Aplicación en Producción (con PM2)](#ejecutar-la-aplicación-en-producción-con-pm2)
    - [Probar Despliegue en Producción](#probar-despliegue-en-producción)
5.  [Resumen de Endpoints de la API](#resumen-de-endpoints-de-la-api)
6.  [Solución de Problemas (Troubleshooting)](#solución-de-problemas-troubleshooting)

## Prerrequisitos

Antes de comenzar con la configuración y el despliegue de esta aplicación, asegúrese de tener lo siguiente:

- **Node.js**: Se recomienda la versión LTS (Soporte a Largo Plazo) más reciente. Puede descargarla desde [nodejs.org](https://nodejs.org/). (Por ejemplo, v18.x, v20.x o superior).
- **npm (Node Package Manager)**: Generalmente se instala automáticamente con Node.js. Puede verificar su instalación con `npm -v`.
- **Acceso a una Terminal o Línea de Comandos**: Necesario para ejecutar comandos de instalación, configuración y ejecución de la aplicación (ej. Command Prompt, PowerShell en Windows; Terminal en macOS/Linux).
- **Cuenta en Fireflies.ai**: Es indispensable una cuenta activa en [Fireflies.ai](https://fireflies.ai/) para obtener la clave API y configurar los webhooks. Revise los planes y límites de la API según sus necesidades.
- **`ngrok` (para pruebas locales de webhooks)**:
  - Una cuenta en [ngrok.com](https://ngrok.com/) (el plan gratuito es suficiente para este propósito).
  - La herramienta CLI de `ngrok` descargada y configurada con su authtoken.
- **Entorno de Despliegue (para producción)**:
  - Un servidor o plataforma de hosting compatible con Node.js (ej. un Droplet de DigitalOcean, AWS EC2, Heroku, Vercel, Render, etc.).
  - Un nombre de dominio público o subdominio (ej. `https://api.nevtis.com`) si se desea una URL personalizada para el servicio en producción.
  - Conocimientos básicos de administración de servidores si se opta por soluciones IaaS como DigitalOcean o AWS EC2.

## Configuración de Fireflies.ai

Para utilizar este servicio, es fundamental configurar correctamente su cuenta y los parámetros de la API en la plataforma de Fireflies.ai.

### Crear Cuenta en Fireflies.ai

1.  Visite el sitio web oficial: [https://fireflies.ai/](https://fireflies.ai/).
2.  Proceda con el registro para crear una nueva cuenta. Fireflies.ai suele ofrecer diferentes planes, incluyendo opciones gratuitas que pueden ser adecuadas para evaluación inicial. Se recomienda revisar las características y limitaciones de cada plan, especialmente en lo referente al uso de la API.

### Obtener Clave API (API Key)

La Clave API es un token secreto que autentica las solicitudes de su aplicación al servicio de Fireflies.ai.

1.  Una vez iniciada la sesión en su panel de control (dashboard) de Fireflies.ai, navegue a la sección designada para **Integraciones (Integrations)** o **API**.
2.  En esta sección, debería poder generar una nueva Clave API o localizar una existente.
3.  Copie la Clave API generada.
4.  **Nota Importante**: Trate esta Clave API como información confidencial. No la incruste directamente en el código fuente. Deberá ser configurada en la aplicación a través de la variable de entorno `FIREFLIES_API_KEY`.

### Configurar Webhooks en Fireflies.ai

Los webhooks son el mecanismo mediante el cual Fireflies.ai notificará a su aplicación de forma asíncrona sobre eventos importantes, como la finalización de una transcripción.

1.  Acceda a la sección de configuración de **API**, **Developer Settings** o **Webhooks** dentro de su panel de Fireflies.ai. La interfaz de configuración de webhooks (como la que se visualiza en la imagen `image_e490c2.png` que pudo haber sido consultada durante el desarrollo de esta guía) típicamente presenta los siguientes campos:

2.  **Activar Suscripciones de Eventos**:

    - Localice y active los eventos para los cuales desea recibir notificaciones. Para esta aplicación, el evento primordial es el de "Transcripción Completada". Marque la casilla correspondiente (ej. "**Transcription Completed (Triggered when transcription is completed)**").

3.  **URL del Webhook (Webhook url)**:

    - Este campo es crítico y requiere la URL pública y accesible donde su aplicación Node.js estará escuchando las notificaciones POST de Fireflies.ai.
    - **Para Pruebas Locales**: Durante el desarrollo, esta será la URL HTTPS proporcionada por `ngrok`, seguida de la ruta específica del endpoint de webhook (ej. `https://SU_SUBDOMINIO_NGROK.ngrok-free.app/fireflies-webhook`).
    - **Para Entornos de Producción**: Esta será la URL pública definitiva de su servidor donde la aplicación esté desplegada (ej. `https://api.nevtis.com/fireflies-webhook`).
    - Asegúrese de que esta URL sea `HTTPS`.

4.  **Secreto del Webhook (Webhook Secret / Signing Secret)**:

    - Este es un campo de texto donde debe ingresar una cadena secreta fuerte y única. Puede generar una utilizando un gestor de contraseñas o cualquier método seguro.
    - Este mismo secreto **debe** ser configurado en su aplicación Node.js a través de la variable de entorno `WEBHOOK_SECRET`.
    - Fireflies.ai utilizará este secreto para firmar los payloads de los webhooks (usualmente con HMAC-SHA256), y su aplicación lo usará para verificar la autenticidad de las notificaciones recibidas, asegurando que provienen de Fireflies.ai y no han sido alteradas.

5.  **Guardar Configuración**:
    - Una vez ingresada la URL del Webhook, activado el evento y establecido el Secreto del Webhook, guarde la configuración en el panel de Fireflies.ai. Es posible que la plataforma requiera que la URL del Webhook sea válida y el evento esté seleccionado para permitir guardar el secreto.

## Instalación y Configuración Local

Esta sección detalla los pasos necesarios para configurar y ejecutar la aplicación en un entorno de desarrollo local. Esto permite realizar pruebas, depuración y desarrollo de nuevas funcionalidades antes del despliegue a producción.

### Clonar Repositorio

Si el código fuente está gestionado mediante Git y alojado en un repositorio (ej. GitHub, GitLab), el primer paso es clonarlo.

1.  Abra una terminal o línea de comandos.
2.  Navegue hasta el directorio donde desea almacenar el proyecto.
3.  Ejecute el comando `git clone` seguido de la URL del repositorio:
    ```bash
    git clone <URL_DEL_REPOSITORIO_DE_LA_APLICACION>
    ```
4.  Acceda al directorio del proyecto recién clonado:
    ```bash
    cd <NOMBRE_DEL_DIRECTORIO_DEL_PROYECTO>
    ```

### Instalar Dependencias

El proyecto utiliza npm (Node Package Manager) para gestionar sus dependencias, las cuales están listadas en el archivo `package.json`.

1.  Asegúrese de estar en el directorio raíz del proyecto en su terminal.
2.  Ejecute el siguiente comando para instalar todas las dependencias necesarias:
    ```bash
    npm install
    ```
    Este comando leerá el archivo `package.json` y descargará e instalará los módulos listados en la carpeta `node_modules/`.

### Variables de Entorno (`.env`)

La aplicación utiliza variables de entorno para gestionar configuraciones sensibles (como claves API y secretos) y parámetros específicos del entorno (como URLs base y puertos). Esto se realiza mediante un archivo `.env` en la raíz del proyecto.

1.  En el directorio raíz del proyecto, cree un nuevo archivo llamado exactamente `.env`.
2.  Copie y pegue la siguiente plantilla en el archivo `.env`, y luego reemplace los valores de marcador de posición con su configuración específica:

    ```dotenv
    # Archivo .env para configuración de desarrollo local
    # Referenciar la sección "Configuración de Fireflies.ai" para obtener estos valores.

    # Clave API proporcionada por Fireflies.ai
    FIREFLIES_API_KEY=TU_CLAVE_API_DE_FIREFLIES_AQUI

    # Secreto compartido configurado en el panel de Fireflies.ai para la verificación de webhooks.
    # Debe ser una cadena segura y única.
    WEBHOOK_SECRET=TU_SECRETO_COMPARTIDO_CONFIGURADO_EN_FIREFLIES_DASHBOARD

    # URL base del servidor accesible públicamente. Para pruebas locales con webhooks,
    # esta será la URL HTTPS proporcionada por ngrok.
    SERVER_BASE_URL=TU_URL_HTTPS_DE_NGROK_AQUI

    # Puerto en el que la aplicación Node.js escuchará las solicitudes localmente.
    PORT=3001
    ```

    **Explicación de las Variables:**

    - `FIREFLIES_API_KEY`: Su clave API personal obtenida del panel de Fireflies.ai.
    - `WEBHOOK_SECRET`: La cadena secreta que definió y configuró en el panel de Fireflies.ai para la firma y verificación de webhooks.
    - `SERVER_BASE_URL`: Para el desarrollo local y la prueba de webhooks, esta **debe ser la URL HTTPS completa** proporcionada por `ngrok` (ej. `https://abcdef123456.ngrok-free.app`). La aplicación utilizará esta URL para construir la dirección completa del endpoint de webhook que se envía a Fireflies.ai.
    - `PORT`: El puerto en el que su servidor Node.js se ejecutará localmente (ej. `3001`). Asegúrese de que este puerto no esté en uso por otra aplicación.

### Configurar y Ejecutar `ngrok` (para Webhooks Locales)

Dado que Fireflies.ai necesita enviar notificaciones de webhook a una URL pública y HTTPS, se requiere `ngrok` (o una herramienta similar) para exponer su servidor de desarrollo local a internet durante las pruebas.

1.  **Descargar e Instalar `ngrok`**: Si aún no lo ha hecho, descargue `ngrok` desde [https://ngrok.com/download](https://ngrok.com/download) y siga las instrucciones para su sistema operativo. Se recomienda añadir `ngrok` al PATH del sistema para facilitar su uso.
2.  **Configurar Authtoken de `ngrok`**:
    - Regístrese para obtener una cuenta gratuita en [ngrok.com](https://ngrok.com).
    - Obtenga su authtoken desde el panel de `ngrok`: [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken).
    - Configure el authtoken en su CLI de `ngrok` (este paso solo se realiza una vez):
      ```bash
      ngrok config add-authtoken <SU_AUTHTOKEN_DE_NGROK>
      ```
3.  **Ejecutar `ngrok`**:
    - Abra una **nueva ventana de terminal** (deje la terminal para el servidor Node.js para más tarde).
    - Inicie `ngrok` para que apunte al puerto en el que se ejecutará su aplicación Node.js (el valor de `PORT` en su archivo `.env`):
      ```bash
      ngrok http <PUERTO_CONFIGURADO_EN_DOTENV>
      ```
      Por ejemplo, si `PORT=3001`, ejecute: `ngrok http 3001`.
4.  **Obtener la URL de `ngrok`**:
    - `ngrok` mostrará en su terminal una o varias URLs de "Forwarding". Copie la URL que comienza con `https://` (ej. `https://xxxxxx.ngrok-free.app`).
5.  **Actualizar `SERVER_BASE_URL` en `.env`**:
    - Abra su archivo `.env` y pegue la URL HTTPS de `ngrok` que acaba de copiar como valor para la variable `SERVER_BASE_URL`.
6.  **Actualizar URL en Fireflies.ai (si es necesario)**:
    - Asegúrese de que la "Webhook URL" configurada en el panel de Fireflies.ai (ver sección "Configurar Webhooks en Fireflies.ai") para el entorno de desarrollo o pruebas apunte a `TU_URL_HTTPS_DE_NGROK/fireflies-webhook`. Cada vez que reinicie `ngrok`, esta URL pública puede cambiar (a menos que tenga un plan de pago de `ngrok` con dominios fijos), por lo que deberá actualizarla tanto en su `.env` como en la configuración de Fireflies.ai.

### Ejecutar la Aplicación Localmente

Con las dependencias instaladas, el archivo `.env` configurado con la URL de `ngrok`, y `ngrok` corriendo en una terminal separada:

1.  Abra otra terminal (o use la que ya tiene en el directorio del proyecto).
2.  Ejecute el siguiente comando para iniciar el servidor Node.js:
    ```bash
    node index.js
    ```
3.  Observe la consola. Debería ver mensajes indicando que el servidor está escuchando en el puerto especificado (ej. `Servidor Express escuchando activamente en el puerto 3001`) y la `SERVER_BASE_URL` que está utilizando (que debería ser su URL de `ngrok`).

### Probar Localmente

Una vez que el servidor Node.js y `ngrok` estén corriendo y configurados correctamente:

1.  Utilice una herramienta cliente de API como Postman, Insomnia, o `curl` para enviar una solicitud `POST` al endpoint `/transcribe` de su **servidor local**.
    - **Método**: `POST`
    - **URL**: `http://localhost:<SU_PORT_EN_DOTENV>/transcribe` (ej. `http://localhost:3001/transcribe`)
    - **Cabeceras (Headers)**:
      - `Content-Type: application/json`
    - **Cuerpo (Body - formato JSON)**:
      ```json
      {
        "videoUrl": "URL_PUBLICA_DE_UN_VIDEO_MP4_VALIDO_PARA_PRUEBAS",
        "title": "Mi Prueba de Transcripción Local"
      }
      ```
      Asegúrese de usar una URL pública real de un archivo MP4 para `videoUrl`.
2.  **Observar el Flujo Completo**:
    - **Respuesta del Cliente (Postman/curl)**: Debería recibir una respuesta HTTP `202 Accepted` de su servidor local, indicando que la solicitud de transcripción ha sido encolada.
    - **Consola del Servidor Node.js**:
      - Verá logs del endpoint `/transcribe` confirmando la recepción de la solicitud y el envío de la tarea a Fireflies.ai.
      - Después de un tiempo (dependiendo de la duración del video), verá logs del endpoint `/fireflies-webhook` indicando la recepción de la notificación de Fireflies.ai, el resultado de la verificación de la firma, y finalmente la transcripción recuperada impresa en la consola.
    - **Consola de `ngrok`**: Mostrará las solicitudes HTTP `POST` entrantes a su URL pública de `ngrok` (específicamente al path `/fireflies-webhook`), con los códigos de estado correspondientes (debería ser `200 OK` si su endpoint de webhook procesó la notificación correctamente).

Siguiendo estos pasos, se puede configurar y probar completamente la aplicación en un entorno de desarrollo local.

## Despliegue a Producción

Una vez que la aplicación ha sido probada exhaustivamente en el entorno de desarrollo local, el siguiente paso es desplegarla en un servidor de producción. Esta sección describe los pasos generales para desplegar la aplicación Node.js en un servidor, utilizando como ejemplo un Droplet de DigitalOcean, aunque los principios son aplicables a otras plataformas de hosting compatibles con Node.js.

Se asume que ya se cuenta con un servidor aprovisionado y acceso SSH al mismo.

### Preparar Servidor de Producción

Antes de desplegar el código de la aplicación, es necesario asegurar que el servidor de producción cumpla con ciertos requisitos:

1.  **Instalar Node.js y npm**:

    - Conéctese a su servidor vía SSH.
    - Instale Node.js (se recomienda una versión LTS, la misma o una compatible con la usada en desarrollo) y npm. Los comandos exactos pueden variar según la distribución de Linux de su servidor.
      - Para distribuciones basadas en Debian/Ubuntu, podría ser algo como:
        ```bash
        sudo apt update
        sudo apt install nodejs npm
        ```
      - O, para versiones específicas de Node.js, se puede usar un gestor de versiones como NVM (Node Version Manager):
        ```bash
        curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.x/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.x/install.sh) | bash
        # (Reemplace v0.39.x con la última versión de NVM)
        # Luego, cierre y reabra su terminal, o ejecute: source ~/.bashrc (o ~/.zshrc)
        nvm install --lts # Instala la última versión LTS de Node.js
        nvm use --lts
        ```
    - Verifique las instalaciones:
      ```bash
      node -v
      npm -v
      ```

2.  **Configurar un Firewall**:

    - Es fundamental proteger el servidor con un firewall. `ufw` (Uncomplicated Firewall) es una opción común en Ubuntu.
    - Permita el tráfico en los puertos necesarios:
      - `22` (para SSH)
      - `80` (para HTTP)
      - `443` (para HTTPS)
      ```bash
      sudo ufw allow ssh
      sudo ufw allow http
      sudo ufw allow https
      sudo ufw enable
      sudo ufw status
      ```

3.  **(Recomendado) Configurar un Proxy Inverso (ej. Nginx)**:

    - Aunque la aplicación Node.js/Express puede servir tráfico HTTP directamente, no es recomendable exponerla directamente a internet en producción por razones de seguridad, rendimiento y gestión de SSL/TLS.
    - Un proxy inverso como Nginx se sitúa delante de la aplicación Node.js para:
      - Manejar las conexiones SSL/TLS (terminación SSL), sirviendo la aplicación sobre HTTPS.
      - Servir activos estáticos (si los hubiera).
      - Realizar balanceo de carga (si se escala a múltiples instancias).
      - Gestionar el enrutamiento de peticiones al puerto interno donde corre la aplicación Node.js.
    - Instale Nginx:
      ```bash
      sudo apt update
      sudo apt install nginx
      ```
    - La configuración detallada de Nginx se abordará en una subsección posterior.

4.  **(Opcional pero Recomendado) Crear un Usuario Dedicado**:
    - Por seguridad, es una buena práctica no ejecutar la aplicación Node.js como usuario `root`. Considere crear un usuario dedicado sin privilegios de superusuario para la aplicación.
      ```bash
      sudo adduser nombredeusuarioapp
      sudo usermod -aG sudo nombredeusuarioapp # Si necesita algunos privilegios sudo, o gestionar con cautela
      # su - nombredeusuarioapp # Cambiar al nuevo usuario
      ```

Con estos pasos, el servidor base estará más preparado para alojar la aplicación. La siguiente subsección tratará sobre cómo transferir y configurar el código de la aplicación en este servidor.

### Desplegar Código

Una vez que el servidor de producción está preparado, el siguiente paso es transferir los archivos de la aplicación al servidor.

Existen varios métodos para desplegar el código. A continuación, se describen los más comunes:

1.  **Usando Git (Recomendado)**:
    Si el proyecto está versionado con Git y alojado en un repositorio remoto (ej. GitHub, GitLab, Bitbucket):

    - Conéctese al servidor de producción vía SSH.
    - Navegue al directorio donde desea alojar la aplicación (ej. `/var/www/`, `/srv/`, o el directorio home del usuario dedicado).
    - Clone el repositorio:
      ```bash
      git clone <URL_DEL_REPOSITORIO_DE_LA_APLICACION>
      ```
    - Acceda al directorio del proyecto recién clonado:
      ```bash
      cd <NOMBRE_DEL_DIRECTORIO_DEL_PROYECTO>
      ```
    - Asegúrese de estar en la rama o tag correcto para producción (ej. `main`, `master`, o una etiqueta de release):
      ```bash
      git checkout main
      # o git checkout v1.0.0 (si usa tags para releases)
      git pull # Para asegurarse de tener la última versión de la rama
      ```

2.  **Transferencia Manual (ej. `scp`, `rsync`, o SFTP)**:
    Si prefiere no usar Git directamente en el servidor de producción, puede empaquetar los archivos de su aplicación localmente (excluyendo `node_modules` y archivos innecesarios como `.git` si es un clon) y transferirlos al servidor usando herramientas como `scp` (Secure Copy), `rsync`, o un cliente SFTP.
    - Ejemplo con `scp` (desde su máquina local):
      ```bash
      # Comprimir el directorio del proyecto (sin node_modules)
      # tar -czvf mi_aplicacion.tar.gz ./mi_directorio_proyecto --exclude=node_modules --exclude=.git
      # scp mi_aplicacion.tar.gz usuario@tu_servidor_ip:/ruta/en/el/servidor/
      ```
    - Luego, en el servidor, descomprimir el archivo y navegar al directorio.

Una vez que el código fuente de la aplicación se encuentre en el servidor de producción:

3.  **Navegar al Directorio del Proyecto**:
    Asegúrese de estar en el directorio raíz del proyecto en la terminal del servidor.

    ```bash
    cd /ruta/a/tu/directorio/del/proyecto
    ```

4.  **Instalar Dependencias de Producción**:
    Es crucial instalar las dependencias necesarias para que la aplicación se ejecute. Para entornos de producción, generalmente solo se necesitan las dependencias de ejecución (`dependencies` en `package.json`) y no las de desarrollo (`devDependencies`).
    - Ejecute el siguiente comando para instalar únicamente las dependencias de producción:
      ```bash
      npm install --production
      ```
    - Si por alguna razón su proyecto tuviera un paso de "build" que requiriera `devDependencies` (no es el caso de esta aplicación Express simple), el flujo sería: `npm install`, luego el script de `build`, y después opcionalmente `npm prune --production`. Sin embargo, para este proyecto, `npm install --production` es lo más adecuado y eficiente.

Con el código en su lugar y las dependencias de producción instaladas, la aplicación está casi lista para ser configurada con las variables de entorno de producción y ejecutada.

### Variables de Entorno en Producción

Al igual que en el entorno de desarrollo local, la aplicación en producción requiere variables de entorno para su correcta configuración y funcionamiento. Estas variables incluyen claves API, secretos y URLs específicas del entorno de producción.

**Métodos de Configuración:**

Existen varias formas de configurar variables de entorno en un servidor de producción:

1.  **Archivo `.env` (con precauciones)**:

    - Se puede crear un archivo `.env` directamente en el servidor, en el directorio raíz del proyecto.
    - **Seguridad Crítica**: Si se utiliza este método, es **imperativo** asegurar que este archivo `.env` de producción **NUNCA** se añada al control de versiones (Git). Debe estar listado en el archivo `.gitignore` del proyecto.
    - Los permisos de este archivo en el servidor deben ser restrictivos para proteger la información sensible.

2.  **Variables de Entorno del Sistema Operativo**:

    - Se pueden definir las variables directamente en el entorno del sistema operativo del servidor o para el usuario bajo el cual se ejecuta la aplicación. Este método es común y considerado seguro.

3.  **Plataformas de Hosting Específicas**:
    - Muchos proveedores de PaaS (Platform as a Service) como Heroku, Vercel, o servicios gestionados en AWS, Azure, Google Cloud, ofrecen interfaces o herramientas CLI para configurar variables de entorno directamente en la plataforma, lo cual es a menudo el método preferido y más seguro para esos entornos.

**Variables Requeridas para Producción:**

A continuación, se muestra una plantilla de las variables de entorno necesarias para el entorno de producción. Si se utiliza un archivo `.env` en el servidor, este sería su contenido:

```dotenv
# Archivo .env para configuración de PRODUCCIÓN
# Estas variables deben reflejar la configuración del entorno de producción.

# Clave API proporcionada por Fireflies.ai.
FIREFLIES_API_KEY=SU_CLAVE_API_DE_FIREFLIES_REAL

# Secreto compartido configurado en el panel de Fireflies.ai y en su aplicación para la verificación de webhooks.
# Debe ser idéntico al configurado en la plataforma de Fireflies.ai.
WEBHOOK_SECRET=SU_SECRETO_COMPARTIDO_DE_WEBHOOK_REAL

# URL base pública y HTTPS de la aplicación en producción.
# Esta es la URL que los usuarios y servicios externos (como Fireflies.ai para webhooks) utilizarán.
# Ejemplo: [https://api.nevtis.com](https://api.nevtis.com)
SERVER_BASE_URL=https://SU.DOMINIO.PUBLICO.COM

# Puerto INTERNO en el que la aplicación Node.js escuchará en el servidor de producción.
# Un proxy inverso (como Nginx) usualmente manejará el tráfico de los puertos públicos (80/443)
# y lo redirigirá a este puerto interno.
PORT=3001

# Establece el entorno de Node.js a 'production'.
# Esto habilita optimizaciones de rendimiento en Express y otros módulos,
# y puede desactivar mensajes de error detallados orientados al desarrollo.
NODE_ENV=production

```

### Actualizar URL del Webhook en Fireflies.ai

Una vez que la aplicación está desplegada en el servidor de producción y se tiene una URL pública y estable (ej. `https://api.nevtis.com`), es crucial actualizar la configuración del webhook en el panel de Fireflies.ai para que las notificaciones se envíen a este nuevo endpoint de producción.

Si este paso no se realiza, Fireflies.ai continuará enviando webhooks a la URL configurada previamente (ej. la URL de `ngrok` usada para desarrollo local), y la aplicación en producción no recibirá las notificaciones de transcripción completada.

1.  **Acceder al Panel de Fireflies.ai**:

    - Inicie sesión en su cuenta de [Fireflies.ai](https://fireflies.ai/).
    - Navegue a la sección de configuración de **API**, **Developer Settings** o **Webhooks**, donde configuró inicialmente el webhook (referirse a la sección "Configurar Webhooks en Fireflies.ai" de este README).

2.  **Identificar la Configuración del Webhook**:

    - Localice la configuración del webhook que corresponde a la aplicación o al evento de "Transcription Completed".

3.  **Actualizar el Campo "Webhook URL"**:

    - Modifique el valor del campo "Webhook URL".
    - Ingrese la URL completa y pública de su endpoint de webhook en producción. Esta URL se compone de la `SERVER_BASE_URL` que configuró en las variables de entorno de producción, seguida de la ruta `/fireflies-webhook`.
      - **Ejemplo**: Si su `SERVER_BASE_URL` es `https://api.nevtis.com`, la URL a ingresar aquí será:
        `https://api.nevtis.com/fireflies-webhook`

4.  **Verificar el "Webhook Secret"**:

    - El "Webhook Secret" (o Signing Secret) configurado en Fireflies.ai **debe seguir siendo idéntico** al valor de la variable de entorno `WEBHOOK_SECRET` en su servidor de producción. Si por alguna razón necesita cambiarlo, asegúrese de actualizarlo en ambos lugares. Generalmente, este secreto no necesita cambiar durante el paso de desarrollo a producción a menos que haya una política de rotación de secretos.

5.  **Guardar los Cambios**:
    - Guarde la configuración actualizada en el panel de Fireflies.ai.

Después de realizar estos cambios, Fireflies.ai comenzará a enviar las notificaciones de webhook (como "Transcription Completed") a la URL de su servidor de producción. El endpoint `/fireflies-webhook` de su aplicación, ahora expuesto públicamente y protegido por un proxy inverso (como Nginx), recibirá y procesará estas notificaciones.

### Configurar Proxy Inverso (Ejemplo con Nginx)

En un entorno de producción, no es recomendable exponer directamente la aplicación Node.js a internet. En su lugar, se utiliza un servidor web como Nginx (o Apache) como **proxy inverso**. El proxy inverso recibe las solicitudes públicas (generalmente en los puertos 80 para HTTP y 443 para HTTPS), gestiona la terminación SSL/TLS (para HTTPS), y luego reenvía las solicitudes de forma segura a la aplicación Node.js que está escuchando en un puerto interno (ej. el `PORT` definido en su archivo `.env`, como `3001`).

Esta sección proporciona un ejemplo básico de configuración para Nginx.

**Requisitos Previos:**

- Nginx debe estar instalado en el servidor de producción (ver subsección "Preparar Servidor de Producción").
- Se debe poseer un nombre de dominio (ej. `api.nevtis.com`) apuntando a la dirección IP pública del servidor.
- Se debe haber obtenido e instalado un certificado SSL/TLS para el dominio (herramientas como [Let's Encrypt](https://letsencrypt.org/) con [Certbot](https://certbot.eff.org/) son opciones populares y gratuitas para esto).

**Pasos para Configurar Nginx:**

1.  **Crear un Archivo de Configuración de Nginx para la Aplicación**:

    - Nginx guarda sus configuraciones de sitios (virtual hosts) usualmente en `/etc/nginx/sites-available/`.
    - Cree un nuevo archivo de configuración para su dominio, por ejemplo:
      ```bash
      sudo nano /etc/nginx/sites-available/api.nevtis.com.conf
      ```
      (Reemplace `api.nevtis.com` con su nombre de dominio real).

2.  **Pegar y Adaptar la Configuración de Ejemplo**:
    A continuación, un ejemplo de configuración. **Debe adaptarlo** con su nombre de dominio, las rutas a sus certificados SSL y el puerto interno de su aplicación Node.js.

    ```nginx
    # /etc/nginx/sites-available/api.nevtis.com.conf

    # Bloque para redirigir tráfico HTTP (puerto 80) a HTTPS (puerto 443)
    server {
        listen 80;
        listen [::]:80; # Para IPv6
        server_name api.nevtis.com; # Reemplazar con su dominio

        # Redirección permanente (301) a la versión HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Bloque principal para el servicio HTTPS (puerto 443)
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2; # Para IPv6
        server_name api.nevtis.com; # Reemplazar con su dominio

        # Configuración SSL/TLS
        # Reemplazar con las rutas reales a sus archivos de certificado y clave privada.
        # Estos son ejemplos comunes si se utiliza Certbot con Let's Encrypt.
        ssl_certificate /etc/letsencrypt/live/[api.nevtis.com/fullchain.pem](https://api.nevtis.com/fullchain.pem);
        ssl_certificate_key /etc/letsencrypt/live/[api.nevtis.com/privkey.pem](https://api.nevtis.com/privkey.pem);

        # Parámetros SSL recomendados (usualmente proporcionados por Certbot o configuraciones estándar)
        # Asegúrese de que estos archivos existan o ajuste según su configuración SSL.
        include /etc/letsencrypt/options-ssl-nginx.conf; # Contiene ciphers, protocolos, etc.
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;   # Para Perfect Forward Secrecy.

        # Configuración de logs (opcional pero recomendado)
        access_log /var/log/nginx/api.nevtis.com.access.log;
        error_log /var/log/nginx/api.nevtis.com.error.log;

        # Bloque de ubicación principal para redirigir todas las solicitudes a la aplicación Node.js
        location / {
            # 'proxy_pass' dirige la solicitud al servidor Node.js que escucha localmente.
            # Reemplace '3001' si su aplicación Node.js escucha en un puerto diferente.
            proxy_pass http://localhost:3001;

            # Cabeceras HTTP importantes para pasar a la aplicación backend.
            proxy_http_version 1.1; # Versión del protocolo HTTP para el proxy.
            proxy_set_header Upgrade $http_upgrade; # Para WebSockets (aunque no se usan aquí, es buena práctica).
            proxy_set_header Connection 'upgrade';  # Para WebSockets.
            proxy_set_header Host $host; # Pasa el nombre de host original solicitado por el cliente.
            proxy_set_header X-Real-IP $remote_addr; # Pasa la dirección IP real del cliente.
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; # Lista de IPs si hay múltiples proxies.
            proxy_set_header X-Forwarded-Proto $scheme; # Pasa el protocolo original (http o https).
            proxy_cache_bypass $http_upgrade; # Para WebSockets.
        }
    }
    ```

3.  **Habilitar la Configuración del Sitio**:

    - Cree un enlace simbólico desde `sites-available` a `sites-enabled` para activar la configuración:
      ```bash
      sudo ln -s /etc/nginx/sites-available/api.nevtis.com.conf /etc/nginx/sites-enabled/
      ```
    - **Importante**: Elimine el archivo de configuración por defecto de Nginx de `sites-enabled` si interfiere (usualmente `sudo rm /etc/nginx/sites-enabled/default`).

4.  **Probar la Configuración de Nginx**:

    - Antes de reiniciar Nginx, verifique que no haya errores de sintaxis en la configuración:
      ```bash
      sudo nginx -t
      ```
    - Si muestra "syntax is ok" y "test is successful", puede proceder.

5.  **Reiniciar Nginx**:
    - Aplique los cambios reiniciando el servicio Nginx:
      ```bash
      sudo systemctl restart nginx
      ```
    - O, si prefiere recargar la configuración sin interrumpir conexiones existentes (si es posible):
      ```bash
      sudo systemctl reload nginx
      ```

**Consideraciones Adicionales:**

- **Certificados SSL**: La obtención e instalación de certificados SSL (ej. usando Certbot para Let's Encrypt) es un paso previo fundamental que no se detalla aquí pero es esencial para HTTPS. Certbot a menudo puede configurar Nginx automáticamente para SSL.
- **Firewall**: Asegúrese de que su firewall (ej. `ufw`) permite tráfico en los puertos 80 y 443.
- **Puerto de la Aplicación Node.js**: La directiva `proxy_pass http://localhost:3001;` debe apuntar al puerto correcto en el que su aplicación Node.js (definido por la variable `PORT` en su `.env`) está escuchando.

Con Nginx configurado como proxy inverso, su aplicación Node.js estará accesible de forma segura a través de su dominio público utilizando HTTPS. El proxy manejará las conexiones entrantes y las reenviará internamente a su aplicación.

### Ejecutar la Aplicación en Producción (con PM2)

En un entorno de producción, simplemente ejecutar `node index.js` en una terminal no es suficiente, ya que el proceso terminaría si la terminal se cierra o si la aplicación falla. Se necesita un **gestor de procesos** para mantener la aplicación Node.js en ejecución de forma continua, reiniciarla en caso de errores, gestionar logs y facilitar actualizaciones sin tiempo de inactividad (o con tiempo mínimo).

**PM2** es un gestor de procesos popular y robusto para aplicaciones Node.js en producción.

**Pasos para Usar PM2:**

1.  **Instalar PM2 Globalmente**:

    - Si aún no está instalado en el servidor de producción, instálelo globalmente usando npm:
      ```bash
      sudo npm install pm2 -g
      ```
    - Esto hace que el comando `pm2` esté disponible en todo el sistema.

2.  **Iniciar la Aplicación con PM2**:

    - Navegue hasta el directorio raíz de su aplicación en el servidor.
    - Inicie la aplicación usando PM2. Se recomienda darle un nombre descriptivo al proceso:
      ```bash
      pm2 start index.js --name "fireflies-transcriber-api"
      ```
      - `index.js`: Es el archivo de entrada principal de su aplicación.
      - `--name "fireflies-transcriber-api"`: Asigna un nombre al proceso gestionado por PM2, lo que facilita su identificación y gestión.
    - PM2 ejecutará la aplicación en segundo plano. La variable de entorno `NODE_ENV=production` (que debería estar definida en su archivo `.env` o en el entorno del sistema) será utilizada por la aplicación.

3.  **Comandos Útiles de PM2**:

    - **Listar procesos gestionados por PM2**:
      ```bash
      pm2 list
      ```
    - **Ver logs de la aplicación en tiempo real**:
      ```bash
      pm2 logs fireflies-transcriber-api
      # O para todos los procesos: pm2 logs
      ```
    - **Monitorear el uso de CPU y memoria de los procesos**:
      ```bash
      pm2 monit
      ```
    - **Detener un proceso**:
      ```bash
      pm2 stop fireflies-transcriber-api
      ```
    - **Reiniciar un proceso**:
      ```bash
      pm2 restart fireflies-transcriber-api
      ```
    - **Eliminar un proceso de la lista de PM2**:
      ```bash
      pm2 delete fireflies-transcriber-api
      ```

4.  **Configurar PM2 para Reinicio Automático (Startup Script)**:

    - Para asegurar que PM2 (y por ende, su aplicación) se reinicie automáticamente si el servidor se reinicia, genere y configure un script de inicio. PM2 intentará detectar el sistema de inicio de su servidor (ej. `systemd`, `upstart`, etc.).
      ```bash
      pm2 startup
      ```
    - Este comando usualmente proporcionará otro comando que necesita ejecutar con privilegios de superusuario (sudo) para completar la configuración del script de inicio. Siga las instrucciones que PM2 muestre en la consola.
    - Ejemplo para `systemd` (común en muchas distribuciones Linux modernas): `sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u tu_usuario --hp /home/tu_usuario` (el comando exacto puede variar).

5.  **Guardar el Estado Actual de los Procesos PM2**:
    - Después de iniciar su aplicación y configurar el script de inicio, guarde la lista actual de procesos para que PM2 los restaure al arrancar:
      ```bash
      pm2 save
      ```

**Consideraciones Adicionales con PM2:**

- **Variables de Entorno**: PM2 generalmente respeta las variables de entorno cargadas por la aplicación (ej. desde `.env` a través de `dotenv`). Si `NODE_ENV=production` está en su archivo `.env`, la aplicación iniciada por PM2 lo utilizará. También es posible definir variables de entorno específicas para PM2 a través de un archivo de configuración de ecosistema (`ecosystem.config.js`), lo cual es útil para configuraciones más complejas o múltiples aplicaciones.
- **Actualizaciones de Código**: Para actualizar la aplicación, generalmente se haría un `git pull` (o el método de despliegue que use) en el directorio del proyecto, luego se instalarían las dependencias si es necesario, y finalmente se reiniciaría el proceso con `pm2 restart fireflies-transcriber-api`.

Con PM2 gestionando su aplicación, esta se ejecutará de manera más estable y resiliente en el entorno de producción.

### Probar Despliegue en Producción

Una vez que la aplicación está configurada y ejecutándose en el servidor de producción con un gestor de procesos como PM2, y el proxy inverso (Nginx) está correctamente configurado para manejar el tráfico público HTTPS, es esencial realizar pruebas exhaustivas para asegurar que todo el flujo de trabajo opera como se espera.

**Pasos para la Prueba en Producción:**

1.  **Verificar Accesibilidad de la Aplicación**:

    - Asegúrese de que la aplicación sea accesible a través de su dominio público configurado (ej. `https://api.nevtis.com`). Puede intentar acceder a la ruta raíz (`/`) en un navegador para ver el mensaje de bienvenida, o usar `curl` desde otra máquina:
      ```bash
      curl [https://tu.dominio.publico.com/](https://tu.dominio.publico.com/)
      ```
    - Esto también verifica que la configuración del proxy inverso y SSL/TLS esté funcionando.

2.  **Enviar una Solicitud de Transcripción**:

    - Utilice una herramienta cliente de API (como Postman, Insomnia o `curl`) para enviar una solicitud `POST` al endpoint `/transcribe` de su URL de **producción**.
      - **Método**: `POST`
      - **URL**: `https://tu.dominio.publico.com/transcribe` (Reemplace con su dominio real).
      - **Cabeceras (Headers)**:
        - `Content-Type: application/json`
      - **Cuerpo (Body - formato JSON)**:
        ```json
        {
          "videoUrl": "URL_PUBLICA_DE_UN_VIDEO_MP4_DE_PRUEBA_DIFERENTE",
          "title": "Prueba de Transcripción en Producción"
        }
        ```
        Utilice una URL de video válida y, si es posible, diferente a las usadas en pruebas locales para una clara distinción en los logs.

3.  **Monitorear el Proceso y los Logs**:

    - **Respuesta del Cliente**: La herramienta cliente (Postman/`curl`) debería recibir una respuesta HTTP `202 Accepted` de su servidor, confirmando que la solicitud de transcripción fue aceptada y encolada.
    - **Logs de la Aplicación (PM2)**:
      - Conéctese al servidor de producción vía SSH.
      - Monitoree los logs de su aplicación gestionada por PM2 en tiempo real:
        ```bash
        pm2 logs fireflies-transcriber-api
        # (Reemplace "fireflies-transcriber-api" con el nombre que le dio al proceso en PM2)
        ```
      - **Observar en los logs de PM2**:
        1.  Mensajes del endpoint `/transcribe` indicando la recepción de la solicitud y el envío de la tarea a Fireflies.ai (la URL del webhook enviada a Fireflies ahora será su URL de producción).
        2.  Después de un período de procesamiento (dependiendo de la duración del video), mensajes del endpoint `/fireflies-webhook` indicando:
            - "¡Notificación de webhook de Fireflies recibida!"
            - "Firma del webhook verificada correctamente." (Si la firma es válida).
            - "Payload del webhook procesado:" seguido del JSON del payload.
            - "Evento 'Transcription completed' para ID: ..."
            - "--- TRANSCRIPCIÓN RECUPERADA POR WEBHOOK ---" seguido del título y las frases de la transcripción.
    - **Logs del Proxy Inverso (Nginx)**:
      - Revise los logs de acceso y error de Nginx para su sitio (usualmente en `/var/log/nginx/tu.dominio.publico.com.access.log` y `/var/log/nginx/tu.dominio.publico.com.error.log`).
      - Busque las solicitudes `POST` a `/transcribe` y `/fireflies-webhook`. Verifique que los códigos de estado sean los esperados (ej. `202` para `/transcribe` desde el cliente, `200` para `/fireflies-webhook` desde Fireflies.ai a través de Nginx).
      - Estos logs pueden ayudar a diagnosticar problemas a nivel de proxy o SSL.
    - **(Opcional) Panel de Fireflies.ai**:
      - Puede revisar el estado de la tarea de transcripción en su panel de Fireflies.ai si necesita verificar algo desde su lado.

4.  **Verificar la Integridad de la Transcripción**:
    - Confirme que la transcripción impresa en los logs de PM2 es la esperada para el video de prueba enviado.

Realizar estas pruebas confirma que todos los componentes del sistema (aplicación Node.js, proxy inverso, configuración de Fireflies.ai, y variables de entorno de producción) están interactuando correctamente en el entorno en vivo.

## Resumen de Endpoints de la API

Esta sección documenta los endpoints de la API expuestos por el servidor de transcripción.

### `POST /transcribe`

Este endpoint se utiliza para iniciar el proceso de transcripción de un video. El cliente envía la URL pública del video y, opcionalmente, un título. El servidor entonces se comunica con la API de Fireflies.ai para encolar la tarea de transcripción.

- **Método HTTP**: `POST`
- **Ruta**: `/transcribe`
- **Cuerpo de la Solicitud (Request Body)**:

  - **Content-Type**: `application/json`
  - **Estructura**:
    ```json
    {
      "videoUrl": "string (requerido)",
      "title": "string (opcional)"
    }
    ```
  - **Campos**:
    - `videoUrl`: La URL pública y accesible del archivo de video MP4 que se desea transcribir. Es un campo obligatorio.
    - `title`: Un título opcional para la transcripción. Si no se provee, la aplicación puede generar uno por defecto.

- **Respuesta Exitosa (Success Response)**:

  - **Código HTTP**: `202 Accepted`
    - Este código indica que la solicitud ha sido aceptada para procesamiento, pero la transcripción es un proceso asíncrono y no se completa inmediatamente.
  - **Cuerpo de la Respuesta (JSON)**:
    ```json
    {
      "message": "Video enviado a Fireflies.ai para transcripción. La notificación llegará al webhook configurado.",
      "details": {
        "uploadAudio": {
          "success": true,
          "title": "string", // El título usado para la transcripción
          "message": "string" // Mensaje de Fireflies.ai, ej. "Uploaded audio has been queued for processing."
        }
      }
    }
    ```

- **Respuestas de Error Comunes**:
  - **Código HTTP**: `400 Bad Request`
    - **Causa**: Generalmente, si el campo `videoUrl` falta en el cuerpo de la solicitud.
    - **Cuerpo (JSON)**: `{"error": "El campo \"videoUrl\" es requerido."}`
  - **Código HTTP**: `500 Internal Server Error`
    - **Causa**: Errores del lado del servidor al intentar comunicarse con la API de Fireflies.ai, o errores internos inesperados.
    - **Cuerpo (JSON)**: `{"error": "Mensaje descriptivo del error", "details": "Objeto opcional con detalles del error de la API externa si aplica"}`

---

### `POST /fireflies-webhook`

Este endpoint está diseñado para ser consumido por el servicio de Fireflies.ai. Fireflies.ai enviará notificaciones (webhooks) a esta URL cuando ocurran eventos relevantes, como la finalización de una transcripción. **Este endpoint no está pensado para ser llamado directamente por usuarios finales o clientes de la API.**

La autenticidad de las solicitudes a este endpoint se verifica mediante una firma HMAC-SHA256 enviada en la cabecera `x-hub-signature`.

- **Método HTTP**: `POST`
- **Ruta**: `/fireflies-webhook`
- **Cabeceras de Solicitud Esperadas (por el servidor, enviadas por Fireflies.ai)**:

  - `Content-Type`: `application/json`
  - `x-hub-signature`: `string` (Ej: `sha256=FIRMA_HMAC_SHA256_DEL_PAYLOAD`). Requerida si la verificación de firma está activa.

- **Cuerpo de la Solicitud (Request Body - enviado por Fireflies.ai)**:

  - **Content-Type**: `application/json`
  - **Estructura (Ejemplo para evento "Transcription completed")**:
    ```json
    {
      "meetingId": "string_id_unico_de_transcripcion",
      "eventType": "Transcription completed",
      "clientReferenceId": null // O el ID enviado opcionalmente durante la carga.
      // ... pueden existir otros campos dependiendo del tipo de evento y la API de Fireflies.ai
    }
    ```

- **Respuesta Exitosa (Success Response - enviada por el servidor a Fireflies.ai)**:

  - **Código HTTP**: `200 OK`
  - **Cuerpo**: `string` (Ej: "Webhook recibido y procesado.")
    - Esta respuesta confirma a Fireflies.ai que la notificación fue recibida y aceptada.

- **Respuestas de Error Comunes (enviadas por el servidor a Fireflies.ai)**:
  - **Código HTTP**: `400 Bad Request`
    - **Causa**: Si la cabecera `x-hub-signature` es esperada pero no se proporciona.
  - **Código HTTP**: `403 Forbidden`
    - **Causa**: Si la verificación de la firma `x-hub-signature` falla (la firma no es válida).
  - **Código HTTP**: `500 Internal Server Error`
    - **Causa**: Errores internos del servidor durante el procesamiento del webhook (ej. fallo al parsear el payload después de la verificación, error al contactar la API de Fireflies para obtener la transcripción, etc.).

## Solución de Problemas (Troubleshooting)

Esta sección proporciona una guía para diagnosticar y resolver problemas comunes que pueden surgir durante la configuración, desarrollo o despliegue de la aplicación.

---

**1. Error: `FIREFLIES_API_KEY no configurada` o Errores de Autenticación (401/403) desde la API de Fireflies.ai**

- **Síntoma**: La aplicación falla al iniciar o las llamadas a la API de Fireflies.ai devuelven errores de autenticación.
- **Causas Comunes y Soluciones**:
  - Verifique que la variable de entorno `FIREFLIES_API_KEY` esté definida correctamente en su archivo `.env` (o en la configuración de entorno de su servidor de producción).
  - Asegúrese de que el valor de `FIREFLIES_API_KEY` sea exactamente el mismo que la clave API activa en su panel de control de Fireflies.ai.
  - Confirme que su plan de Fireflies.ai permite el acceso a la API y que la clave no ha expirado o sido revocada.

---

**2. Webhook No Llega al Servidor Local (cuando se usa `ngrok`)**

- **Síntoma**: La transcripción se completa en Fireflies.ai, pero el endpoint `/fireflies-webhook` en el servidor local no se activa (no se ven logs de "Notificación de webhook recibida").
- **Causas Comunes y Soluciones**:
  - **`ngrok` no está corriendo**: Asegúrese de que `ngrok` esté activo en una terminal separada y que el túnel esté online, apuntando al puerto correcto de su aplicación Node.js (ej. `ngrok http 3001`).
  - **`SERVER_BASE_URL` incorrecta**: Verifique que la variable `SERVER_BASE_URL` en su archivo `.env` contenga la URL HTTPS **actual** proporcionada por `ngrok`. Las URLs de `ngrok` (en el plan gratuito) cambian cada vez que se reinicia el túnel.
  - **URL del Webhook en Fireflies.ai desactualizada**: Confirme que la "Webhook URL" configurada en el panel de Fireflies.ai esté actualizada para apuntar a `SU_URL_NGROK_ACTUAL/fireflies-webhook`.
  - **Firewall Local**: Aunque menos común, un firewall en su máquina de desarrollo podría estar bloqueando las conexiones entrantes de `ngrok`.

---

**3. Webhook Llega pero Falla la Verificación de Firma (Respuesta `403 Forbidden` o mensaje "Firma inválida")**

- **Síntoma**: El endpoint `/fireflies-webhook` se activa, pero los logs indican que la firma es inválida y se devuelve un error 403.
- **Causas Comunes y Soluciones**:
  - **Discrepancia en `WEBHOOK_SECRET`**: La causa más probable es que el valor de `WEBHOOK_SECRET` en su archivo `.env` no coincida **exactamente** (sensible a mayúsculas/minúsculas y espacios) con el secreto configurado en el panel de Fireflies.ai para la suscripción del webhook. Verifique ambos y asegúrese de que son idénticos.
  - **Cuerpo de la Solicitud Modificado**: Si el cuerpo (`req.body`) de la solicitud del webhook fuera modificado o parseado incorrectamente antes de que se calcule el HMAC para la verificación, la firma no coincidiría. La configuración actual con `bodyParser.raw()` para esta ruta debería prevenir esto.

---

**4. Log del Servidor: "Webhook recibido SIN firma (x-hub-signature)"**

- **Síntoma**: El webhook llega, pero el servidor registra que la cabecera `x-hub-signature` no está presente.
- **Causas Comunes y Soluciones**:
  - **Secreto No Configurado en Fireflies.ai**: La causa principal es que el "Webhook Secret" no ha sido configurado (o guardado correctamente) en el panel de desarrollador de Fireflies.ai para la URL del webhook correspondiente. Si Fireflies.ai no tiene un secreto configurado para un endpoint de webhook, no enviará la cabecera de firma. Asegúrese de que el secreto esté guardado en la plataforma de Fireflies.ai.

---

**5. Errores `GRAPHQL_VALIDATION_FAILED` (usualmente HTTP 400) al Obtener la Transcripción**

- **Síntoma**: La verificación del webhook es exitosa, pero la llamada a `getTranscriptById` desde el servidor a Fireflies.ai falla con un error que indica "Cannot query field..." o similar.
- **Causas Comunes y Soluciones**:
  - **Consulta GraphQL Inválida**: La estructura de la consulta GraphQL (definida en `firefliesClient.js` dentro de la función `getTranscriptById`) solicita campos que no existen o no son accesibles en el tipo `Transcript` según el schema de la API de Fireflies.ai.
  - **Solución**: Revise la definición de la consulta GraphQL en `firefliesClient.js`. Compare los campos solicitados con la documentación oficial de la API de Fireflies.ai o con una consulta que haya sido previamente validada (ej. a través de herramientas como Postman con el explorador GraphQL de Fireflies, si está disponible). Elimine o corrija los campos problemáticos.

---

**6. Aplicación Node.js No Inicia en Producción (PM2)**

- **Síntoma**: `pm2 start index.js` falla o el proceso entra en un ciclo de reinicio.
- **Causas Comunes y Soluciones**:
  - **Verificar Logs de PM2**: El primer paso es siempre revisar los logs detallados del proceso: `pm2 logs <nombre_o_id_del_proceso>`. Estos logs a menudo contienen el error exacto.
  - **Variables de Entorno Faltantes o Incorrectas**: Asegúrese de que todas las variables de entorno necesarias (`FIREFLIES_API_KEY`, `WEBHOOK_SECRET`, `SERVER_BASE_URL`, `PORT`, `NODE_ENV=production`) estén correctamente configuradas en el entorno del servidor de producción (ej. en el archivo `.env` si PM2 está configurado para leerlo, o en el entorno del sistema).
  - **Puerto en Uso**: El `PORT` especificado en `.env` podría estar siendo utilizado por otra aplicación en el servidor. Cambie el puerto o detenga la aplicación conflictiva.
  - **Problemas de Permisos**: El usuario bajo el cual PM2 intenta ejecutar la aplicación podría no tener los permisos necesarios para acceder a los archivos del proyecto o para escuchar en el puerto especificado (aunque los puertos > 1024 usualmente no requieren privilegios `root`).
  - **Dependencias No Instaladas**: Asegúrese de haber ejecutado `npm install --production` en el directorio del proyecto en el servidor.

---

**7. Errores 502 Bad Gateway o Similares en Producción (desde Nginx)**

- **Síntoma**: Al acceder a la URL pública de la aplicación (ej. `https://api.nevtis.com`), el navegador muestra un error "502 Bad Gateway".
- **Causas Comunes y Soluciones**:
  - **Aplicación Node.js (PM2) No Corriendo o Fallando**: Verifique el estado de su aplicación con `pm2 list`. Si no está online o tiene un alto número de reinicios, revise sus logs (`pm2 logs <nombre_app>`) para encontrar la causa raíz del fallo.
  - **Configuración Incorrecta de `proxy_pass` en Nginx**: La directiva `proxy_pass http://localhost:PORT;` en la configuración de Nginx debe apuntar al host y puerto correctos donde la aplicación Node.js está escuchando internamente (ej. `http://localhost:3001`).
  - **Firewall del Servidor**: Un firewall en el servidor podría estar bloqueando la comunicación entre Nginx y la aplicación Node.js en el puerto interno (aunque esto es menos común si ambos corren en la misma máquina).
  - **Errores en Nginx**: Revise los logs de error de Nginx (usualmente en `/var/log/nginx/error.log` o `/var/log/nginx/tu.dominio.publico.com.error.log`) para obtener más detalles sobre por qué Nginx no puede comunicarse con la aplicación backend.

---

**8. Problemas con HTTPS/SSL en Producción**

- **Síntoma**: Errores de conexión segura, advertencias de certificado en el navegador al acceder a la URL HTTPS.
- **Causas Comunes y Soluciones**:
  - **Certificado SSL No Instalado o Mal Configurado**: Verifique que el certificado SSL esté correctamente instalado, configurado en Nginx (rutas a `ssl_certificate` y `ssl_certificate_key`), y que no haya expirado. Herramientas como SSL Labs' SSL Test ([https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/)) pueden ayudar a diagnosticar problemas.
  - **Configuración de Firewall**: Asegúrese de que el firewall del servidor permita tráfico entrante en el puerto `443` (HTTPS).
  - **Contenido Mixto (Mixed Content)**: Si su aplicación (o un frontend asociado) sirve algunos recursos sobre HTTP mientras la página principal es HTTPS, esto puede causar advertencias. Asegúrese de que todos los activos se sirvan sobre HTTPS.

---

**9. Consejos Generales de Depuración:**

- **Priorizar la Revisión de Logs**: Son la fuente de información más valiosa.
  - Logs de la consola del servidor Node.js (o `pm2 logs <app-name>` en producción).
  - Logs de la consola de `ngrok` (para tráfico y respuestas en desarrollo local).
  - Logs de Nginx (`access.log` y `error.log`) en producción.
- **Verificar Variables de Entorno**: Doble y triple revisión de que todas las variables en `.env` (o equivalentes en producción) son correctas, no tienen espacios extra, y distinguen mayúsculas/minúsculas.
- **Validar URLs**: Asegurarse de que todas las URLs (`SERVER_BASE_URL`, URLs configuradas en Fireflies.ai, etc.) sean correctas, incluyan el esquema (`http://` o `https://`) apropiado, y no tengan errores tipográficos.
- **Probar Endpoints Individualmente**: Usar herramientas como Postman o `curl` para aislar y probar cada endpoint de la API puede ayudar a identificar dónde se origina un problema.
- **Simplificar**: Si se enfrenta a un problema complejo, intente simplificar temporalmente la configuración o el código para aislar la causa raíz. Por ejemplo, comente temporalmente la verificación de firma si sospecha que el problema está en el procesamiento del payload.
