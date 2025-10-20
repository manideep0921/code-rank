FROM gcc:13
WORKDIR /app
COPY runner.sh /runner.sh
RUN chmod +x /runner.sh
ENTRYPOINT ["bash", "/runner.sh"]
