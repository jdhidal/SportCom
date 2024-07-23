# Use the official Node.js image.
FROM node:18

# Create and change to the app directory.
WORKDIR /app

# Copy the package.json and package-lock.json files.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy the rest of the application code.
COPY . .

# Expose the application port.
EXPOSE 3010

# Start the application.
CMD ["npm", "start"]