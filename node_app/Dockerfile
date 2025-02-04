FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

RUN chmod +X start.sh

CMD ["sh", "./start.sh"]