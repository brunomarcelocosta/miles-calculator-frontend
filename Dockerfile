# ---------- Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_WHATSAPP_NUMBER
ARG VITE_PUBLIC_APP_URL
ARG VITE_GTM_ID
ARG VITE_META_PIXEL_ID

RUN npm run build

# ---------- Production ----------
FROM nginx:alpine AS runner

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Config custom para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos do build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
