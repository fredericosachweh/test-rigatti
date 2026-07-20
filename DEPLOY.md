# Deploy — Modena SPO (Render + Vercel + MongoDB Atlas + Cloudinary)

Instância de **staging** em subdomínio para o cliente cadastrar as motos reais.

- **Frontend:** `https://demo.modenaspo.com.br` (Vercel)
- **API:** `https://api-demo.modenaspo.com.br` (Render)
- **Banco:** MongoDB Atlas · **Fotos:** Cloudinary (persistente)

> Depois de validado, é só apontar o domínio raiz para os mesmos serviços.

---

## 1. Banco — MongoDB Atlas (grátis)

1. Cluster **M0** em https://www.mongodb.com/atlas
2. **Database Access** → cria usuário/senha
3. **Network Access** → libera `0.0.0.0/0`
4. **Connect → Drivers** → copia a string (inclua `/modena_spo` como banco):
   `mongodb+srv://USUARIO:SENHA@cluster0.xxxx.mongodb.net/modena_spo?retryWrites=true&w=majority`
   → é o `MONGODB_URI`.

## 2. Fotos — Cloudinary (grátis)

1. Cria conta em https://cloudinary.com
2. No **Dashboard**, copia: `Cloud name`, `API Key`, `API Secret`
   → viram `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

> Com essas 3 definidas, todo upload do admin vai para o Cloudinary (permanente, via CDN). Sem elas, a API cai no disco local (efêmero) — por isso são **obrigatórias** na nuvem.

## 3. API — Render

1. https://render.com → **New → Blueprint** apontando para o repositório (lê o `render.yaml`).
2. **Environment** → defina:
   - `MONGODB_URI` (Atlas)
   - `JWT_SECRET` (uma string aleatória longa)
   - `AI_PROVIDER` = `anthropic` (ou `openai`)
   - `ANTHROPIC_API_KEY` (ou `OPENAI_API_KEY`)
   - `CLIENT_URL` = `https://demo.modenaspo.com.br`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
3. Deploy → sobe em `https://modena-api.onrender.com`.
4. **Settings → Custom Domain** → adiciona `api-demo.modenaspo.com.br` (o Render mostra o CNAME alvo).

> ⏱️ O free do Render hiberna após ~15 min sem uso (cold start ~30–50s na 1ª chamada). Para staging, tudo bem.

## 4. Frontend — Vercel

1. https://vercel.com → **Add New → Project**, importa o repositório (lê o `vercel.json`).
2. **Environment Variables** → `VITE_API_URL` = `https://api-demo.modenaspo.com.br`
3. Deploy → sobe em `https://<projeto>.vercel.app`.
4. **Settings → Domains** → adiciona `demo.modenaspo.com.br` (a Vercel mostra o CNAME).

## 5. DNS (painel do domínio)

| Nome/Host | Tipo | Valor |
|---|---|---|
| `demo` | **CNAME** | `cname.vercel-dns.com` (use o que a Vercel exibir) |
| `api-demo` | **CNAME** | `modena-api.onrender.com` (use o que o Render exibir) |

- HTTPS é emitido automaticamente após o DNS propagar.

## 6. Dados iniciais (importante!)

O comando de seed **apaga todo o banco** (`deleteMany`) antes de inserir os exemplos. Escolha:

- **Começar vazio** (recomendado p/ cadastro real): **não rode o seed**. O cliente cadastra as motos do zero.
- **Começar com exemplos**: rode **uma única vez, antes** de qualquer cadastro:
  ```bash
  MONGODB_URI="<string-do-atlas>" npm run seed -w api
  ```

> ⛔ **Nunca rode o seed depois** que o cliente começar a cadastrar — ele zera tudo.

Usuário admin (se rodar o seed): `admin@modenaspo.com.br` / `123456`.
Sem seed, crie o admin pela tela de **Registro** (Admin — criar nova unidade).

## 7. Checklist

- [ ] Atlas: cluster, IP liberado, `MONGODB_URI`
- [ ] Cloudinary: 3 credenciais
- [ ] Render: envs completas, domínio `api-demo.` adicionado
- [ ] Vercel: `VITE_API_URL`, domínio `demo.` adicionado
- [ ] DNS: CNAME `demo` e `api-demo`
- [ ] Abrir `https://demo.modenaspo.com.br` → cadastrar motos (fotos vão pro Cloudinary)
