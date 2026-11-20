/* PIX: código "copia e cola" (BR Code do Banco Central), validação de chave e QR code.
   Usado pela loja e pelo painel. O QR code usa a biblioteca qrcode-generator (licença MIT, js/qrcode.js). */
(function () {
  'use strict';

  var TIPOS = ['CPF', 'CNPJ', 'Celular', 'E-mail', 'Chave aleatória'];
  var DDDS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
    51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89,
    91, 92, 93, 94, 95, 96, 97, 98, 99];

  function digits(v) { return String(v || '').replace(/\D/g, ''); }

  // Nome e cidade no formato do PIX: sem acento, só letras, números e espaço.
  function ascii(v, max) {
    var s = String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    return s.slice(0, max).trim();
  }

  function cpfOk(d) {
    if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false;
    for (var n = 9; n <= 10; n++) {
      var sum = 0;
      for (var i = 0; i < n; i++) sum += Number(d[i]) * (n + 1 - i);
      if ((sum * 10) % 11 % 10 !== Number(d[n])) return false;
    }
    return true;
  }

  // CNPJ só com números ou o novo CNPJ com letras.
  function cnpjOk(c) {
    if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
    var w = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (var n = 12; n <= 13; n++) {
      var sum = 0;
      for (var i = 0; i < n; i++) sum += (c.charCodeAt(i) - 48) * w[i + 13 - n];
      var r = sum % 11;
      if ((r < 2 ? 0 : 11 - r) !== Number(c[n])) return false;
    }
    return true;
  }

  function phoneKey(v) {
    v = String(v || '');
    if (/[^\d\s+().-]/.test(v)) return '';
    var d = digits(v);
    if (/^\s*\+/.test(v)) {
      if (d.slice(0, 2) !== '55') return '';
      d = d.slice(2);
    } else {
      d = d.replace(/^0+/, '');
      if ((d.length === 12 || d.length === 13) && d.slice(0, 2) === '55') d = d.slice(2);
    }
    if (d.length !== 11 || d[2] !== '9' || DDDS.indexOf(Number(d.slice(0, 2))) < 0) return '';
    return '+55' + d;
  }

  // Chave no formato que o PIX espera; vazio quando não vale para o tipo escolhido.
  function normalizarChave(tipo, chave) {
    var v = String(chave || '').trim();
    if (tipo === 'CPF') {
      var d = digits(v);
      return !/[^\d\s.-]/.test(v) && cpfOk(d) ? d : '';
    }
    if (tipo === 'CNPJ') {
      var c = v.toUpperCase().replace(/[\s./-]/g, '');
      return cnpjOk(c) ? c : '';
    }
    if (tipo === 'Celular') return phoneKey(v);
    if (tipo === 'E-mail') {
      var e = v.toLowerCase();
      var ok = e.length <= 77 && /^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(e);
      return ok ? e : '';
    }
    if (tipo === 'Chave aleatória') {
      var h = v.toLowerCase().replace(/[\s-]/g, '');
      if (!/^[0-9a-f]{32}$/.test(h)) return '';
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    }
    return '';
  }

  function erroChave(tipo) {
    if (tipo === 'CPF') return 'A chave PIX não é um CPF válido. Confira os números.';
    if (tipo === 'CNPJ') return 'A chave PIX não é um CNPJ válido. Confira os números.';
    if (tipo === 'Celular') return 'A chave PIX não é um celular válido. Use DDD + número, como (11) 98765-4321.';
    if (tipo === 'E-mail') return 'A chave PIX não é um e-mail válido.';
    if (tipo === 'Chave aleatória') return 'A chave aleatória está incompleta. Copie a chave exatamente como aparece no app do banco.';
    return 'Escolha o tipo da chave PIX.';
  }

  function whatsapp(v) {
    v = String(v || '');
    if (/[^\d\s+().-]/.test(v)) return '';
    var d = digits(v);
    if (/^\s*\+/.test(v)) return /^55\d{10,11}$/.test(d) ? d : '';
    d = d.replace(/^0+/, '');
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return /^55\d{10,11}$/.test(d) ? d : '';
  }

  function formatarTelefone(d) {
    var n = String(d || '').slice(2);
    var corte = n.length === 11 ? 7 : 6;
    return '(' + n.slice(0, 2) + ') ' + n.slice(2, corte) + '-' + n.slice(corte);
  }

  function campo(id, v) {
    var s = String(v);
    return id + String(s.length).padStart(2, '0') + s;
  }

  function crc16(str) {
    var crc = 0xFFFF;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (var j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  // o = { chave (já normalizada), nome, cidade, valor ("123.45" ou ""), txid, descricao }
  function payload(o) {
    var conta = campo('00', 'br.gov.bcb.pix') + campo('01', o.chave);
    if (o.descricao && conta.length + 4 + o.descricao.length <= 99) conta += campo('02', o.descricao);
    var p = campo('00', '01') + campo('26', conta) + campo('52', '0000') + campo('53', '986');
    if (o.valor) p += campo('54', o.valor);
    p += campo('58', 'BR') + campo('59', o.nome) + campo('60', o.cidade) + campo('62', campo('05', o.txid || '***')) + '6304';
    return p + crc16(p);
  }

  // Confere a configuração da loja; devolve { ok, chave, nome, cidade, faltando: [], erro }
  function conferir(cfg) {
    cfg = cfg || {};
    var tipoOk = TIPOS.indexOf(cfg.pix_tipo) >= 0;
    var bruta = String(cfg.pix_chave || '').trim();
    var chave = tipoOk ? normalizarChave(cfg.pix_tipo, bruta) : '';
    var nome = ascii(cfg.pix_nome, 25) || 'Elegancia de Mulher';
    var cidade = ascii(cfg.pix_cidade, 15);
    var faltando = [];
    if (!bruta) faltando.push('a chave PIX da loja');
    if (!tipoOk) faltando.push('o tipo da chave PIX');
    if (!cidade) faltando.push('a cidade do recebedor');
    var erro = bruta && tipoOk && !chave ? erroChave(cfg.pix_tipo) : '';
    return { ok: !faltando.length && !erro, chave: chave, nome: nome, cidade: cidade, faltando: faltando, erro: erro };
  }

  // QR code como caminho SVG (uma linha por sequência de módulos escuros).
  function qr(texto) {
    if (typeof window.qrcode !== 'function') return null;
    try {
      var q = window.qrcode(0, 'M');
      q.addData(texto);
      q.make();
      var n = q.getModuleCount(), m = 4, d = '';
      for (var r = 0; r < n; r++) {
        var c = 0;
        while (c < n) {
          if (!q.isDark(r, c)) { c++; continue; }
          var e = c;
          while (e < n && q.isDark(r, e)) e++;
          d += 'M' + (c + m) + ' ' + (r + m) + 'h' + (e - c) + 'v1h-' + (e - c) + 'z';
          c = e;
        }
      }
      return { caminho: d, tamanho: n + 2 * m };
    } catch (err) {
      return null;
    }
  }

  window.Pix = {
    TIPOS: TIPOS, ascii: ascii, digits: digits, cpfOk: cpfOk, cnpjOk: cnpjOk,
    normalizarChave: normalizarChave, erroChave: erroChave, whatsapp: whatsapp, formatarTelefone: formatarTelefone,
    crc16: crc16, payload: payload, conferir: conferir, qr: qr
  };
})();
