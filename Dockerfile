FROM node:16.14-alpine3.15

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalación limpia de dependencias
RUN npm ci

# Copiamos el resto del código
COPY . .

# Construimos el proyecto (genera la carpeta dist)
RUN npm run build

# EXPOSE es informativo, pero lo ponemos en 80 para que coincida con el Compose
EXPOSE 80

# Variable de entorno para que Express/Node sepa en qué puerto escuchar
ENV PORT_SERVER=80

CMD ["npm", "run", "prod"]