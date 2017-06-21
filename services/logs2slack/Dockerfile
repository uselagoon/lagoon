FROM amazeeio/centos7-node:node6

# Use changes to package.json and yarn.lock to see if Docker should use cached nodejs deps
COPY package.json yarn.lock /app/

# Telling yarn and node that we are gonna be production
 ENV NODE_ENV production

# Now copy in our application code.
COPY . /app

# run yarn install and remove the .yarn-cache as we don't need that on our image
RUN yarn install --pure-lockfile && rm -rf $HOME/.cache/yarn

# building our node app
RUN yarn run build

# Fixing permissions of the app folder so that the openshift user can access it with write
RUN chmod g+rw -R /app

CMD bash -c "yarn run start"

EXPOSE 7777
