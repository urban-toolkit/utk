# pull official base image
FROM node:18-alpine

# set working directory
WORKDIR /usr/src/utk-frontend

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/utk-frontend/node_modules/.bin:$PATH

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/utk-frontend/src/utk-map/ts/node_modules/.bin:$PATH

# # install and cache app dependencies
# COPY package.json .
# COPY package-lock.json .
# RUN npm ci
# # RUN npm i --package-lock-only
# # RUN npm install react-scripts@5.0.1 -g --silent

# # start app
# CMD ["npm", "start"]
# # CMD ["tail", "-f", "/dev/null"]