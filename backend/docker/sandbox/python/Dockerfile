FROM python:3.12-slim
WORKDIR /app
COPY runner.sh /runner.sh
RUN chmod +x /runner.sh
ENTRYPOINT ["bash", "/runner.sh"]
