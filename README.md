# Fraldas Run Ayana Cecília 2026

Site de divulgação e confirmação de presença da corrida **Fraldas Run Ayana Cecília 2026**.

- **Data:** 13/12/2026, às 06h00
- **Local:** Bravus CrossBox (final da Boa Esperança, antes da Av. Paraíso)
- **Distâncias:** 3 km e 5 km

As confirmações são gravadas em uma **Planilha Google** (aba "Confirmações") por meio de um
Google Apps Script. A própria página mostra a tabela de atletas confirmados.

## Estrutura

```
index.html          Página principal
styles.css          Visual (tema roxo/lilás da arte da corrida)
script.js           Formulário e carregamento da lista
config.js           URL do Apps Script (você preenche)
apps-script/Code.gs Backend que grava na planilha
```

## Como publicar o backend (Google Sheets + Apps Script)

1. Crie uma planilha em <https://sheets.new> (ex.: "Fraldas Run 2026 - Inscrições").
2. No menu, abra **Extensões → Apps Script**.
3. Apague o conteúdo padrão e cole o conteúdo de `apps-script/Code.gs`. Salve.
4. Clique em **Implantar → Nova implantação**.
   - Tipo: **Aplicativo da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Clique em **Implantar**, autorize o acesso quando solicitado e copie a **URL do aplicativo da Web**
   (termina em `/exec`).
6. Abra `config.js` e cole essa URL em `APPS_SCRIPT_URL`.

A aba **Confirmações** é criada automaticamente na primeira confirmação.

> Se você alterar o `Code.gs`, faça uma **nova implantação** (ou gerencie a implantação atual com nova versão),
> senão o site continua usando a versão antiga.

## Rodando localmente

Basta abrir o `index.html` no navegador. Para testar sem problemas de CORS, use um servidor simples:

```bash
python3 -m http.server 8000
```

Depois acesse <http://localhost:8000>.

## Publicar o site

Como é um site estático, pode ser publicado com **GitHub Pages**:
Settings → Pages → Source: `main` / root.

## Regras de validação

- Nome completo (mínimo 3 caracteres)
- Telefone com DDD (10 a 13 dígitos)
- Modalidade 3 km ou 5 km
- Confirmação de entrega do pacote de fralda (obrigatória)
- Tamanho da fralda: P, M, G ou XG
- Mimo: opcional
- Um telefone só pode confirmar uma vez
