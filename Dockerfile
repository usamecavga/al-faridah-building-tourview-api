FROM node:lts-alpine as builder

WORKDIR /api

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY ./ .

RUN yarn
RUN cp .env.production .env

EXPOSE 8055

CMD ["pm2", "start"]
