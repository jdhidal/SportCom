
FROM node:18

# Create and change to the app directory.
WORKDIR /app

# Install production dependencies.
COPY package*.json ./
RUN npm install

# Copy the rest of the application code.
COPY . .

# Expose the port the app runs on.
EXPOSE 3013

# Run the application.
CMD ["npm", "start"]