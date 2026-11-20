/* Vitrine da loja: categorias, peças, janela da peça, carrinho e pagamento com PIX. */
(function () {
  'use strict';

  var S = {
    loja: null, cat: 'todos', sel: {}, janela: null, carrinho: [], gaveta: false,
    etapa: 'carrinho', pedido: '', copiado: false, toast: null, voltarFoco: null
  };
  var CHAVE_CARRINHO = 'elegancia-carrinho-v1';
  var FOTO_VAZIA = 'img/logo-banner.jpg';
  var $ = function (id) { return document.getElementById(id); };
  var tToast = null, tCopia = null, qrCache = null;

  // ---------- utilidades ----------
  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function centavos(p) {
    var n = p && p.preco !== null && p.preco !== undefined && p.preco !== '' ? Number(p.preco) : NaN;
    return isFinite(n) && n > 0 ? Math.round(n * 100) : null;
  }
  function dinheiro(c) {
    if (c === null || c === undefined) return 'Consulte';
    return 'R$ ' + (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function juntar(arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1];
  }
  // Amostra de cor: só cor hexadecimal ou degradê simples (evita CSS estranho vindo do banco)
  function amostra(v) {
    v = String(v || '').trim();
    if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
    if (/^[#0-9a-z%,.\s()/-]+$/i.test(v) && /^(repeating-)?(linear|radial)-gradient\(/i.test(v)) return v;
    return '#E8DCC8';
  }
  function icone(nome) {
    var d = {
      fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
      sacola: '<path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
      voltar: '<path d="M15 5l-7 7 7 7"/>',
      ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
      copiar: '<rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M15 5.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h.5"/>',
      conversa: '<path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.3-4A8 8 0 1 1 20 11.5z"/>',
      qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/>'
    }[nome];
    return '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  function produtos() { return (S.loja && S.loja.produtos) || []; }
  function porId(id) { return produtos().filter(function (p) { return p.id === id; })[0] || null; }
  function categoria(id) { return ((S.loja && S.loja.categorias) || []).filter(function (c) { return c.id === id; })[0] || null; }
  function cores(p) { return Array.isArray(p.cores) && p.cores.length ? p.cores : [{ nome: 'Única', amostra: '#E8DCC8', foto: '' }]; }
  function tamanhos(p) { return Array.isArray(p.tamanhos) && p.tamanhos.length ? p.tamanhos : ['Único']; }
  function foto(p, i) {
    var cs = cores(p);
    var c = cs[i] || cs[0];
    if (c && c.foto) return c.foto;
    var primeira = cs.filter(function (x) { return x.foto; })[0];
    return primeira ? primeira.foto : FOTO_VAZIA;
  }
  function alt(p, i) {
    var c = cores(p)[i] || cores(p)[0];
    return p.nome + (cores(p).length > 1 || c.nome !== 'Única' ? ', cor ' + c.nome : '');
  }
  function sel(p) {
    var s = S.sel[p.id] || {};
    var t = tamanhos(p);
    return { cor: s.cor && s.cor < cores(p).length ? s.cor : 0, tam: t.length === 1 ? t[0] : (s.tam || null), qtd: s.qtd || 1, erro: !!s.erro };
  }
  function mudarSel(id, patch) { S.sel[id] = Object.assign({}, S.sel[id] || {}, patch); }
  function textoTamanhos(p) { var t = tamanhos(p); return t.length === 1 ? (t[0] === 'Único' ? 'Tamanho único' : 'Tamanho ' + t[0]) : t.join(' · '); }

  // ---------- carrinho guardado no navegador ----------
  function lerCarrinho() {
    try { var s = window.localStorage.getItem(CHAVE_CARRINHO); return s ? JSON.parse(s) : []; } catch (e) { return []; }
  }
  function gravarCarrinho() {
    try { window.localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(S.carrinho)); } catch (e) { /* sem armazenamento */ }
  }
  function itensCarrinho() {
    var itens = [];
    S.carrinho.forEach(function (c) {
      var p = porId(c.id);
      if (!p) return;
      var cs = cores(p);
      var idx = cs.map(function (x) { return x.nome; }).indexOf(c.cor);
      if (idx < 0) idx = 0;
      var unit = centavos(p);
      itens.push({ chave: c.chave, p: p, cor: c.cor, idx: idx, tam: c.tam, qtd: c.qtd, unit: unit, total: unit === null ? null : unit * c.qtd,
        variante: 'Cor: ' + c.cor + ' · ' + (c.tam === 'Único' ? 'Tamanho único' : 'Tamanho ' + c.tam) });
    });
    return itens;
  }

  // ---------- topo, banner e rodapé ----------
  function renderFixos() {
    var cfg = S.loja.config || {};
    var aviso = $('aviso');
    aviso.textContent = cfg.aviso || '';
    aviso.hidden = !cfg.aviso;
    $('hero-chamada').textContent = cfg.hero_chamada || 'Nova coleção';
    $('hero-texto').textContent = cfg.hero_texto || '';
    var det = $('hero-detalhe');
    det.textContent = cfg.hero_detalhe || '';
    det.hidden = !cfg.hero_detalhe;
    var img = $('hero-img');
    if (cfg.banner_foto) { img.src = cfg.banner_foto; img.alt = cfg.banner_alt || 'Modelo usando uma peça da loja'; }
    var primeira = S.loja.categorias.filter(function (c) { return produtos().some(function (p) { return p.categoria === c.id; }); })[0];
    var bt = $('hero-categoria');
    if (primeira) { bt.textContent = 'Ver ' + primeira.nome.toLowerCase(); bt.setAttribute('data-cat', primeira.id); bt.hidden = false; } else { bt.hidden = true; }

    var contatos = [];
    var w = Pix.whatsapp(cfg.whatsapp);
    if (w) contatos.push('<a href="https://wa.me/' + w + '" target="_blank" rel="noopener noreferrer">WhatsApp: ' + esc(Pix.formatarTelefone(w)) + '</a>');
    if (cfg.email) contatos.push('<a href="mailto:' + esc(cfg.email) + '">E-mail: ' + esc(cfg.email) + '</a>');
    if (cfg.instagram) {
      var ig = String(cfg.instagram).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/.*$/, '');
      if (/^[A-Za-z0-9._]{1,30}$/.test(ig)) contatos.push('<a href="https://instagram.com/' + ig + '" target="_blank" rel="noopener noreferrer">Instagram: @' + esc(ig) + '</a>');
    }
    if (cfg.endereco) contatos.push('<span style="white-space: pre-line;">' + esc(cfg.endereco) + '</span>');
    $('contatos').innerHTML = contatos.length ? contatos.join('') : '<span>Fale com a gente pelas redes sociais.</span>';
    $('entrega').textContent = cfg.entrega || 'Entrega combinada pelo WhatsApp depois do pagamento.';
    $('ano').textContent = String(new Date().getFullYear());
  }

  function renderCategorias() {
    var usadas = S.loja.categorias.filter(function (c) { return produtos().some(function (p) { return p.categoria === c.id; }); });
    var lista = [{ id: 'todos', nome: 'Ver todos' }].concat(usadas);
    if (S.cat !== 'todos' && !usadas.some(function (c) { return c.id === S.cat; })) S.cat = 'todos';
    $('categorias').innerHTML = lista.map(function (c) {
      return '<button type="button" class="chip" data-acao="categoria" data-cat="' + esc(c.id) + '" aria-pressed="' + (c.id === S.cat) + '">' + esc(c.nome) + '</button>';
    }).join('');
  }

  // ---------- vitrine ----------
  function cartao(p) {
    var s = sel(p), cs = cores(p);
    var bolinhas = cs.map(function (c) { return '<span class="bolinha" style="background: ' + esc(amostra(c.amostra)) + ';"></span>'; }).join('');
    return '<article class="cartao">' +
      '<div class="cartao-foto' + (p.foto_alta ? ' alta' : '') + '"><button type="button" data-acao="abrir" data-id="' + esc(p.id) + '" aria-label="Ver detalhes: ' + esc(p.nome) + '">' +
      '<img src="' + esc(foto(p, s.cor)) + '" alt="' + esc(alt(p, s.cor)) + '" loading="lazy"></button></div>' +
      '<div class="cartao-info"><h3>' + esc(p.nome) + '</h3>' +
      '<div class="cores-linha"><span class="bolinhas" aria-hidden="true">' + bolinhas + '</span><span>' + esc(cs.length === 1 ? cs[0].nome : cs.length + ' cores') + '</span></div>' +
      '<div class="preco-linha"><span class="preco">' + dinheiro(centavos(p)) + '</span><span class="tamanhos-txt">' + esc(textoTamanhos(p)) + '</span></div>' +
      '<button type="button" class="btn btn-escuro" data-acao="abrir" data-id="' + esc(p.id) + '">Comprar</button></div></article>';
  }

  function secaoGrade(chamada, titulo, nota, lista) {
    return '<section class="secao" aria-label="' + esc(titulo) + '"><div class="wrap">' +
      '<div class="secao-topo">' + (chamada ? '<span class="chamada">' + esc(chamada) + '</span>' : '') +
      '<h2>' + esc(titulo) + '</h2><div class="ornamento" aria-hidden="true"><span></span></div>' +
      (nota ? '<p class="nota">' + esc(nota) + '</p>' : '') + '</div>' +
      '<div class="grade">' + lista.map(cartao).join('') + '</div></div></section>';
  }

  function amostrasHtml(p, s, onde) {
    return cores(p).map(function (c, i) {
      return '<button type="button" class="amostra" data-acao="cor" data-id="' + esc(p.id) + '" data-i="' + i + '" data-foco="' + onde + '-cor-' + i + '" aria-pressed="' + (i === s.cor) + '" aria-label="' + esc(c.nome) + '" title="' + esc(c.nome) + '">' +
        '<span style="background: ' + esc(amostra(c.amostra)) + ';"></span></button>';
    }).join('');
  }

  function faixaDestaque(p) {
    var s = sel(p), cs = cores(p), t = tamanhos(p);
    return '<section class="destaque" aria-label="Destaque: ' + esc(p.nome) + '"><div class="wrap">' +
      '<div class="destaque-foto"><div' + (p.foto_alta ? ' class="alta"' : '') + '><img src="' + esc(foto(p, s.cor)) + '" alt="' + esc(alt(p, s.cor)) + '" loading="lazy"></div></div>' +
      '<div class="destaque-texto"><span class="chamada">Destaque</span><h2>' + esc(p.nome) + '</h2><div class="ornamento" aria-hidden="true"><span></span></div>' +
      (p.descricao ? '<p>' + esc(p.descricao) + '</p>' : '') +
      '<div class="coluna"><span class="rotulo">Cor: <span>' + esc((cs[s.cor] || cs[0]).nome) + '</span></span>' +
      '<div class="amostras">' + amostrasHtml(p, s, 'destaque') + '</div>' +
      (cs.length > 1 ? '<span style="font-size: 13px; color: var(--suave);">Disponível em ' + cs.length + ' cores. Toque numa cor para ver a peça.</span>' : '') + '</div>' +
      '<div style="display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap;"><span class="preco" style="font-size: 24px;">' + dinheiro(centavos(p)) + '</span>' +
      '<span style="font-size: 14px; color: var(--suave);">' + esc(t.length === 1 ? textoTamanhos(p) : 'Tamanhos ' + juntar(t)) + '</span></div>' +
      '<button type="button" class="btn btn-escuro" style="align-self: flex-start; min-height: 52px; padding: 0 34px;" data-acao="abrir" data-id="' + esc(p.id) + '">Escolher tamanho</button>' +
      '</div></div></section>';
  }

  function renderVitrine() {
    var html = '';
    var cats = S.loja.categorias;
    if (S.cat === 'todos') {
      var dest = porId((S.loja.config || {}).destaque);
      var grupos = [];
      cats.forEach(function (c) {
        var lista = produtos().filter(function (p) { return p.categoria === c.id && (!dest || p.id !== dest.id); });
        var titulo = (c.secao || c.nome || '').trim();
        var g = grupos.filter(function (x) { return x.titulo.toLowerCase() === titulo.toLowerCase(); })[0];
        if (!g) { g = { titulo: titulo, chamada: c.chamada || '', nota: c.nota || '', itens: [] }; grupos.push(g); }
        if (!g.chamada && c.chamada) g.chamada = c.chamada;
        if (!g.nota && c.nota) g.nota = c.nota;
        g.itens = g.itens.concat(lista);
      });
      // peças de categorias que não existem mais
      var semCat = produtos().filter(function (p) { return !categoria(p.categoria) && (!dest || p.id !== dest.id); });
      if (semCat.length) grupos.push({ titulo: 'Outras peças', chamada: '', nota: '', itens: semCat });
      grupos = grupos.filter(function (g) { return g.itens.length; });
      grupos.forEach(function (g, i) {
        html += secaoGrade(g.chamada, g.titulo, g.nota, g.itens);
        if (i === 0 && dest) html += faixaDestaque(dest);
      });
      if (!grupos.length && dest) html += faixaDestaque(dest);
    } else {
      var c = categoria(S.cat);
      var itens = produtos().filter(function (p) { return p.categoria === S.cat; });
      var todosUnico = itens.length && itens.every(function (p) { return tamanhos(p).length === 1; });
      var nota = itens.length + (itens.length === 1 ? ' peça' : ' peças') + (todosUnico ? ' · tamanho único' : '');
      html = secaoGrade('Categoria', c ? c.nome : 'Produtos', nota, itens);
    }
    $('vitrine').innerHTML = html || '<div class="vazio wrap">Nenhuma peça por aqui ainda. Volte em breve!</div>';
  }

  // ---------- janela da peça ----------
  function renderJanela() {
    var box = $('janela');
    var p = S.janela ? porId(S.janela) : null;
    if (!p) { box.innerHTML = ''; return; }
    var s = sel(p), cs = cores(p), t = tamanhos(p), cat = categoria(p.categoria);
    var tams = t.length === 1
      ? '<div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;"><span class="pilula fixa">' + esc(t[0]) + '</span><span style="font-size: 13px; color: var(--suave);">' + (t[0] === 'Único' ? 'Esta peça tem tamanho único.' : 'Disponível neste tamanho.') + '</span></div>'
      : '<div class="pilulas">' + t.map(function (z) {
        return '<button type="button" class="pilula" data-acao="tamanho" data-id="' + esc(p.id) + '" data-t="' + esc(z) + '" data-foco="tam-' + esc(z) + '" aria-pressed="' + (z === s.tam) + '">' + esc(z) + '</button>';
      }).join('') + '</div>' + (s.erro ? '<p class="erro-txt" role="alert">Escolha um tamanho para continuar.</p>' : '');
    box.innerHTML = '<div class="janela" role="dialog" aria-modal="true" aria-labelledby="janela-titulo">' +
      '<button type="button" class="fundo-escuro" data-acao="fechar-janela" aria-label="Fechar detalhes da peça" tabindex="-1"></button>' +
      '<div class="janela-caixa"><button type="button" class="icone-btn janela-fechar" data-acao="fechar-janela" data-foco="fechar" aria-label="Fechar">' + icone('fechar') + '</button>' +
      '<div class="janela-corpo"><div class="janela-foto"><div class="moldura' + (p.foto_alta ? ' alta' : '') + '"><img src="' + esc(foto(p, s.cor)) + '" alt="' + esc(alt(p, s.cor)) + '"></div></div>' +
      '<div class="janela-info"><span class="chamada">' + esc(cat ? cat.nome : '') + '</span><h2 id="janela-titulo">' + esc(p.nome) + '</h2>' +
      '<div class="coluna" style="gap: 6px;"><span class="preco">' + dinheiro(centavos(p)) + '</span><span class="so-pix">' + icone('qr') + 'Pagamento somente via PIX</span></div>' +
      (p.descricao ? '<p>' + esc(p.descricao) + '</p>' : '') + '<div class="divisoria" aria-hidden="true"></div>' +
      '<div class="coluna"><span class="rotulo">Cor: <span>' + esc((cs[s.cor] || cs[0]).nome) + '</span></span><div class="amostras">' + amostrasHtml(p, s, 'janela') + '</div></div>' +
      '<div class="coluna"><span class="rotulo">Tamanho</span>' + tams + '</div>' +
      '<div class="comprar-linha"><div class="qtd"><button type="button" data-acao="menos" data-id="' + esc(p.id) + '" data-foco="menos" aria-label="Diminuir quantidade">−</button>' +
      '<span aria-live="polite">' + s.qtd + '</span><button type="button" data-acao="mais" data-id="' + esc(p.id) + '" data-foco="mais" aria-label="Aumentar quantidade">+</button></div>' +
      '<button type="button" class="btn btn-escuro" data-acao="adicionar" data-id="' + esc(p.id) + '" data-foco="adicionar">Adicionar ao carrinho</button></div>' +
      '</div></div></div></div>';
    // pré-carrega as fotos das outras cores
    cs.forEach(function (c) { if (c.foto) { var im = new Image(); im.src = c.foto; } });
  }

  // ---------- carrinho e PIX ----------
  function pixDados(itens) {
    var cfg = S.loja.config || {};
    var conf = Pix.conferir(cfg);
    var total = 0, comPreco = true;
    itens.forEach(function (it) { if (it.total === null) comPreco = false; else total += it.total; });
    var valorOk = comPreco && total > 0;
    var w = Pix.whatsapp(cfg.whatsapp);
    var r = { conf: conf, total: total, totalTxt: dinheiro(valorOk ? total : null), valorOk: valorOk, whats: w, codigo: '', qr: null, pendente: null };
    if (!conf.ok) {
      r.pendente = { titulo: 'PIX ainda não configurado', texto: (conf.faltando.length ? 'Para gerar o QR code, falta cadastrar ' + juntar(conf.faltando) + ' no painel da loja.' : '') + (conf.erro ? (conf.faltando.length ? '\n' : '') + conf.erro : '') };
    } else if (!valorOk) {
      r.pendente = { titulo: 'Pedido sem valor definido', texto: 'Alguma peça do carrinho ainda está sem preço. Fale com a loja para fechar o pedido.' };
    } else {
      r.codigo = Pix.payload({ chave: conf.chave, nome: conf.nome, cidade: conf.cidade, valor: (total / 100).toFixed(2), txid: S.pedido, descricao: S.pedido ? 'Pedido ' + S.pedido : '' });
      if (!qrCache || qrCache.codigo !== r.codigo) qrCache = { codigo: r.codigo, qr: Pix.qr(r.codigo) };
      r.qr = qrCache.qr;
    }
    var linhas = itens.map(function (it) { return '- ' + it.qtd + 'x ' + it.p.nome + ' (' + it.variante + '): ' + dinheiro(it.total); });
    var msg = ['Olá! Fiz um pedido no site' + (r.codigo ? ' e paguei com PIX.' : '.'), '', 'Pedido ' + S.pedido].concat(linhas)
      .concat(['Total: ' + r.totalTxt, '', r.codigo ? 'Segue o comprovante do pagamento.' : 'Pode me ajudar a fechar o pedido?', 'Nome:', 'Endereço para entrega:']).join('\n');
    r.linkWhats = w ? 'https://wa.me/' + w + '?text=' + encodeURIComponent(msg) : '';
    return r;
  }

  function novoPedido() {
    var abc = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    var id = 'EM' + Date.now().toString(36).toUpperCase().slice(-5);
    for (var i = 0; i < 3; i++) id += abc[Math.floor(Math.random() * abc.length)];
    return id;
  }

  function renderGaveta() {
    var box = $('gaveta');
    if (!S.gaveta) { box.innerHTML = ''; return; }
    var itens = itensCarrinho();
    var pix = S.etapa === 'pix' && itens.length > 0;
    var topo = pix
      ? '<div class="gaveta-titulo"><button type="button" class="icone-btn voltar" data-acao="voltar-carrinho" data-foco="voltar" aria-label="Voltar ao carrinho">' + icone('voltar') + '</button><h2 id="gaveta-titulo">Pagamento via PIX</h2></div>'
      : '<h2 id="gaveta-titulo">Seu carrinho</h2>';
    var corpo = '', rodape = '';
    if (!pix) {
      if (!itens.length) {
        corpo = '<div style="padding: 4px 24px;"><div class="carrinho-vazio"><span class="bola">' + icone('sacola') + '</span><p style="margin: 0; font-size: 15px;">Seu carrinho está vazio.</p>' +
          '<button type="button" class="btn btn-escuro" data-acao="fechar-gaveta">Ver produtos</button></div></div>';
      } else {
        corpo = '<div style="padding: 4px 24px;">' + itens.map(function (it) {
          return '<div class="item"><img src="' + esc(foto(it.p, it.idx)) + '" alt=""><div class="item-info"><span class="item-nome">' + esc(it.p.nome) + '</span>' +
            '<span class="item-var">' + esc(it.variante) + '</span><div class="item-linha"><div class="qtd">' +
            '<button type="button" data-acao="item-menos" data-chave="' + esc(it.chave) + '" data-foco="im-' + esc(it.chave) + '" aria-label="Diminuir quantidade">−</button><span>' + it.qtd + '</span>' +
            '<button type="button" data-acao="item-mais" data-chave="' + esc(it.chave) + '" data-foco="ip-' + esc(it.chave) + '" aria-label="Aumentar quantidade">+</button></div>' +
            '<span style="font-size: 14px; font-weight: 600;">' + dinheiro(it.total) + '</span></div></div>' +
            '<button type="button" class="item-remover" data-acao="item-remover" data-chave="' + esc(it.chave) + '" aria-label="Remover ' + esc(it.p.nome) + ' do carrinho">' + icone('fechar') + '</button></div>';
        }).join('') + '</div>';
        var total = 0, algum = false;
        itens.forEach(function (it) { if (it.total !== null) { total += it.total; algum = true; } });
        rodape = '<div class="gaveta-rodape"><div class="subtotal"><span>Subtotal</span><span>' + dinheiro(algum ? total : null) + '</span></div>' +
          '<p class="aviso-pix">' + icone('qr') + '<span>Pagamento somente via PIX, com QR code e código copia e cola já no valor do pedido.</span></p>' +
          '<button type="button" class="btn btn-escuro btn-largo" style="min-height: 52px;" data-acao="ir-pix" data-foco="ir-pix">Pagar com PIX</button>' +
          '<button type="button" class="link-btn" data-acao="fechar-gaveta">Continuar comprando</button></div>';
      }
    } else {
      var d = pixDados(itens);
      var meio;
      if (d.pendente) {
        meio = '<div class="pix-pendente"><span class="bola" style="width: 56px; height: 56px; border-radius: 50%; background: var(--creme); color: var(--ouro-texto); display: flex; align-items: center; justify-content: center;">' + icone('qr') + '</span>' +
          '<strong>' + esc(d.pendente.titulo) + '</strong><p>' + esc(d.pendente.texto) + '</p>' +
          (d.linkWhats ? '<a class="btn btn-ouro" href="' + esc(d.linkWhats) + '" target="_blank" rel="noopener noreferrer">' + icone('conversa') + 'Falar com a loja no WhatsApp</a>' : '') + '</div>';
      } else {
        var qr = d.qr
          ? '<svg role="img" aria-label="QR code do PIX no valor de ' + esc(d.totalTxt) + '" viewBox="0 0 ' + d.qr.tamanho + ' ' + d.qr.tamanho + '"><path d="' + d.qr.caminho + '"/></svg><span>Escaneie o QR code com o app do seu banco.</span>'
          : '<span>O QR code não carregou. Use o código PIX copia e cola logo abaixo.</span>';
        meio = '<div class="qr-caixa">' + qr + '</div>' +
          '<div class="coluna"><span class="mini" style="color: var(--texto);">PIX copia e cola</span><p class="copia-cola" id="codigo-pix">' + esc(d.codigo) + '</p>' +
          '<button type="button" class="btn btn-escuro btn-largo" data-acao="copiar" data-foco="copiar">' + (S.copiado ? icone('ok') + 'Código copiado' : icone('copiar') + 'Copiar código') + '</button>' +
          '<p class="centro" aria-live="polite" style="margin: 0; min-height: 18px; font-size: 13px; color: var(--suave);">' + (S.copiado ? 'Código copiado. Agora é só colar no app do seu banco.' : '') + '</p></div>' +
          '<ol class="passos"><li>Abra o app do seu banco e escolha pagar com PIX.</li><li>Escaneie o QR code ou cole o código copiado.</li><li>Confira o valor e confirme o pagamento.</li>' +
          '<li style="margin-bottom: 0;">Envie o comprovante pelo WhatsApp para combinarmos a entrega.</li></ol>' +
          (d.linkWhats
            ? '<a class="btn btn-ouro btn-largo" href="' + esc(d.linkWhats) + '" target="_blank" rel="noopener noreferrer">' + icone('conversa') + 'Enviar comprovante pelo WhatsApp</a>'
            : '<p class="caixa-nota">Envie o comprovante para a loja pelas redes sociais para combinarmos a entrega.</p>');
      }
      corpo = '<div class="pix"><div class="pix-topo"><div><span class="mini">Pedido</span><span class="pedido-num">' + esc(S.pedido) + '</span></div>' +
        '<div><span class="mini">Total a pagar</span><span class="pix-total">' + esc(d.totalTxt) + '</span></div></div>' + meio +
        '<div class="coluna" style="gap: 12px;"><span class="mini" style="color: var(--texto);">Resumo do pedido</span>' + itens.map(function (it) {
          return '<div class="resumo-linha"><div><strong style="font-weight: 600;">' + it.qtd + '× ' + esc(it.p.nome) + '</strong><small>' + esc(it.variante) + '</small></div><strong style="font-weight: 600; white-space: nowrap;">' + dinheiro(it.total) + '</strong></div>';
        }).join('') + '</div><button type="button" class="link-btn" data-acao="voltar-carrinho">Voltar ao carrinho</button></div>';
    }
    box.innerHTML = '<div class="gaveta" role="dialog" aria-modal="true" aria-labelledby="gaveta-titulo">' +
      '<button type="button" class="fundo-escuro" data-acao="fechar-gaveta" aria-label="Fechar carrinho" tabindex="-1"></button>' +
      '<aside class="gaveta-caixa"><div class="gaveta-topo">' + topo + '<button type="button" class="icone-btn" data-acao="fechar-gaveta" data-foco="fechar-gaveta" aria-label="Fechar carrinho">' + icone('fechar') + '</button></div>' +
      '<div class="gaveta-corpo">' + corpo + '</div>' + rodape + '</aside></div>';
  }

  function renderContador() {
    var n = 0;
    itensCarrinho().forEach(function (it) { n += it.qtd; });
    $('contador').textContent = String(n);
    $('abrir-carrinho').setAttribute('aria-label', 'Abrir carrinho, ' + n + (n === 1 ? ' item' : ' itens'));
  }

  function renderToast() {
    var box = $('toast');
    if (!S.toast) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="toast">' + icone('ok') + '<span>' + esc(S.toast.texto) + '</span>' +
      (S.toast.carrinho ? '<button type="button" class="btn btn-ouro" data-acao="abrir-carrinho">Ver carrinho</button>' : '') + '</div>';
  }
  function avisar(texto, carrinho) {
    clearTimeout(tToast);
    S.toast = { texto: texto, carrinho: !!carrinho };
    renderToast();
    tToast = setTimeout(function () { S.toast = null; renderToast(); }, 3800);
  }

  // Redesenha mantendo o foco no mesmo controle
  function redesenhar(partes) {
    var ativo = document.activeElement;
    var foco = ativo && ativo.getAttribute ? ativo.getAttribute('data-foco') : null;
    partes.forEach(function (f) { f(); });
    document.body.style.overflow = S.janela || S.gaveta ? 'hidden' : '';
    if (foco) {
      var alvo = document.querySelector('[data-foco="' + foco.replace(/"/g, '') + '"]');
      if (alvo) alvo.focus();
    }
  }
  function tudo() { redesenhar([renderCategorias, renderVitrine, renderJanela, renderGaveta, renderContador]); }

  // ---------- ações ----------
  function adicionar(p) {
    var s = sel(p);
    if (!s.tam) { mudarSel(p.id, { erro: true }); redesenhar([renderJanela]); return; }
    var cor = (cores(p)[s.cor] || cores(p)[0]).nome;
    var chave = p.id + '|' + cor + '|' + s.tam;
    var achou = S.carrinho.filter(function (c) { return c.chave === chave; })[0];
    if (achou) achou.qtd = Math.min(10, achou.qtd + s.qtd);
    else S.carrinho.push({ chave: chave, id: p.id, cor: cor, tam: s.tam, qtd: s.qtd });
    mudarSel(p.id, { qtd: 1, erro: false });
    S.janela = null;
    S.etapa = 'carrinho';
    S.copiado = false;
    gravarCarrinho();
    fecharFoco();
    redesenhar([renderJanela, renderGaveta, renderContador]);
    avisar('Adicionado ao carrinho!', true);
  }

  function copiar() {
    var el = $('codigo-pix');
    var texto = el ? el.textContent : '';
    if (!texto) return;
    var feito = function () {
      clearTimeout(tCopia);
      S.copiado = true;
      redesenhar([renderGaveta]);
      tCopia = setTimeout(function () { S.copiado = false; redesenhar([renderGaveta]); }, 4000);
    };
    var manual = function () {
      var ok = false;
      try {
        var r = document.createRange();
        r.selectNodeContents(el);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        ok = document.execCommand('copy');
      } catch (e) { ok = false; }
      if (ok) feito(); else avisar('Não deu para copiar automaticamente. Selecione o código e copie.', false);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(feito, manual);
      else manual();
    } catch (e) { manual(); }
  }

  function abrirFoco(el) { S.voltarFoco = el || document.activeElement; }
  function fecharFoco() {
    var el = S.voltarFoco;
    S.voltarFoco = null;
    if (el && document.body.contains(el)) setTimeout(function () { el.focus(); }, 0);
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao]');
    if (!el || !S.loja) return;
    var acao = el.getAttribute('data-acao');
    var id = el.getAttribute('data-id');
    var p = id ? porId(id) : null;
    switch (acao) {
      case 'categoria':
        S.cat = el.getAttribute('data-cat') || 'todos';
        redesenhar([renderCategorias, renderVitrine]);
        if (el.classList.contains('chip')) {
          var main = $('produtos');
          if (window.scrollY > main.offsetTop) main.scrollIntoView({ block: 'start' });
        }
        break;
      case 'abrir':
        if (!p) return;
        abrirFoco(el);
        S.janela = p.id;
        redesenhar([renderJanela]);
        var f = document.querySelector('[data-foco="fechar"]');
        if (f) f.focus();
        break;
      case 'fechar-janela':
        S.janela = null; redesenhar([renderJanela]); fecharFoco(); break;
      case 'cor':
        if (!p) return;
        mudarSel(p.id, { cor: Number(el.getAttribute('data-i')) || 0 });
        redesenhar([renderVitrine, renderJanela]);
        break;
      case 'tamanho':
        if (!p) return;
        mudarSel(p.id, { tam: el.getAttribute('data-t'), erro: false }); redesenhar([renderJanela]); break;
      case 'menos':
        if (p) { mudarSel(p.id, { qtd: Math.max(1, sel(p).qtd - 1) }); redesenhar([renderJanela]); } break;
      case 'mais':
        if (p) { mudarSel(p.id, { qtd: Math.min(10, sel(p).qtd + 1) }); redesenhar([renderJanela]); } break;
      case 'adicionar':
        if (p) adicionar(p); break;
      case 'abrir-carrinho':
        clearTimeout(tToast); S.toast = null; renderToast();
        abrirFoco(el.id === 'abrir-carrinho' ? el : $('abrir-carrinho'));
        S.gaveta = true;
        redesenhar([renderGaveta]);
        var fc = document.querySelector('[data-foco="fechar-gaveta"]');
        if (fc) fc.focus();
        break;
      case 'fechar-gaveta':
        S.gaveta = false; redesenhar([renderGaveta]); fecharFoco(); break;
      case 'item-menos':
      case 'item-mais':
        var ch = el.getAttribute('data-chave');
        S.carrinho.forEach(function (c) { if (c.chave === ch) c.qtd = Math.max(1, Math.min(10, c.qtd + (acao === 'item-mais' ? 1 : -1))); });
        gravarCarrinho(); redesenhar([renderGaveta, renderContador]); break;
      case 'item-remover':
        var chave = el.getAttribute('data-chave');
        S.carrinho = S.carrinho.filter(function (c) { return c.chave !== chave; });
        gravarCarrinho(); redesenhar([renderGaveta, renderContador]);
        var fg = document.querySelector('[data-foco="fechar-gaveta"]');
        if (fg) fg.focus();
        break;
      case 'ir-pix':
        clearTimeout(tCopia);
        S.etapa = 'pix'; S.pedido = novoPedido(); S.copiado = false;
        redesenhar([renderGaveta]);
        var v = document.querySelector('[data-foco="voltar"]');
        if (v) v.focus();
        document.querySelector('.gaveta-corpo').scrollTop = 0;
        break;
      case 'voltar-carrinho':
        clearTimeout(tCopia);
        S.etapa = 'carrinho'; S.copiado = false;
        redesenhar([renderGaveta]);
        var ip = document.querySelector('[data-foco="ir-pix"]');
        if (ip) ip.focus();
        break;
      case 'copiar':
        copiar(); break;
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (S.janela) { S.janela = null; redesenhar([renderJanela]); fecharFoco(); }
    else if (S.gaveta) { S.gaveta = false; redesenhar([renderGaveta]); fecharFoco(); }
  });

  // Mantém o Tab dentro da janela ou do carrinho abertos
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Tab' || !(S.janela || S.gaveta)) return;
    var caixa = document.querySelector(S.janela ? '.janela-caixa' : '.gaveta-caixa');
    if (!caixa) return;
    var focaveis = Array.prototype.filter.call(caixa.querySelectorAll('button, a[href], input, select, textarea'), function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!focaveis.length) return;
    var primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
    if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
    else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
    else if (!caixa.contains(document.activeElement)) { ev.preventDefault(); primeiro.focus(); }
  });

  $('form-novidades').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var campo = $('whats-novidades');
    var numero = Pix.whatsapp(campo.value);
    if (!numero) { avisar('Digite seu WhatsApp com DDD, como (98) 98765-4321.', false); campo.focus(); return; }
    var nome = $('nome-novidades').value.trim().slice(0, 80);
    var bt = ev.target.querySelector('button');
    bt.disabled = true;
    LojaDados.inscrever({ nome: nome, whatsapp: numero }).then(function () {
      ev.target.hidden = true;
      $('novidades-ok').hidden = false;
    }).catch(function () {
      avisar('Não deu para cadastrar agora. Tente de novo mais tarde.', false);
    }).then(function () { bt.disabled = false; });
  });

  // ---------- início ----------
  function iniciar() {
    S.carrinho = lerCarrinho().filter(function (c) { return c && c.id && c.chave && c.qtd > 0; });
    var limite = setTimeout(function () {
      $('carregando').innerHTML = '<p>As peças estão demorando para carregar. Confira sua internet ou tente de novo em instantes.</p>';
    }, 12000);
    LojaDados.carregarLoja().then(function (dados) {
      clearTimeout(limite);
      S.loja = dados;
      $('carregando').hidden = true;
      renderFixos();
      tudo();
    }).catch(function (err) {
      clearTimeout(limite);
      console.error(err);
      $('carregando').innerHTML = '<p>Não foi possível carregar as peças agora. Tente atualizar a página em instantes.</p>';
    });
  }
  iniciar();
})();
