# ---------- Étape 1 : build Angular ----------
FROM node:24-alpine AS build

WORKDIR /app
# Dépendances d'abord : cette couche reste en cache tant que
# package-lock.json ne change pas.
COPY package.json package-lock.json ./
# --legacy-peer-deps : primeng 21 déclare encore Angular 21 en dépendance
# « peer » alors que le projet est en Angular 22 (fonctionne en pratique).
# À retirer dès qu'une version de primeng compatible Angular 22 sortira.
RUN npm ci --legacy-peer-deps

COPY . .
# URL de l'API et du service IA appelées par le navigateur : production par
# défaut, remplacées par docker-compose (args) pour un build local.
ARG API_URL=https://api.senlab.site/api
ARG IA_URL=https://ia.senlab.site/api
RUN printf "export const environment = {\n  apiUrl: '%s',\n  aiApiUrl: '%s',\n};\n" \
      "$API_URL" "$IA_URL" > src/environments/environment.docker.ts
RUN npx ng build --configuration docker


# ---------- Étape 2 : service par Nginx ----------
FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
