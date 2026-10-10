# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY next.config.js next-env.d.ts tsconfig.json tailwind.config.ts postcss.config.js ./
COPY public ./public
COPY src ./src
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/package.json /app/next.config.js ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next
USER node
EXPOSE 3001
CMD ["npx", "next", "start", "-p", "3001", "-H", "0.0.0.0"]
