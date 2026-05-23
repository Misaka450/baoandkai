FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine AS app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-builder /app/server/dist ./server
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
RUN mkdir -p /app/uploads
EXPOSE 3001
CMD ["node", "server/index.js"]

FROM nginx:alpine AS nginx
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /app/uploads
EXPOSE 80
