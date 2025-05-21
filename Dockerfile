# Usar imagen oficial Node.js (versión LTS)
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código
COPY . .

# Exponer puerto que usa el servidor (3001 por defecto)
EXPOSE 3001

# Definir variable de entorno por defecto (se puede sobrescribir en k8s)
ENV PORT=3001

# Comando para iniciar la app
CMD ["node", "index.js"]
