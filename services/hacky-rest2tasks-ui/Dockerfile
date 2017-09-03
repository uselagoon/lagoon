FROM amazeeiolagoon/centos7-node6
ENV NODE_ENV production
COPY package.json yarn.lock /app/
RUN BUILD_ONLY=true yarn install --pure-lockfile && yarn cache clean

COPY . /app

RUN yarn run build

CMD ["yarn", "start"]

EXPOSE 3000
