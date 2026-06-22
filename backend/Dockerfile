FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
COPY patch-iracing-api.mjs ./
RUN npm ci && node patch-iracing-api.mjs
COPY . .
RUN npm run build

FROM node:20 AS runtime

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
