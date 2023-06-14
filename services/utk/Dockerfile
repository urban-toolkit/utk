# pull official base image
FROM --platform=linux/amd64 node:18-alpine

# set working directory
WORKDIR /usr/src/utk

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/utk/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json .
COPY package-lock.json .
RUN npm ci

# start app
CMD ["npm", "run", "watch"]