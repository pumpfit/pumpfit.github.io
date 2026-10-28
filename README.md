# Pump · treino em ritmo

App para personal trainers e seus alunos: treinos, agenda, evolução, mensalidades e chat.

- **Demonstração pública:** funciona direto no navegador (os dados ficam no aparelho de cada pessoa).
- **Versão completa (com servidor):** conta de treinador com senha protegida (hash scrypt), login com sessão segura e banco de dados SQLite.

## Rodar no computador

```bash
python server.py
```

Abra http://localhost:5173. Requer só Python 3.10+ (sem bibliotecas extras).

## Estrutura

- `index.html`, `css/`, `js/`: o app (HTML, CSS e JavaScript puros, sem build)
- `server.py`: servidor local e API
- `db.py`: banco de dados, senhas e sessões
- `brand/`: manual da marca e logos
- `Dockerfile`: para publicar em hospedagem com servidor

## No ar (servidor completo)
- https://pumpfit.pythonanywhere.com — PythonAnywhere grátis, conta Pumpfit. Banco em `~/dados/pump.db` (fora da pasta do site).
- Atualizar: no console Bash do PythonAnywhere, `cd ~/pump && git pull`, depois "Reload" na aba Web.
- Plano grátis: entrar 1 vez por mês na aba Web e clicar em "Run until 1 month from today", senão o site é desligado.
- https://pumpfit.github.io continua como vitrine; lá a conta fica só no aparelho.
