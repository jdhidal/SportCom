# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the rest of your application code
COPY . .

# Make port 3011 available to the world outside this container
EXPOSE 3011

# Run the application
CMD ["npm", "start"]
