# Pump: imagem para publicar em qualquer hospedagem que aceite Docker (Railway, Fly.io, Render).
FROM python:3.13-slim
WORKDIR /app
COPY . .
ENV HOST=0.0.0.0 PORT=8080 PUMP_DADOS=/data PYTHONUNBUFFERED=1
RUN mkdir -p /data && useradd -r pump && chown pump /data
USER pump
EXPOSE 8080
VOLUME ["/data"]
CMD ["python", "server.py"]
