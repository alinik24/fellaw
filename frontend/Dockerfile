# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 – builder: compile the React / Vite application
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifest files first so npm install is cached when source changes
COPY package.json package-lock.json* ./

RUN npm install --frozen-lockfile

# Copy the rest of the source and build for production
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 – runtime: serve the static build with nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove the default nginx placeholder page
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the SPA-aware nginx virtual-host config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
