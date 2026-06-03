// popup.js v2
const $ = id => document.getElementById(id);

let state = { token: null, protocolos: [], index: 0 };

// ── Mensagens ──────────────────────────────────────────────
function msg(txt, tipo) {
  const el = $('msg');
  el.textContent = txt;
  el.className = txt ? `msg show-${tipo}` : 'msg';
}
function clearMsg() { msg('', ''); }

// ── Seções ─────────────────────────────────────────────────
function show(auth, nav) {
  $('sec-auth').style.display = auth ? 'block' : 'none';
  $('sec-nav').style.display  = nav  ? 'block' : 'none';
}

// ── UI do navegador ────────────────────────────────────────
function updateNav() {
  const total = state.protocolos.length;
  const i     = state.index;
  const proto = total > 0 ? state.protocolos[i] : '—';

  $('txt-proto').textContent = proto;
  $('txt-cur').textContent   = total > 0 ? i + 1  : '—';
  $('txt-tot').textContent   = total > 0 ? total   : '—';

  const pct = total > 0 ? Math.round(((i + 1) / total) * 100) : 0;
  $('bar').style.width = pct + '%';

  $('btn-next').disabled = i >= total - 1;
  $('btn-prev').disabled = i <= 0;

  const badge = $('badge');
  if (total === 0) {
    badge.textContent = 'Vazio'; badge.className = 'badge badge-err';
  } else if (i >= total - 1) {
    badge.textContent = 'Concluído'; badge.className = 'badge badge-end';
  } else {
    badge.textContent = 'Pronto'; badge.className = 'badge badge-ok';
  }
}

// ── Config ─────────────────────────────────────────────────
function carregarConfig() {
  chrome.storage.local.get(
    ['sheetId','sheetName','sheetCol','startRow'],
    d => {
      $('inp-sheet-id').value   = d.sheetId   || '';
      $('inp-sheet-name').value = d.sheetName || 'Planilha1';
      $('inp-sheet-col').value  = d.sheetCol  || 'A';
      $('inp-start-row').value  = d.startRow  || '2';
    }
  );
}

function salvarConfig() {
  const cfg = {
    sheetId:   $('inp-sheet-id').value.trim(),
    sheetName: $('inp-sheet-name').value.trim() || 'Planilha1',
    sheetCol:  $('inp-sheet-col').value.trim().toUpperCase() || 'A',
    startRow:  parseInt($('inp-start-row').value.trim()) || 2,
  };
  if (!cfg.sheetId) { msg('Informe o ID da planilha.', 'error'); return; }
  chrome.storage.local.set(cfg, () => {
    msg('Configuração salva!', 'ok');
    setTimeout(clearMsg, 2000);
  });
}

// ── Auth ───────────────────────────────────────────────────
function getToken(interactive, cb) {
  chrome.identity.getAuthToken({ interactive }, token => {
    cb(chrome.runtime.lastError ? null : token || null);
  });
}

function logout() {
  getToken(false, token => {
    if (!token) { resetUI(); return; }
    chrome.identity.removeCachedAuthToken({ token }, () => {
      fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch(() => {});
      resetUI();
    });
  });
}

function resetUI() {
  state = { token: null, protocolos: [], index: 0 };
  chrome.storage.local.remove('lastIndex');
  show(true, false);
  msg('Sessão encerrada.', 'info');
}

// ── Sheets ─────────────────────────────────────────────────
async function buscarProtocolos(token, cfg) {
  const col   = cfg.sheetCol  || 'A';
  const start = cfg.startRow  || 2;
  const range = encodeURIComponent(`${cfg.sheetName}!${col}${start}:${col}9999`);
  const url   = `https://sheets.googleapis.com/v4/spreadsheets/${cfg.sheetId}/values/${range}`;
  const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data.values || []).flat().map(v => String(v).trim()).filter(Boolean);
}

// ── Injetar protocolo na aba ativa ────────────────────────
function injetarProtocolo(protocolo) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      { action: 'injetar_protocolo', protocolo },
      resp => resolve(resp)
    );
  });
}

// ── Navegar ────────────────────────────────────────────────
async function irPara(novoIndex) {
  if (novoIndex < 0 || novoIndex >= state.protocolos.length) return;
  state.index = novoIndex;
  chrome.storage.local.set({ lastIndex: novoIndex });
  updateNav();

  const proto = state.protocolos[novoIndex];
  msg(`Buscando ${proto}...`, 'info');
  const resp = await injetarProtocolo(proto);
  if (resp?.ok) {
    clearMsg();
  } else {
    msg('Erro: ' + (resp?.erro || 'falha ao injetar'), 'error');
  }
}

// ── Init ───────────────────────────────────────────────────
async function initComToken(token) {
  state.token = token;
  chrome.storage.local.get(
    ['sheetId','sheetName','sheetCol','startRow','lastIndex'],
    async cfg => {
      if (!cfg.sheetId) {
        show(false, false);
        msg('Configure o ID da planilha e salve para começar.', 'info');
        return;
      }
      try {
        msg('Carregando protocolos...', 'info');
        const lista = await buscarProtocolos(token, cfg);
        if (!lista.length) { msg('Nenhum protocolo encontrado.', 'error'); return; }
        state.protocolos = lista;
        state.index = Math.min(cfg.lastIndex || 0, lista.length - 1);
        clearMsg();
        show(false, true);
        updateNav();
      } catch (e) {
        msg('Erro ao ler planilha: ' + e.message, 'error');
      }
    }
  );
}

// ── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarConfig();
  show(true, false); // padrão: mostra auth

  // Tenta token silencioso primeiro
  getToken(false, token => {
    if (token) initComToken(token);
  });

  $('btn-save').addEventListener('click', salvarConfig);

  $('btn-login').addEventListener('click', () => {
    clearMsg();
    getToken(true, token => {
      if (!token) { msg('Não foi possível autenticar.', 'error'); return; }
      initComToken(token);
    });
  });

  $('btn-next').addEventListener('click',   () => irPara(state.index + 1));
  $('btn-prev').addEventListener('click',   () => irPara(state.index - 1));
  $('btn-logout').addEventListener('click', logout);

  $('btn-reload').addEventListener('click', async () => {
    if (!state.token) return;
    msg('Recarregando planilha...', 'info');
    chrome.storage.local.get(
      ['sheetId','sheetName','sheetCol','startRow'],
      async cfg => {
        try {
          const lista = await buscarProtocolos(state.token, cfg);
          state.protocolos = lista;
          state.index = 0;
          chrome.storage.local.set({ lastIndex: 0 });
          updateNav();
          msg(`${lista.length} protocolos carregados.`, 'ok');
          setTimeout(clearMsg, 2500);
        } catch (e) {
          msg('Erro: ' + e.message, 'error');
        }
      }
    );
  });
});
