# Usa una imagen base de Node.js
FROM node:18

# Crea un directorio para la aplicación
WORKDIR /app

# Copia los archivos de package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Expon el puerto en el que se ejecutará la aplicación
EXPOSE 3012

# Define el comando para ejecutar la aplicación
CMD ["npm", "start"]
