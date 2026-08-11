# Stage 1: Build static assets
FROM node:20-alpine AS build-stage

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .

# Declare environment variables as build arguments to compile them into Vite static assets
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

# Stage 2: Serve using Nginx Alpine
FROM nginx:alpine

# Copy built dist files
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy SPA Nginx configurations
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
