FROM node:18-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy server code
COPY . ./

# Expose the port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]