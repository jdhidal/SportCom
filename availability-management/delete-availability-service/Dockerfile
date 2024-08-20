# Use Node.js image as base
FROM node:18

# Create and set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port and run the application
EXPOSE 3014
CMD ["npm", "start"]
