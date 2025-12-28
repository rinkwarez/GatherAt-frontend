# ---------- Build stage ----------
FROM --platform=linux/amd64 node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production



# ---------- Runtime stage ----------
FROM --platform=linux/amd64 nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# SPA-friendly nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular output 
COPY --from=build /app/dist/gatherAt/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
