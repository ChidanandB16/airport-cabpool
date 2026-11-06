# Stage 1: build the React UI
FROM node:20 AS ui
WORKDIR /ui
COPY frontend/ .
RUN npm install && npm run build

# Stage 2: Java server that also serves the built UI
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY . .
COPY --from=ui /ui/dist frontend/dist
ENV DEMO_OTP=1
CMD ["sh", "run.sh"]
