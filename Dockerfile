# Obtinem imaginea de Alpine Linux cu NodeJS pre-instalat
FROM node:slim

# Setam directorul in care o sa fie copiate fisierele aplicatiei noastre
WORKDIR /nodejs-homework-template-master

# Copiem din folderul nostru, in folderul din container
COPY . .

# Instalam pachetele npm
RUN npm install

# Pornim aplicatia
ENTRYPOINT npm run start

# COMENZI DE RULAT IN TERMINAL:

# Build the image, run in terminal:
# docker build -t contacts-app .

# Run the image
# docker run -dp 127.0.0.1:3000:3000 contacts-app