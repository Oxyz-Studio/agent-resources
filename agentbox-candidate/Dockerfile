# Refund Support Agent — deploy on GMI AgentBox (CE managed). Serves /run on :8080.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
EXPOSE 8080
CMD ["node", "server.js"]
