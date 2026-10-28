"""Servidor local do Pump: python server.py  ->  http://localhost:5173

Serve o app (arquivos) e a API do banco de dados (/api/...).
Só aceita conexões deste computador (127.0.0.1).
"""
import http.server
import json
import os
import re
import socketserver
import sys

import db

PORTA = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 5173
PASTA = os.path.dirname(os.path.abspath(__file__))
LIMITE = 16 * 1024  # corpo máximo de uma requisição


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".svg": "image/svg+xml",
        ".webmanifest": "application/manifest+json",
        ".json": "application/json",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PASTA, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store" if self.path.startswith("/api/") else "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Não registra o conteúdo das requisições (dados pessoais), só método, caminho e código.
        sys.stderr.write("%s %s\n" % (self.command, self.path.split("?")[0]))

    # ---------- arquivos ----------
    def do_GET(self):
        if self.path.startswith("/api/"):
            return self.api()
        caminho = self.path.split("?")[0]
        if re.search(r"(^|/)\.|\.(py|db|sqlite|wal|shm)$", caminho):
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        return self.api()

    def do_PATCH(self):
        return self.api()

    def do_DELETE(self):
        return self.api()

    # ---------- API ----------
    def responder(self, codigo, dados=None):
        corpo = json.dumps(dados if dados is not None else {}, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def corpo(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > LIMITE:
            raise ValueError("grande demais")
        if not n:
            return {}
        if "application/json" not in (self.headers.get("Content-Type") or ""):
            raise ValueError("formato")
        dados = json.loads(self.rfile.read(n).decode("utf-8"))
        if not isinstance(dados, dict):
            raise ValueError("formato")
        return dados

    # ---------- sessão (cookie HttpOnly: o JavaScript da página não lê) ----------
    COOKIE = "pump_sessao"

    def token(self):
        for parte in (self.headers.get("Cookie") or "").split(";"):
            k, _, v = parte.strip().partition("=")
            if k == self.COOKIE:
                return v
        return None

    def https(self):
        return (self.headers.get("X-Forwarded-Proto") or "").lower() == "https"

    def cookie(self, valor, idade):
        seguro = "; Secure" if self.https() else ""
        return f"{self.COOKIE}={valor}; Path=/; HttpOnly; SameSite=Strict; Max-Age={idade}{seguro}"

    def ip(self):
        return (self.headers.get("X-Forwarded-For") or self.client_address[0]).split(",")[0].strip()

    def origem_ok(self):
        # Ações que mudam dados só são aceitas vindas do próprio site (proteção contra CSRF).
        if self.command in ("GET", "HEAD"):
            return True
        origem = self.headers.get("Origin")
        if not origem:
            return True
        host = self.headers.get("X-Forwarded-Host") or self.headers.get("Host") or ""
        return origem.split("://", 1)[-1] == host

    def responder_cookie(self, codigo, dados, cookie):
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(corpo)

    def api(self):
        rota = self.path.split("?")[0].rstrip("/")
        m = self.command
        try:
            if not self.origem_ok():
                return self.responder(403, {"erro": "Origem não permitida."})

            # Conta e sessão
            if rota == "/api/treinadores" and m == "POST":
                t = db.criar_treinador(self.corpo())
                return self.responder_cookie(201, t, self.cookie(db.abrir_sessao(t["id"]), db.DURACAO))
            if rota == "/api/sessao" and m == "POST":
                d = self.corpo()
                tipo = "aluno" if d.get("tipo") == "aluno" else "treinador"
                try:
                    t = db.login(d.get("email"), d.get("senha"), self.ip(), tipo)
                except PermissionError as e:
                    return self.responder(429, {"erro": str(e)})
                sessao = db.abrir_sessao(aid=t["id"]) if tipo == "aluno" else db.abrir_sessao(t["id"])
                return self.responder_cookie(200, t, self.cookie(sessao, db.DURACAO))
            if rota == "/api/sessao" and m == "DELETE":
                db.fechar_sessao(self.token())
                return self.responder_cookie(200, {}, self.cookie("", 0))

            # Convite do aluno (o link é a única "chave"; vale 7 dias e uma vez só)
            r = re.fullmatch(r"/api/convite/([A-Za-z0-9_-]{16,64})", rota)
            if r and m == "GET":
                c = db.ler_convite(r[1])
                return self.responder(200, c) if c else self.responder(404, {"erro": "Convite inválido, vencido ou já usado."})
            if r and m == "POST":
                a = db.aceitar_convite(r[1], self.corpo())
                return self.responder_cookie(201, a, self.cookie(db.abrir_sessao(aid=a["id"]), db.DURACAO))

            tid = db.treinador_da_sessao(self.token())
            if rota == "/api/sessao" and m == "GET":
                if tid:
                    return self.responder(200, db.obter_treinador(tid) or {})
                aid = db.aluno_da_sessao(self.token())
                return self.responder(200, (db.obter_aluno(aid) if aid else None) or {})  # sem sessão: vazio
            if not tid:
                return self.responder(401, {"erro": "Entre na sua conta."})
            if rota == "/api/conta" and m == "DELETE":
                db.excluir_treinador(tid)
                return self.responder_cookie(200, {}, self.cookie("", 0))

            # Possíveis clientes (sempre do treinador logado)
            if rota == "/api/clientes" and m == "GET":
                return self.responder(200, db.listar_clientes(tid))
            if rota == "/api/clientes" and m == "POST":
                return self.responder(201, db.criar_cliente(tid, self.corpo()))
            r = re.fullmatch(r"/api/clientes/(\d+)", rota)
            if r and m == "PATCH":
                return self.responder(200, db.mudar_status(tid, int(r[1]), self.corpo().get("status")))
            if r and m == "DELETE":
                db.excluir_cliente(tid, int(r[1]))
                return self.responder(204)

            # Contas de aluno (o personal convida; só vê os próprios alunos)
            if rota == "/api/alunos" and m == "GET":
                return self.responder(200, db.listar_alunos_contas(tid))
            if rota == "/api/alunos" and m == "POST":
                return self.responder(201, db.criar_aluno_conta(tid, self.corpo()))
            r = re.fullmatch(r"/api/alunos/(\d+)/convite", rota)
            if r and m == "POST":
                return self.responder(200, db.renovar_convite(tid, int(r[1])))
            r = re.fullmatch(r"/api/alunos/(\d+)", rota)
            if r and m == "DELETE":
                db.excluir_aluno_conta(tid, int(r[1]))
                return self.responder(204)
            return self.responder(404, {"erro": "Rota não encontrada."})
        except db.ErroValidacao as e:
            return self.responder(422, {"erros": e.erros})
        except LookupError:
            return self.responder(404, {"erro": "Não encontrado."})
        except (ValueError, json.JSONDecodeError):
            return self.responder(400, {"erro": "Requisição inválida."})
        except Exception as e:  # erro inesperado: não vaza detalhes para a tela
            sys.stderr.write("ERRO %r\n" % e)
            return self.responder(500, {"erro": "Erro interno. Tente de novo."})


class Servidor(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    db.iniciar()
    host = os.environ.get("HOST", "127.0.0.1")  # na hospedagem, HOST=0.0.0.0 e PORT vem do serviço
    PORTA = int(os.environ.get("PORT", PORTA))
    with Servidor((host, PORTA), Handler) as srv:
        print(f"Pump rodando em http://localhost:{PORTA}  ·  banco: {os.path.abspath(db.ARQUIVO)}", flush=True)
        srv.serve_forever()
