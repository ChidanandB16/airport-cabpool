FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY . .
ENV DEMO_OTP=1
CMD ["sh", "run.sh"]
