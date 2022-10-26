# Base image
FROM node:14

# Create app directory
WORKDIR /usr/src

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

COPY ./src /usr/src/src
COPY ./.babelrc /usr/src/.babelrc
COPY .eslintrc /usr/src/.eslintrc
COPY ./tsconfig.json /usr/src/tsconfig.json

# Creates a "dist" folder with the production build
RUN npm run build

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
