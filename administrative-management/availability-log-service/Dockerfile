# Usa una imagen oficial de Node.js como base
FROM node:18

# Crea y establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación
COPY . .

# Exponer el puerto en el que la aplicación se ejecutará
EXPOSE 3016

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
