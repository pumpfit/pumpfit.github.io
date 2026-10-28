"""Banco de dados do Pump (SQLite): treinadores e possíveis clientes.

O arquivo fica em ../dados/pump.db, FORA da pasta que o servidor publica,
então ninguém baixa o banco pelo navegador. Toda entrada é conferida aqui,
no servidor, mesmo que a tela já tenha conferido.
"""
import base64
import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import threading
import time
from contextlib import closing

# Na hospedagem, PUMP_DADOS aponta para um disco que não se apaga a cada atualização.
PASTA = os.environ.get("PUMP_DADOS") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dados")
ARQUIVO = os.path.join(PASTA, "pump.db")

ESQUEMA = """
CREATE TABLE IF NOT EXISTS treinadores (
  id            INTEGER PRIMARY KEY,
  nome          TEXT NOT NULL CHECK (length(nome) BETWEEN 5 AND 120),
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(email) <= 160),
  telefone      TEXT NOT NULL CHECK (length(telefone) IN (10, 11)),
  cpf           TEXT NOT NULL UNIQUE CHECK (length(cpf) = 11),
  aceite_lgpd   TEXT NOT NULL,
  senha_hash    TEXT NOT NULL,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessoes (
  token_hash    TEXT PRIMARY KEY,
  treinador_id  INTEGER NOT NULL REFERENCES treinadores(id) ON DELETE CASCADE,
  expira_em     INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS clientes (
  id            INTEGER PRIMARY KEY,
  treinador_id  INTEGER NOT NULL REFERENCES treinadores(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL CHECK (length(nome) BETWEEN 2 AND 120),
  email         TEXT COLLATE NOCASE CHECK (email IS NULL OR length(email) <= 160),
  telefone      TEXT NOT NULL CHECK (length(telefone) IN (10, 11)),
  cpf           TEXT CHECK (cpf IS NULL OR length(cpf) = 11),
  objetivo      TEXT CHECK (objetivo IS NULL OR length(objetivo) <= 80),
  status        TEXT NOT NULL DEFAULT 'interessado'
                CHECK (status IN ('interessado', 'experimental', 'aluno', 'desistiu')),
  observacao    TEXT CHECK (observacao IS NULL OR length(observacao) <= 500),
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (treinador_id, telefone)
);
CREATE INDEX IF NOT EXISTS idx_clientes_treinador ON clientes (treinador_id, status);
CREATE INDEX IF NOT EXISTS idx_sessoes_treinador ON sessoes (treinador_id);
"""

STATUS = ("interessado", "experimental", "aluno", "desistiu")
OBJETIVOS = ("Emagrecer", "Ganhar massa", "Condicionamento", "Saúde e postura", "Definição", "Outro")


class ErroValidacao(Exception):
    def __init__(self, erros):
        super().__init__("dados inválidos")
        self.erros = erros


def conectar():
    os.makedirs(PASTA, exist_ok=True)
    con = sqlite3.connect(ARQUIVO, timeout=5)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    con.execute("PRAGMA journal_mode = WAL")
    return con


def iniciar():
    with closing(conectar()) as con:
        con.executescript(ESQUEMA)
        colunas = {r["name"] for r in con.execute("PRAGMA table_info(treinadores)")}
        if "senha_hash" not in colunas:  # banco antigo, sem senha: recomeça a tabela (só havia teste)
            con.executescript("DROP TABLE IF EXISTS clientes; DROP TABLE IF EXISTS treinadores;")
            con.executescript(ESQUEMA)
        con.execute("DELETE FROM sessoes WHERE expira_em < ?", (int(time.time()),))
        con.commit()


# ---------- senha: só a "impressão digital" (scrypt + sal aleatório) é guardada ----------
# Formato: scrypt$N$r$p$sal$hash. Mesmo com o arquivo do banco em mãos, não dá para recuperar a senha.
N, R, P_ = 2 ** 15, 8, 1


def gerar_hash(senha):
    sal = secrets.token_bytes(16)
    h = hashlib.scrypt(senha.encode("utf-8"), salt=sal, n=N, r=R, p=P_, dklen=32, maxmem=64 * 1024 * 1024)
    b64 = lambda b: base64.b64encode(b).decode()
    return f"scrypt${N}${R}${P_}${b64(sal)}${b64(h)}"


def conferir_senha(senha, guardado):
    try:
        _, n, r, p, sal, h = guardado.split("$")
        calc = hashlib.scrypt(senha.encode("utf-8"), salt=base64.b64decode(sal), n=int(n), r=int(r), p=int(p),
                              dklen=32, maxmem=64 * 1024 * 1024)
        return hmac.compare_digest(calc, base64.b64decode(h))
    except Exception:
        return False


FALSO = gerar_hash(secrets.token_hex(16))  # usado quando o e-mail não existe, para o tempo de resposta ser igual


def regra_senha(senha, email="", cpf=""):
    if not isinstance(senha, str) or len(senha) < 8:
        return "A senha precisa ter pelo menos 8 caracteres."
    if len(senha) > 128:
        return "A senha pode ter no máximo 128 caracteres."
    if not re.search(r"[A-Za-zÀ-ÿ]", senha) or not re.search(r"\d", senha):
        return "Use letras e números na senha."
    baixa = senha.lower()
    if (email and email.split("@")[0] and email.split("@")[0].lower() in baixa) or (cpf and cpf in senha) or baixa in ("12345678", "senha123", "password1", "abcd1234"):
        return "Senha fácil demais. Evite e-mail, CPF ou sequências."
    return None


# ---------- sessões: o navegador guarda um código aleatório; o banco guarda só o hash dele ----------
DURACAO = 7 * 24 * 3600


def _h(token):
    return hashlib.sha256(token.encode()).hexdigest()


def abrir_sessao(tid):
    token = secrets.token_urlsafe(32)
    with closing(conectar()) as con:
        con.execute("INSERT INTO sessoes (token_hash, treinador_id, expira_em) VALUES (?, ?, ?)",
                    (_h(token), tid, int(time.time()) + DURACAO))
        con.commit()
    return token


def treinador_da_sessao(token):
    if not token or len(token) > 100:
        return None
    with closing(conectar()) as con:
        r = con.execute("SELECT treinador_id FROM sessoes WHERE token_hash = ? AND expira_em > ?",
                        (_h(token), int(time.time()))).fetchone()
        return r["treinador_id"] if r else None


def fechar_sessao(token):
    if not token:
        return
    with closing(conectar()) as con:
        con.execute("DELETE FROM sessoes WHERE token_hash = ?", (_h(token),))
        con.commit()


# ---------- bloqueio contra tentativa de adivinhar senha ----------
_falhas = {}
_trava = threading.Lock()
MAX_FALHAS, JANELA = 5, 15 * 60


def bloqueado(chave):
    with _trava:
        f = [t for t in _falhas.get(chave, []) if time.time() - t < JANELA]
        _falhas[chave] = f
        return len(f) >= MAX_FALHAS


def registrar_falha(chave):
    with _trava:
        _falhas.setdefault(chave, []).append(time.time())


def limpar_falhas(chave):
    with _trava:
        _falhas.pop(chave, None)


def login(email, senha, ip):
    email = texto(email, 160).lower()
    chaves = ("ip:" + ip, "email:" + email)
    if any(bloqueado(c) for c in chaves):
        raise PermissionError("Muitas tentativas. Espere 15 minutos e tente de novo.")
    with closing(conectar()) as con:
        r = con.execute("SELECT * FROM treinadores WHERE email = ?", (email,)).fetchone()
    ok = conferir_senha(str(senha or ""), r["senha_hash"] if r else FALSO)
    if not (r and ok):
        for c in chaves:
            registrar_falha(c)
        raise ErroValidacao({"geral": "E-mail ou senha incorretos."})
    for c in chaves:
        limpar_falhas(c)
    return publico_treinador(r)


# ---------- validação ----------
def digitos(v):
    return re.sub(r"\D", "", str(v or ""))


def cpf_valido(cpf):
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    for n in (9, 10):
        soma = sum(int(cpf[i]) * (n + 1 - i) for i in range(n))
        dv = (soma * 10) % 11 % 10
        if dv != int(cpf[n]):
            return False
    return True


EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def texto(v, limite):
    v = re.sub(r"\s+", " ", str(v or "")).strip()
    return v[:limite]


def validar_pessoa(d, *, cpf_obrigatorio, email_obrigatorio, nome_completo):
    erros = {}
    nome = texto(d.get("nome"), 120)
    if nome_completo and len(nome.split(" ")) < 2:
        erros["nome"] = "Informe nome e sobrenome."
    elif len(nome) < 2:
        erros["nome"] = "Informe o nome."
    email = texto(d.get("email"), 160).lower() or None
    if email_obrigatorio and not email:
        erros["email"] = "Informe o e-mail."
    elif email and not EMAIL.match(email):
        erros["email"] = "E-mail inválido."
    tel = digitos(d.get("telefone"))
    if len(tel) not in (10, 11) or not (11 <= int(tel[:2] or 0) <= 99):
        erros["telefone"] = "Telefone com DDD, ex.: (11) 98765-4321."
    cpf = digitos(d.get("cpf")) or None
    if cpf_obrigatorio and not cpf:
        erros["cpf"] = "Informe o CPF."
    elif cpf and not cpf_valido(cpf):
        erros["cpf"] = "CPF inválido."
    return erros, {"nome": nome, "email": email, "telefone": tel, "cpf": cpf}


# ---------- formatação para a tela (CPF sempre mascarado) ----------
def mascara_cpf(cpf):
    return f"***.***.{cpf[6:9]}-{cpf[9:]}" if cpf else None


def fmt_tel(t):
    return f"({t[:2]}) {t[2:7]}-{t[7:]}" if len(t) == 11 else f"({t[:2]}) {t[2:6]}-{t[6:]}"


def publico_treinador(r):
    return {"id": r["id"], "nome": r["nome"], "email": r["email"], "telefone": fmt_tel(r["telefone"]),
            "cpf": mascara_cpf(r["cpf"]), "criado_em": r["criado_em"]}


def publico_cliente(r):
    return {"id": r["id"], "nome": r["nome"], "email": r["email"], "telefone": fmt_tel(r["telefone"]),
            "whats": "55" + r["telefone"], "cpf": mascara_cpf(r["cpf"]), "objetivo": r["objetivo"],
            "status": r["status"], "observacao": r["observacao"], "criado_em": r["criado_em"]}


# ---------- treinadores ----------
def criar_treinador(d):
    erros, p = validar_pessoa(d, cpf_obrigatorio=True, email_obrigatorio=True, nome_completo=True)
    erro_senha = regra_senha(d.get("senha"), p["email"] or "", p["cpf"] or "")
    if erro_senha:
        erros["senha"] = erro_senha
    elif d.get("senha") != d.get("confirmacao"):
        erros["confirmacao"] = "As senhas não são iguais."
    if d.get("aceite") is not True:
        erros["aceite"] = "É preciso aceitar os termos e a política de privacidade."
    if erros:
        raise ErroValidacao(erros)
    with closing(conectar()) as con:
        try:
            cur = con.execute(
                "INSERT INTO treinadores (nome, email, telefone, cpf, aceite_lgpd, senha_hash) VALUES (?, ?, ?, ?, datetime('now'), ?)",
                (p["nome"], p["email"], p["telefone"], p["cpf"], gerar_hash(d["senha"])))
            con.commit()
        except sqlite3.IntegrityError as e:
            campo = "email" if "email" in str(e) else "cpf"
            raise ErroValidacao({campo: "Já existe um cadastro com este " + ("e-mail." if campo == "email" else "CPF.")})
        return publico_treinador(con.execute("SELECT * FROM treinadores WHERE id = ?", (cur.lastrowid,)).fetchone())


def obter_treinador(tid):
    with closing(conectar()) as con:
        r = con.execute("SELECT * FROM treinadores WHERE id = ?", (tid,)).fetchone()
        return publico_treinador(r) if r else None


def excluir_treinador(tid):
    with closing(conectar()) as con:
        n = con.execute("DELETE FROM treinadores WHERE id = ?", (tid,)).rowcount
        con.commit()
        return n > 0


# ---------- clientes ----------
def _cliente_dados(d, parcial=False):
    erros, p = validar_pessoa(d, cpf_obrigatorio=False, email_obrigatorio=False, nome_completo=False)
    obj = texto(d.get("objetivo"), 80) or None
    if obj and obj not in OBJETIVOS:
        erros["objetivo"] = "Objetivo inválido."
    status = d.get("status") or "interessado"
    if status not in STATUS:
        erros["status"] = "Situação inválida."
    obs = texto(d.get("observacao"), 500) or None
    if erros:
        raise ErroValidacao(erros)
    return {**p, "objetivo": obj, "status": status, "observacao": obs}


def criar_cliente(tid, d):
    c = _cliente_dados(d)
    with closing(conectar()) as con:
        if not con.execute("SELECT 1 FROM treinadores WHERE id = ?", (tid,)).fetchone():
            raise LookupError("treinador")
        try:
            cur = con.execute(
                "INSERT INTO clientes (treinador_id, nome, email, telefone, cpf, objetivo, status, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (tid, c["nome"], c["email"], c["telefone"], c["cpf"], c["objetivo"], c["status"], c["observacao"]))
            con.commit()
        except sqlite3.IntegrityError:
            raise ErroValidacao({"telefone": "Você já tem um cliente com este telefone."})
        return publico_cliente(con.execute("SELECT * FROM clientes WHERE id = ?", (cur.lastrowid,)).fetchone())


def listar_clientes(tid):
    with closing(conectar()) as con:
        rs = con.execute("SELECT * FROM clientes WHERE treinador_id = ? ORDER BY datetime(criado_em) DESC, id DESC", (tid,)).fetchall()
        return [publico_cliente(r) for r in rs]


def mudar_status(tid, cid, status):
    if status not in STATUS:
        raise ErroValidacao({"status": "Situação inválida."})
    with closing(conectar()) as con:
        n = con.execute("UPDATE clientes SET status = ?, atualizado_em = datetime('now') WHERE id = ? AND treinador_id = ?",
                        (status, cid, tid)).rowcount
        con.commit()
        if not n:
            raise LookupError("cliente")
        return publico_cliente(con.execute("SELECT * FROM clientes WHERE id = ?", (cid,)).fetchone())


def excluir_cliente(tid, cid):
    with closing(conectar()) as con:
        n = con.execute("DELETE FROM clientes WHERE id = ? AND treinador_id = ?", (cid, tid)).rowcount
        con.commit()
        if not n:
            raise LookupError("cliente")
