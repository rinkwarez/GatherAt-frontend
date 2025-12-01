# ---------- STAGE 1: Build Angular app ----------
FROM node:20-alpine AS build

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
RUN npm run build

# ---------- STAGE 2: Serve with Nginx ----------
FROM nginx:alpine

# Copy built Angular app from previous stage
# IMPORTANT: Replace `your-angular-app-name` with the folder name inside `dist/`
# Example: If you see dist/gather-at, use `gather-at`.
COPY --from=build /app/dist/gatherAt /usr/share/nginx/html

# Expose port 80 for the container
EXPOSE 80

# Nginx default command
CMD ["nginx", "-g", "daemon off;"]
