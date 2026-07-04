FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Garde cette ligne uniquement si tu as des fichiers dans public/
# (tu peux la supprimer tant que public est vide)
# COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]