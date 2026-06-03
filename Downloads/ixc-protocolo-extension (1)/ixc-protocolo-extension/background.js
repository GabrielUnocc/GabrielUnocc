// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('IXC Protocolo Navigator v2 instalado.');
});

// Recebe mensagem do popup para injetar protocolo na aba ativa
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'injetar_protocolo') return;

  const protocolo = msg.protocolo;

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (!tabs[0]) { sendResponse({ ok: false, erro: 'Nenhuma aba ativa.' }); return; }

    try {
      // Lê o conteúdo do content.js e substitui o placeholder pelo protocolo real
      const url  = chrome.runtime.getURL('content.js');
      const resp = await fetch(url);
      let   code = await resp.text();
      code = code.replace('PROTOCOLO_PLACEHOLDER', JSON.stringify(protocolo));

      await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (src) => { eval(src); },
        args:  [code],
        world: 'MAIN', // precisa do mundo MAIN para acessar o framework da página
      });

      sendResponse({ ok: true });
    } catch (e) {
      sendResponse({ ok: false, erro: e.message });
    }
  });

  return true; // mantém canal aberto para sendResponse assíncrono
});
