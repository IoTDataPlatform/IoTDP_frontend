FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm install; \
  fi

COPY . .

ARG VITE_IOTDP_BACKEND_URL
ENV VITE_IOTDP_BACKEND_URL=${VITE_IOTDP_BACKEND_URL}

RUN npm run build

FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]