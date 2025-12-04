# ---------- STAGE 1: Build Angular app ----------
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build Angular app for production
# If you use a specific config, you can do:
# RUN npm run build -- --configuration production
EXPOSE 4200

CMD ["npm", "start"]
