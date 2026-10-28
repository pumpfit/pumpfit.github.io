"""Ponte para hospedagens WSGI (ex.: PythonAnywhere): roda o mesmo Handler do server.py.

No PythonAnywhere, o arquivo WSGI do site só precisa de:
    import sys; sys.path.insert(0, "/home/<usuario>/pumpfit.github.io")
    from wsgi import application
O banco fica em ../dados (fora da pasta pública) ou em PUMP_DADOS.
"""
import email.message
import io

import db
import server

db.iniciar()


class _Pedido(server.Handler):
    """Um pedido WSGI vestido de pedido do http.server: a resposta é guardada em vez de ir para um socket."""

    def __init__(self, environ):  # não chama o __init__ do http.server (não há socket)
        self.directory = server.PASTA
        self.command = environ["REQUEST_METHOD"]
        consulta = environ.get("QUERY_STRING")
        self.path = (environ.get("PATH_INFO") or "/") + ("?" + consulta if consulta else "")
        self.request_version = "HTTP/1.1"
        self.client_address = (environ.get("REMOTE_ADDR") or "", 0)
        self.headers = email.message.Message()
        for k, v in environ.items():
            if k.startswith("HTTP_"):
                self.headers[k[5:].replace("_", "-").title()] = v
        for k in ("CONTENT_TYPE", "CONTENT_LENGTH"):
            if environ.get(k):
                self.headers[k.replace("_", "-").title()] = environ[k]
        if environ.get("wsgi.url_scheme") == "https" and not self.headers.get("X-Forwarded-Proto"):
            self.headers["X-Forwarded-Proto"] = "https"  # cookie com Secure
        self.rfile = environ["wsgi.input"]
        self.wfile = io.BytesIO()
        self._headers_buffer = []
        self.status = 500
        self.saida = []

    def send_response(self, code, message=None):
        self.status = code

    def send_header(self, chave, valor):
        self.saida.append((chave, str(valor)))

    def flush_headers(self):
        self._headers_buffer = []


FRASES = {200: "OK", 201: "Created", 204: "No Content", 304: "Not Modified", 400: "Bad Request", 401: "Unauthorized",
          403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed", 422: "Unprocessable Entity",
          429: "Too Many Requests", 500: "Internal Server Error"}


def application(environ, start_response):
    p = _Pedido(environ)
    metodo = getattr(p, "do_" + p.command, None)
    if metodo is None or p.command == "HEAD":
        p.send_error(405) if metodo is None else p.do_GET()
    else:
        metodo()
    corpo = p.wfile.getvalue()
    if p.command == "HEAD":
        corpo = b""
    start_response(f"{p.status} {FRASES.get(p.status, 'OK')}", p.saida)
    return [corpo]
