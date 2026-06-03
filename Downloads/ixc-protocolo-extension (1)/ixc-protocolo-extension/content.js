// content.js — injeta protocolo no campo de busca do IXC Soft
// Executado na aba ativa via chrome.scripting.executeScript

(function (protocolo) {
  // Seletores possíveis do campo de busca — testa os dois
  const SELETORES = [
    'input.list_select_input',
    'input[placeholder*="Buscar atendimento"]',
    'input[title*="Digite algo para buscar"]',
  ];

  function encontrarCampo() {
    for (const sel of SELETORES) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function injetar() {
    const input = encontrarCampo();
    if (!input) {
      alert('[IXC Navigator] Campo de busca não encontrado. Verifique se está na página certa.');
      return;
    }

    // Foca o campo
    input.focus();

    // Define o valor de forma que o framework Angular/Vue detecte
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(input, protocolo);

    // Dispara eventos para o framework perceber a mudança
    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Aguarda um tick e pressiona Enter
    setTimeout(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Enter', keyCode: 13, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keypress',{ key: 'Enter', keyCode: 13, bubbles: true }));
    }, 150);
  }

  injetar();
})(PROTOCOLO_PLACEHOLDER);
