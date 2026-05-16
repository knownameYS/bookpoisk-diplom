FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma
COPY src ./src

RUN npm install
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "start"]
