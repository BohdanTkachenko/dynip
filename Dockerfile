FROM node:18 as builder
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY index.d.ts ./
COPY src ./src
RUN npm run build

FROM node:18 as cleaner
WORKDIR /usr/app
COPY --from=builder /usr/app/package*.json ./
COPY --from=builder /usr/app/dist ./dist
RUN npm install --only=production --ignore-scripts

FROM gcr.io/distroless/nodejs:18
WORKDIR /usr/app
COPY --from=cleaner /usr/app ./
ENV NODE_ENV=production
CMD ["dist/app.js", "-c", "/config/config.yaml"]