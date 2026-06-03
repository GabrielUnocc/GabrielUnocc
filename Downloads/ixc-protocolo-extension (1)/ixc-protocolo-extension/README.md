# IXC Protocolo Navigator v2 — Guia de Instalação

## O que faz
Extensão Chrome que lê a lista de protocolos do Google Sheets e, ao clicar
"Próximo", digita o protocolo automaticamente no **campo de busca do IXC Soft**
(`suporte.ixcsoft.com.br/atendente/`) e simula o Enter — exatamente como você
faria manualmente, só que em um clique.

---

## Passo 1 — Criar o Client ID OAuth no Google

Precisa ser feito **uma única vez**.

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto (ex: `ixc-protocolo`)
3. **APIs e Serviços → Biblioteca** → ative **Google Sheets API**
4. **APIs e Serviços → Credenciais → + Criar credenciais → ID do cliente OAuth**
5. Tipo de aplicativo: **Extensão do Chrome**
6. Cole o **ID da extensão** (você pega no Passo 3)
7. Copie o **Client ID** gerado (termina em `.apps.googleusercontent.com`)

---

## Passo 2 — Inserir o Client ID no manifest.json

Abra `manifest.json` e substitua:
```
"client_id": "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com"
```
Pelo Client ID real que você copiou.

---

## Passo 3 — Instalar no Chrome

1. Abra `chrome://extensions`
2. Ative **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `ixc-protocolo-extension`
5. Copie o **ID da extensão** exibido (string longa cinza) → use no Passo 1

---

## Passo 4 — Configurar

Clique no ícone da extensão e preencha:

| Campo | O que colocar |
|-------|--------------|
| ID da Planilha | Parte da URL do Sheets: `.../spreadsheets/d/`**ESSE_TRECHO**`/edit` |
| Aba | Nome da aba (ex: `Planilha1`) |
| Coluna | Letra da coluna com os protocolos (ex: `A`) |
| Linha inicial | `2` (para pular o cabeçalho) |

Clique em **Salvar configuração**.

---

## Passo 5 — Usar

1. Abra a página do IXC: `suporte.ixcsoft.com.br/atendente/`
2. Clique no ícone da extensão
3. Clique em **Entrar com Google** (só na primeira vez)
4. Clique **➡️ Próximo Protocolo**
   - A extensão digita o protocolo no campo de busca e dá Enter automaticamente
5. Faça o que precisa, depois clique **➡️ Próximo** novamente

O progresso é salvo — se fechar e reabrir a extensão, continua de onde parou.

---

## Estrutura esperada da planilha

| A (Protocolos) |
|----------------|
| OPA20263630414 |
| OPA20263629466 |
| OPA20263630596 |

A linha 1 é o cabeçalho (configure "Linha inicial: 2").

---

## Dúvidas

**A extensão funciona em qualquer aba?**
Sim, ela injeta no campo `input.list_select_input` de qualquer aba com o IXC aberto.

**E se o campo não for encontrado?**
Aparece um alerta na tela avisando. Verifique se está na página certa do IXC.

**Posso usar com outra planilha no meio do processo?**
Sim. Edite o ID da planilha, salve, e clique em 🔄 Recarregar.
