# Build stage for Frontend
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
RUN npm run build-only

# Final stage
FROM node:20-alpine
WORKDIR /app

# Install Nginx
RUN apk add --no-cache nginx

# Copy Backend and set permissions
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/
RUN chown -R node:node /app/server

# Copy Frontend build to Nginx directory
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf

# Script to start both Nginx and Node.js
# -g "daemon on;" đảm bảo nginx chạy ngầm để nhường foreground cho Node.js hiện log
RUN echo 'nginx -g "daemon on;" && cd /app/server && node index.js' > /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 80

CMD ["/bin/sh", "/app/start.sh"]
