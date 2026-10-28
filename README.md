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
