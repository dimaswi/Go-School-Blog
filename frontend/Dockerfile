# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (npm install used instead of ci to bypass lockfile sync issues)
RUN npm install

# Copy the rest of the application
COPY . .

# Pass build args if needed (e.g. VITE_API_URL can be provided via docker-compose build args)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN npm run build

# Final stage - nginx
FROM nginx:alpine

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
