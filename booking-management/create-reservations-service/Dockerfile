# Use the official Node.js image.
# https://hub.docker.com/_/node
FROM node:18

# Create and change to the app directory.
WORKDIR /app

# Install dependencies.
COPY package*.json ./
RUN npm install

# Copy the source code.
COPY . .

# Expose port 3008 for the service.
EXPOSE 3008

# Start the service.
CMD ["npm", "start"]
