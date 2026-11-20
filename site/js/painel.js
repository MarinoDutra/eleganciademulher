/* Painel da loja: entrar, cadastrar e editar peças, cores, fotos, preços, categorias e dados da loja. */
(function () {
  'use strict';

  var D = window.LojaDados;
  var app = document.getElementById('app');
  var P = {
    vista: 'carregando', aba: 'pecas', dados: null, filtro: 'todas', editando: null, sujo: false, descartar: false,
    confirmar: null, confirmarCat: null, ocupado: false, msg: null, cfg: null, inscritos: null, enviando: {}, novaCat: ''
  };
  var TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'Único'];
  var tToast = null;

  // ---------- utilidades ----------
  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function dinheiro(v) {
    var n = v === null || v === undefined || v === '' ? NaN : Number(v);
    if (!isFinite(n) || n <= 0) return 'Sem preço';
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function precoParaCampo(v) {
    var n = v === null || v === undefined || v === '' ? NaN : Number(v);
    return isFinite(n) && n > 0 ? n.toFixed(2).replace('.', ',') : '';
  }
  // Aceita 289,90 | 289.90 | 1.289,90 | R$ 289
  function lerPreco(txt) {
    var s = String(txt || '').replace(/R\$|\s/gi, '');
    if (!s) return { ok: true, valor: null };
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '');
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return { ok: false };
    var n = Number(s);
    return n > 0 && n < 1000000 ? { ok: true, valor: Math.round(n * 100) / 100 } : { ok: false };
  }
  function amostra(v) {
    v = String(v || '').trim();
    if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
    if (/^[#0-9a-z%,.\s()/-]+$/i.test(v) && /^(repeating-)?(linear|radial)-gradient\(/i.test(v)) return v;
    return '#E8DCC8';
  }
  function hex6(v) {
    v = String(v || '');
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
    if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    var m = v.match(/#[0-9a-f]{6}/i);
    return m ? m[0] : '#E8DCC8';
  }
  function slug(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  }
  function icone(nome) {
    var d = {
      cima: '<path d="M6 15l6-6 6 6"/>', baixo: '<path d="M6 9l6 6 6-6"/>', mais: '<path d="M12 5v14M5 12h14"/>',
      editar: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>', olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
      lixo: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', foto: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-9 9"/>',
      voltar: '<path d="M15 5l-7 7 7 7"/>', ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', copiar: '<rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M15 5.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h.5"/>'
    }[nome];
    return '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }
  function avisar(texto) {
    clearTimeout(tToast);
    document.getElementById('toast').innerHTML = '<div class="toast">' + icone('ok') + '<span>' + esc(texto) + '</span></div>';
    tToast = setTimeout(function () { document.getElementById('toast').innerHTML = ''; }, 3200);
  }
  function msgHtml() {
    return P.msg ? '<p class="msg ' + P.msg.tipo + '" role="' + (P.msg.tipo === 'erro' ? 'alert' : 'status') + '" style="margin-bottom: 18px;">' + esc(P.msg.texto) + '</p>' : '';
  }
  function categorias() { return (P.dados && P.dados.categorias) || []; }
  function produtos() { return (P.dados && P.dados.produtos) || []; }
  function nomeCategoria(id) { var c = categorias().filter(function (x) { return x.id === id; })[0]; return c ? c.nome : 'Sem categoria'; }
  function primeiraFoto(p) { var c = (p.cores || []).filter(function (x) { return x.foto; })[0]; return c ? c.foto : 'img/logo-banner.jpg'; }

  // ---------- vistas ----------
  function render() {
    document.getElementById('sair').hidden = P.vista !== 'painel' && P.vista !== 'sem-permissao';
    if (P.vista === 'carregando') { app.innerHTML = '<p class="carregando" style="padding: 80px 0;">Carregando…</p>'; return; }
    if (P.vista === 'login') return renderLogin();
    if (P.vista === 'sem-permissao') {
      app.innerHTML = '<div class="cartao-login"><h1>Sem permissão</h1><p class="msg erro">Esta conta entrou, mas não está liberada para mudar a loja. Peça para liberar o e-mail dela como administradora (passo do guia de instalação).</p></div>';
      return;
    }
    if (P.editando) return renderEditor();
    var abas = [['pecas', 'Peças'], ['categorias', 'Categorias'], ['loja', 'Loja e PIX'], ['inscritos', 'Grupo do WhatsApp']];
    var html = '<div class="abas" role="tablist">' + abas.map(function (a) {
      return '<button type="button" class="aba" role="tab" data-acao="aba" data-aba="' + a[0] + '" aria-selected="' + (P.aba === a[0]) + '">' + a[1] + '</button>';
    }).join('') + '</div>' + msgHtml();
    if (P.aba === 'pecas') html += htmlPecas();
    else if (P.aba === 'categorias') html += htmlCategorias();
    else if (P.aba === 'loja') html += htmlLoja();
    else html += htmlInscritos();
    app.innerHTML = html;
  }

  function renderLogin() {
    app.innerHTML = '<form class="cartao-login" id="form-login" novalidate><h1>Entrar no painel</h1>' +
      (D.online ? '<p class="ajuda">Use o e-mail e a senha da dona da loja.</p>' : '<p class="msg info">Modo demonstração: qualquer e-mail e senha entram.</p>') +
      msgHtml() +
      '<div class="form-linha"><label for="login-email">E-mail</label><input class="campo" id="login-email" type="email" autocomplete="username" required></div>' +
      '<div class="form-linha"><label for="login-senha">Senha</label><input class="campo" id="login-senha" type="password" autocomplete="current-password" required></div>' +
      '<button type="submit" class="btn btn-escuro btn-largo"' + (P.ocupado ? ' disabled' : '') + '>' + (P.ocupado ? 'Entrando…' : 'Entrar') + '</button></form>';
  }

  // ---------- peças ----------
  function htmlPecas() {
    var cats = categorias();
    var filtro = '<label class="sr-only" for="filtro">Mostrar categoria</label><select class="campo" id="filtro" data-acao-mudar="filtro">' +
      '<option value="todas">Todas as categorias</option>' + cats.map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (P.filtro === c.id ? ' selected' : '') + '>' + esc(c.nome) + '</option>';
      }).join('') + '</select>';
    var html = '<div class="barra"><h1>Peças <span style="font-family: var(--sans); font-size: 14px; color: var(--suave);">(' + produtos().length + ')</span></h1>' +
      '<div style="display: flex; gap: 10px; flex-wrap: wrap;">' + filtro + '<button type="button" class="btn btn-escuro" data-acao="nova-peca">' + icone('mais') + 'Nova peça</button></div></div>';
    var grupos = cats.map(function (c) { return { id: c.id, nome: c.nome, itens: produtos().filter(function (p) { return p.categoria === c.id; }) }; });
    var orfas = produtos().filter(function (p) { return !cats.some(function (c) { return c.id === p.categoria; }); });
    if (orfas.length) grupos.push({ id: '', nome: 'Sem categoria', itens: orfas });
    grupos = grupos.filter(function (g) { return P.filtro === 'todas' || g.id === P.filtro; });
    var algum = false;
    grupos.forEach(function (g) {
      if (!g.itens.length) return;
      algum = true;
      html += '<h2 class="grupo-titulo">' + esc(g.nome) + '</h2>';
      g.itens.forEach(function (p, i) {
        var cores = p.cores || [];
        var tams = (p.tamanhos || []).join(' · ');
        html += '<div class="linha-peca' + (p.visivel === false ? ' escondida' : '') + '" id="peca-' + esc(p.id) + '">' +
          '<img src="' + esc(primeiraFoto(p)) + '" alt="" loading="lazy">' +
          '<div class="linha-info"><strong>' + esc(p.nome) + (p.visivel === false ? ' <span class="etiqueta">Escondida</span>' : '') + '</strong>' +
          '<span>' + dinheiro(p.preco) + ' · ' + cores.length + (cores.length === 1 ? ' cor' : ' cores') + ' · ' + esc(tams) + '</span></div>' +
          '<div class="linha-acoes">' +
          '<button type="button" class="btn-peq" data-acao="subir" data-id="' + esc(p.id) + '" aria-label="Subir ' + esc(p.nome) + ' na vitrine"' + (i === 0 ? ' disabled' : '') + '>' + icone('cima') + '</button>' +
          '<button type="button" class="btn-peq" data-acao="descer" data-id="' + esc(p.id) + '" aria-label="Descer ' + esc(p.nome) + ' na vitrine"' + (i === g.itens.length - 1 ? ' disabled' : '') + '>' + icone('baixo') + '</button>' +
          '<button type="button" class="btn-peq forte" data-acao="editar" data-id="' + esc(p.id) + '">' + icone('editar') + 'Editar</button>' +
          '<button type="button" class="btn-peq" data-acao="visivel" data-id="' + esc(p.id) + '">' + icone('olho') + (p.visivel === false ? 'Mostrar' : 'Esconder') + '</button>' +
          '<button type="button" class="btn-peq perigo" data-acao="excluir" data-id="' + esc(p.id) + '" aria-label="Excluir ' + esc(p.nome) + '">' + icone('lixo') + '</button></div>' +
          (P.confirmar === p.id ? '<div class="confirmar" role="alert"><span>Excluir “' + esc(p.nome) + '” de vez? Isso não tem volta.</span>' +
            '<button type="button" class="btn-peq perigo" data-acao="confirmar-excluir" data-id="' + esc(p.id) + '">Sim, excluir</button>' +
            '<button type="button" class="btn-peq" data-acao="cancelar-excluir">Cancelar</button></div>' : '') +
          '</div>';
      });
    });
    if (!algum) html += '<p class="msg info">Nenhuma peça ' + (P.filtro === 'todas' ? 'cadastrada ainda' : 'nesta categoria') + '. Clique em “Nova peça” para começar.</p>';
    return html;
  }

  function novaPeca() {
    var cat = P.filtro !== 'todas' ? P.filtro : (categorias()[0] || {}).id || '';
    return { id: null, nome: '', categoria: cat, preco: null, _preco: '', descricao: '', tamanhos: ['P', 'M', 'G'], cores: [{ nome: '', amostra: '#E8DCC8', foto: '' }], foto_alta: true, visivel: true, _formato: false };
  }

  function abrirEditor(p) {
    P.editando = p ? Object.assign(copia(p), { _preco: precoParaCampo(p.preco), _formato: true }) : novaPeca();
    if (!P.editando.cores || !P.editando.cores.length) P.editando.cores = [{ nome: '', amostra: '#E8DCC8', foto: '' }];
    P.sujo = false; P.descartar = false; P.msg = null; P.enviando = {};
    render();
    window.scrollTo(0, 0);
    var n = document.getElementById('ed-nome');
    if (n) n.focus();
  }

  function renderEditor() {
    var e = P.editando;
    var extras = (e.tamanhos || []).filter(function (t) { return TAMANHOS.indexOf(t) < 0; }).join(', ');
    var html = '<button type="button" class="link-btn" data-acao="cancelar-edicao" style="padding-left: 0; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">' + icone('voltar') + 'Voltar para a lista</button>' +
      '<div class="barra" style="margin-top: 8px;"><h1>' + (e.id ? 'Editar peça' : 'Nova peça') + '</h1></div>' + msgHtml() +
      '<form id="form-peca" novalidate><div class="bloco"><div class="grade-form">' +
      '<div class="form-linha inteira"><label for="ed-nome">Nome da peça</label><input class="campo" id="ed-nome" data-campo="nome" value="' + esc(e.nome) + '" maxlength="120" required placeholder="Ex.: Vestido Midi Floral"></div>' +
      '<div class="form-linha"><label for="ed-cat">Categoria</label><select class="campo" id="ed-cat" data-campo="categoria">' + categorias().map(function (c) {
        return '<option value="' + esc(c.id) + '"' + (c.id === e.categoria ? ' selected' : '') + '>' + esc(c.nome) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="form-linha"><label for="ed-preco">Preço (R$)</label><input class="campo" id="ed-preco" data-campo="_preco" inputmode="decimal" value="' + esc(e._preco) + '" placeholder="Ex.: 189,90">' +
      '<p class="ajuda">Sem preço, a peça aparece como “Consulte” e não dá para pagar com PIX.</p></div>' +
      '<div class="form-linha inteira"><label for="ed-desc">Descrição</label><textarea class="campo" id="ed-desc" data-campo="descricao" maxlength="600" placeholder="Tecido, modelagem, detalhes…">' + esc(e.descricao) + '</textarea></div>' +
      '<div class="form-linha inteira"><span class="rotulo-campo" id="rot-tam">Tamanhos</span><div class="escolha" role="group" aria-labelledby="rot-tam">' + TAMANHOS.map(function (t) {
        return '<label><input type="checkbox" data-tamanho="' + t + '"' + ((e.tamanhos || []).indexOf(t) >= 0 ? ' checked' : '') + '>' + t + '</label>';
      }).join('') + '</div>' +
      '<label for="ed-extras" class="ajuda" style="margin-top: 6px;">Outros tamanhos, separados por vírgula (ex.: 36, 38, 40)</label><input class="campo" id="ed-extras" data-extras="1" value="' + esc(extras) + '"></div>' +
      '<div class="form-linha"><span class="rotulo-campo" id="rot-formato">Formato da foto na vitrine</span><div class="escolha" role="radiogroup" aria-labelledby="rot-formato">' +
      '<label><input type="radio" name="formato" data-formato="alta"' + (e.foto_alta ? ' checked' : '') + '>Vertical alta</label>' +
      '<label><input type="radio" name="formato" data-formato="padrao"' + (!e.foto_alta ? ' checked' : '') + '>Retrato</label></div></div>' +
      '<div class="form-linha"><span class="rotulo-campo">Na loja</span><div class="escolha"><label><input type="checkbox" data-campo-check="visivel"' + (e.visivel !== false ? ' checked' : '') + '>Mostrar esta peça</label></div></div>' +
      '</div></div>' +
      '<div class="bloco"><div class="barra" style="margin: 0;"><h2>Cores</h2><span class="ajuda">Cada cor tem a sua foto. Na loja, a foto troca quando a cliente toca na cor.</span></div>';
    e.cores.forEach(function (c, i) {
      var enviando = P.enviando[i];
      html += '<div class="cor-cartao"><div class="cor-foto">' + (c.foto ? '<img src="' + esc(c.foto) + '" alt="Foto da cor ' + esc(c.nome) + '">' : (enviando ? 'Enviando…' : 'Sem foto')) + '</div>' +
        '<div class="cor-campos"><div class="form-linha"><label for="cor-nome-' + i + '">Nome da cor</label><input class="campo" id="cor-nome-' + i + '" data-cor-campo="nome" data-i="' + i + '" value="' + esc(c.nome) + '" maxlength="60" placeholder="Ex.: Vermelho"></div>' +
        '<div class="cor-linha"><span class="bolinha-grande" style="background: ' + esc(amostra(c.amostra)) + ';" id="bolinha-' + i + '"></span>' +
        '<label class="sr-only" for="cor-hex-' + i + '">Cor da bolinha de ' + esc(c.nome || 'cor ' + (i + 1)) + '</label><input type="color" id="cor-hex-' + i + '" data-cor-campo="amostra" data-i="' + i + '" value="' + hex6(c.amostra) + '">' +
        '<span class="ajuda">Cor da bolinha</span></div>' +
        '<div class="cor-linha"><span class="btn-peq enviar-foto">' + icone('foto') + (enviando ? 'Enviando…' : (c.foto ? 'Trocar foto' : 'Enviar foto')) +
        '<input type="file" accept="image/*" data-foto-i="' + i + '" aria-label="Escolher foto da cor ' + esc(c.nome || (i + 1)) + '"' + (enviando ? ' disabled' : '') + '></span>' +
        '<button type="button" class="btn-peq" data-acao="cor-subir" data-i="' + i + '" aria-label="Mover cor para cima"' + (i === 0 ? ' disabled' : '') + '>' + icone('cima') + '</button>' +
        '<button type="button" class="btn-peq" data-acao="cor-descer" data-i="' + i + '" aria-label="Mover cor para baixo"' + (i === e.cores.length - 1 ? ' disabled' : '') + '>' + icone('baixo') + '</button>' +
        '<button type="button" class="btn-peq perigo" data-acao="cor-remover" data-i="' + i + '" aria-label="Remover esta cor"' + (e.cores.length === 1 ? ' disabled' : '') + '>' + icone('lixo') + 'Remover</button></div></div></div>';
    });
    html += '<button type="button" class="btn btn-contorno" data-acao="cor-adicionar" style="align-self: flex-start;">' + icone('mais') + 'Adicionar cor</button></div>' +
      '<div class="rodape-form"><button type="submit" class="btn btn-escuro"' + (P.ocupado ? ' disabled' : '') + '>' + (P.ocupado ? 'Salvando…' : 'Salvar peça') + '</button>' +
      '<button type="button" class="link-btn" data-acao="cancelar-edicao">Cancelar</button>' +
      (P.descartar ? '<span class="confirmar" role="alert" style="width: auto; margin: 0;">Sair sem salvar as mudanças? <button type="button" class="btn-peq perigo" data-acao="descartar">Sair sem salvar</button><button type="button" class="btn-peq" data-acao="continuar">Continuar editando</button></span>' : '') +
      '</div></form>';
    app.innerHTML = html;
  }

  function validarPeca(e) {
    if (!e.nome.trim()) return 'Dê um nome para a peça.';
    if (!e.categoria) return 'Escolha a categoria. Se não houver nenhuma, crie na aba Categorias.';
    var preco = lerPreco(e._preco);
    if (!preco.ok) return 'O preço não está num formato válido. Use, por exemplo, 189,90.';
    if (!e.tamanhos.length) return 'Marque pelo menos um tamanho.';
    if (!e.cores.length) return 'Cadastre pelo menos uma cor.';
    var nomes = {};
    for (var i = 0; i < e.cores.length; i++) {
      var n = e.cores[i].nome.trim();
      if (!n) return 'Dê um nome para a cor ' + (i + 1) + '.';
      if (nomes[n.toLowerCase()]) return 'A cor “' + n + '” aparece duas vezes.';
      nomes[n.toLowerCase()] = true;
    }
    if (Object.keys(P.enviando).some(function (k) { return P.enviando[k]; })) return 'Espere a foto terminar de enviar.';
    return '';
  }

  function salvarPeca() {
    var e = P.editando;
    var erro = validarPeca(e);
    if (erro) { P.msg = { tipo: 'erro', texto: erro }; render(); window.scrollTo(0, 0); return; }
    var dados = {
      id: e.id || undefined, nome: e.nome.trim(), categoria: e.categoria, preco: lerPreco(e._preco).valor, descricao: e.descricao.trim(),
      tamanhos: e.tamanhos, foto_alta: !!e.foto_alta, visivel: e.visivel !== false,
      cores: e.cores.map(function (c) { return { nome: c.nome.trim(), amostra: c.amostra || '#E8DCC8', foto: c.foto || '' }; })
    };
    if (!e.id) {
      var mesmas = produtos().filter(function (p) { return p.categoria === e.categoria; });
      dados.ordem = mesmas.length ? Math.min.apply(null, mesmas.map(function (p) { return p.ordem || 0; })) - 1 : 1;
    }
    P.ocupado = true; P.msg = null; render();
    D.salvarProduto(dados).then(function (salvo) {
      var lista = produtos().filter(function (p) { return p.id !== salvo.id; });
      lista.push(salvo);
      P.dados.produtos = ordenar(lista);
      var semPreco = salvo.preco === null || salvo.preco === undefined;
      var semFoto = (salvo.cores || []).some(function (c) { return !c.foto; });
      P.editando = null; P.sujo = false; P.ocupado = false;
      P.msg = semPreco || semFoto ? { tipo: 'info', texto: '“' + salvo.nome + '” foi salva.' + (semPreco ? ' Ela está sem preço.' : '') + (semFoto ? ' Alguma cor está sem foto (a loja mostra a foto de outra cor).' : '') } : null;
      render();
      avisar('Peça salva!');
      var linha = document.getElementById('peca-' + salvo.id);
      if (linha) linha.scrollIntoView({ block: 'center' });
    }).catch(function (err) {
      P.ocupado = false; P.msg = { tipo: 'erro', texto: err.message }; render(); window.scrollTo(0, 0);
    });
  }

  function ordenar(lista) {
    return lista.slice().sort(function (a, b) { return ((a.ordem || 0) - (b.ordem || 0)) || String(a.criado_em || '').localeCompare(String(b.criado_em || '')); });
  }

  function mover(id, passo) {
    var p = produtos().filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    var irmas = produtos().filter(function (x) { return x.categoria === p.categoria; });
    var i = irmas.indexOf(p), j = i + passo;
    if (j < 0 || j >= irmas.length) return;
    var nova = irmas.slice();
    nova.splice(i, 1); nova.splice(j, 0, p);
    var mudancas = [];
    nova.forEach(function (x, k) { if (x.ordem !== k + 1) { mudancas.push({ id: x.id, ordem: k + 1 }); x.ordem = k + 1; } });
    P.dados.produtos = ordenar(produtos());
    render();
    var bt = document.querySelector('[data-acao="' + (passo < 0 ? 'subir' : 'descer') + '"][data-id="' + id + '"]');
    if (bt && !bt.disabled) bt.focus();
    D.salvarOrdem(mudancas).catch(function (err) { P.msg = { tipo: 'erro', texto: err.message }; render(); });
  }

  // ---------- categorias ----------
  function htmlCategorias() {
    var cats = categorias();
    var html = '<div class="barra"><h1>Categorias</h1></div>' +
      '<p class="ajuda" style="margin-bottom: 18px;">O nome aparece no menu da loja. Na página inicial, categorias com o mesmo “título da vitrine” aparecem juntas numa vitrine só.</p>';
    cats.forEach(function (c, i) {
      var qtd = produtos().filter(function (p) { return p.categoria === c.id; }).length;
      html += '<div class="bloco" style="gap: 14px;"><div class="grade-form">' +
        '<div class="form-linha"><label for="cat-nome-' + i + '">Nome no menu</label><input class="campo" id="cat-nome-' + i + '" data-cat-campo="nome" data-id="' + esc(c.id) + '" value="' + esc(c.nome) + '" maxlength="40"></div>' +
        '<div class="form-linha"><label for="cat-secao-' + i + '">Título da vitrine na página inicial</label><input class="campo" id="cat-secao-' + i + '" data-cat-campo="secao" data-id="' + esc(c.id) + '" value="' + esc(c.secao) + '" maxlength="60"></div>' +
        '<div class="form-linha"><label for="cat-chamada-' + i + '">Texto pequeno acima do título</label><input class="campo" id="cat-chamada-' + i + '" data-cat-campo="chamada" data-id="' + esc(c.id) + '" value="' + esc(c.chamada) + '" maxlength="40" placeholder="Ex.: Lançamentos"></div>' +
        '<div class="form-linha"><label for="cat-nota-' + i + '">Frase abaixo do título</label><input class="campo" id="cat-nota-' + i + '" data-cat-campo="nota" data-id="' + esc(c.id) + '" value="' + esc(c.nota) + '" maxlength="80" placeholder="Ex.: Tamanhos P, M e G"></div>' +
        '</div><div class="linha-acoes" style="justify-content: space-between;"><span class="ajuda">' + qtd + (qtd === 1 ? ' peça' : ' peças') + '</span><span style="display: flex; gap: 6px; flex-wrap: wrap;">' +
        '<button type="button" class="btn-peq" data-acao="cat-subir" data-id="' + esc(c.id) + '" aria-label="Subir categoria ' + esc(c.nome) + '"' + (i === 0 ? ' disabled' : '') + '>' + icone('cima') + '</button>' +
        '<button type="button" class="btn-peq" data-acao="cat-descer" data-id="' + esc(c.id) + '" aria-label="Descer categoria ' + esc(c.nome) + '"' + (i === cats.length - 1 ? ' disabled' : '') + '>' + icone('baixo') + '</button>' +
        '<button type="button" class="btn-peq forte" data-acao="cat-salvar" data-id="' + esc(c.id) + '">Salvar</button>' +
        '<button type="button" class="btn-peq perigo" data-acao="cat-excluir" data-id="' + esc(c.id) + '">' + icone('lixo') + 'Excluir</button></span></div>' +
        (P.confirmarCat === c.id ? '<div class="confirmar" role="alert"><span>' + (qtd ? 'Esta categoria tem ' + qtd + (qtd === 1 ? ' peça. Mude a peça' : ' peças. Mude as peças') + ' de categoria antes de excluir.' : 'Excluir a categoria “' + esc(c.nome) + '”?') + '</span>' +
          (qtd ? '' : '<button type="button" class="btn-peq perigo" data-acao="cat-confirmar" data-id="' + esc(c.id) + '">Sim, excluir</button>') +
          '<button type="button" class="btn-peq" data-acao="cat-cancelar">' + (qtd ? 'Entendi' : 'Cancelar') + '</button></div>' : '') +
        '</div>';
    });
    html += '<form class="bloco" id="form-categoria" style="gap: 12px;"><h2>Nova categoria</h2><div class="cor-linha">' +
      '<label class="sr-only" for="nova-cat">Nome da nova categoria</label><input class="campo" id="nova-cat" style="flex: 1 1 240px; width: auto;" maxlength="40" placeholder="Ex.: Calças" value="' + esc(P.novaCat) + '">' +
      '<button type="submit" class="btn btn-escuro">' + icone('mais') + 'Criar</button></div></form>';
    return html;
  }

  function moverCategoria(id, passo) {
    var cats = categorias().slice();
    var i = cats.map(function (c) { return c.id; }).indexOf(id), j = i + passo;
    if (i < 0 || j < 0 || j >= cats.length) return;
    var c = cats.splice(i, 1)[0];
    cats.splice(j, 0, c);
    var salvar = [];
    cats.forEach(function (x, k) { if (x.ordem !== k + 1) { x.ordem = k + 1; salvar.push(x); } });
    P.dados.categorias = cats;
    render();
    salvar.reduce(function (pr, x) { return pr.then(function () { return D.salvarCategoria(x, false); }); }, Promise.resolve())
      .catch(function (err) { P.msg = { tipo: 'erro', texto: err.message }; render(); });
  }

  // ---------- loja e PIX ----------
  function htmlLoja() {
    var c = P.cfg;
    var fotos = [];
    produtos().forEach(function (p) {
      (p.cores || []).forEach(function (cor) { if (cor.foto) fotos.push({ url: cor.foto, alt: 'Modelo usando ' + p.nome + ' na cor ' + cor.nome }); });
    });
    var campo = function (id, rotulo, extra, tipo) {
      return '<div class="form-linha' + (extra && extra.inteira ? ' inteira' : '') + '"><label for="cfg-' + id + '">' + rotulo + '</label>' +
        (tipo === 'area' ? '<textarea class="campo" id="cfg-' + id + '" data-cfg="' + id + '" maxlength="400">' + esc(c[id]) + '</textarea>'
          : '<input class="campo" id="cfg-' + id + '" data-cfg="' + id + '" value="' + esc(c[id]) + '"' + (extra && extra.ph ? ' placeholder="' + esc(extra.ph) + '"' : '') + (extra && extra.modo ? ' inputmode="' + extra.modo + '"' : '') + ' maxlength="' + ((extra && extra.max) || 200) + '">') +
        (extra && extra.ajuda ? '<p class="ajuda">' + extra.ajuda + '</p>' : '') + '</div>';
    };
    return '<form id="form-loja" novalidate><div class="barra"><h1>Loja e PIX</h1></div>' +
      '<div class="bloco"><h2>Pagamento com PIX</h2><div class="grade-form">' +
      '<div class="form-linha"><label for="cfg-pix_tipo">Tipo da chave</label><select class="campo" id="cfg-pix_tipo" data-cfg="pix_tipo"><option value="">Escolha o tipo</option>' +
      Pix.TIPOS.map(function (t) { return '<option' + (c.pix_tipo === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
      campo('pix_chave', 'Chave PIX', { ph: 'Como aparece no app do banco', max: 100 }) +
      campo('pix_nome', 'Nome de quem recebe', { max: 60, ajuda: 'Vai no código sem acentos, com até 25 letras.' }) +
      campo('pix_cidade', 'Cidade de quem recebe', { max: 60, ph: 'Ex.: São Luís' }) +
      '</div><div id="pix-status">' + htmlPixStatus() + '</div></div>' +
      '<div class="bloco"><h2>Contato e entrega</h2><div class="grade-form">' +
      campo('whatsapp', 'WhatsApp da loja', { ph: '(11) 98765-4321', modo: 'tel', max: 30, ajuda: 'É para este número que vai o pedido com o comprovante.' }) +
      campo('email', 'E-mail', { max: 120 }) +
      campo('instagram', 'Instagram', { ph: '@elegancia', max: 60 }) +
      campo('endereco', 'Endereço', { max: 200 }) +
      campo('entrega', 'Como funciona a entrega', { inteira: true }, 'area') +
      '</div></div>' +
      '<div class="bloco"><h2>Página inicial</h2><div class="grade-form">' +
      campo('aviso', 'Aviso na faixa do topo', { inteira: true, max: 120, ajuda: 'Deixe em branco para esconder a faixa.' }) +
      campo('hero_chamada', 'Texto pequeno do banner', { max: 60, ph: 'Coleção de festas' }) +
      campo('hero_detalhe', 'Detalhe do banner', { max: 80 }) +
      campo('hero_texto', 'Texto do banner', { inteira: true }, 'area') +
      '<div class="form-linha inteira"><label for="cfg-destaque">Peça na faixa de destaque</label><select class="campo" id="cfg-destaque" data-cfg="destaque"><option value="">Nenhuma</option>' +
      produtos().map(function (p) { return '<option value="' + esc(p.id) + '"' + (c.destaque === p.id ? ' selected' : '') + '>' + esc(p.nome) + '</option>'; }).join('') + '</select>' +
      '<p class="ajuda">Aparece numa faixa grande logo depois da primeira vitrine.</p></div>' +
      '<div class="form-linha inteira"><span class="rotulo-campo">Foto do banner</span><div class="cor-linha" style="align-items: flex-start;">' +
      '<div class="cor-foto">' + (c.banner_foto ? '<img src="' + esc(c.banner_foto) + '" alt="Foto atual do banner">' : 'Sem foto') + '</div>' +
      '<div class="coluna" style="flex: 1 1 240px; min-width: 0;"><p class="ajuda">Toque numa foto das peças ou envie outra.</p>' +
      '<span class="btn-peq enviar-foto" style="align-self: flex-start;">' + icone('foto') + (P.enviando.banner ? 'Enviando…' : 'Enviar outra foto') + '<input type="file" accept="image/*" data-foto-banner="1" aria-label="Enviar foto do banner"></span></div></div>' +
      '<div class="fotos-banner" role="group" aria-label="Fotos das peças">' + fotos.map(function (f) {
        return '<button type="button" data-acao="banner" data-url="' + esc(f.url) + '" data-alt="' + esc(f.alt) + '" aria-pressed="' + (c.banner_foto === f.url) + '" aria-label="' + esc(f.alt) + '"><img src="' + esc(f.url) + '" alt="" loading="lazy"></button>';
      }).join('') + '</div></div>' +
      '</div></div>' +
      '<div class="rodape-form"><button type="submit" class="btn btn-escuro"' + (P.ocupado ? ' disabled' : '') + '>' + (P.ocupado ? 'Salvando…' : 'Salvar') + '</button></div></form>';
  }

  function htmlPixStatus() {
    var r = Pix.conferir(P.cfg);
    if (!r.ok) {
      var faltando = r.faltando.length ? 'Falta preencher: ' + r.faltando.join(', ').replace(/ da loja| do recebedor/g, '') + '.' : '';
      return '<p class="msg ' + (r.erro ? 'erro' : 'info') + '">' + esc([faltando, r.erro].filter(Boolean).join(' ')) + ' Sem isso, a loja não mostra o QR code.</p>';
    }
    var teste = Pix.payload({ chave: r.chave, nome: r.nome, cidade: r.cidade, valor: '1.00', txid: 'TESTE', descricao: '' });
    return '<div class="coluna"><p class="msg ok">Chave válida: ' + esc(r.chave) + '. Os pedidos vão gerar o QR code com o valor certo.</p>' +
      '<p class="ajuda">Para conferir se o dinheiro vai para a conta certa, copie o código de teste abaixo (R$ 1,00), cole no app do seu banco em “PIX copia e cola” e veja o nome que aparece. Não precisa pagar.</p>' +
      '<p class="copia-cola" id="pix-teste">' + esc(teste) + '</p>' +
      '<button type="button" class="btn-peq" data-acao="copiar-teste" style="align-self: flex-start;">' + icone('copiar') + 'Copiar código de teste</button></div>';
  }

  function salvarLoja() {
    var c = P.cfg;
    if (c.whatsapp && !Pix.whatsapp(c.whatsapp)) { P.msg = { tipo: 'erro', texto: 'O WhatsApp não parece válido. Use DDD + número, como (11) 98765-4321.' }; render(); window.scrollTo(0, 0); return; }
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) { P.msg = { tipo: 'erro', texto: 'O e-mail não parece válido.' }; render(); window.scrollTo(0, 0); return; }
    var r = Pix.conferir(c);
    var dados = Object.assign({}, c, { destaque: c.destaque || null });
    if (r.ok) dados.pix_chave = String(c.pix_chave).trim();
    P.ocupado = true; P.msg = null; render();
    D.salvarConfig(dados).then(function (salvo) {
      P.dados.config = salvo; P.cfg = copia(salvo); P.ocupado = false;
      P.msg = r.ok ? null : { tipo: 'info', texto: 'Salvo. O PIX ainda não está completo, então a loja não mostra o QR code.' };
      render(); avisar('Dados da loja salvos!');
    }).catch(function (err) { P.ocupado = false; P.msg = { tipo: 'erro', texto: err.message }; render(); window.scrollTo(0, 0); });
  }

  // ---------- novidades por e-mail ----------
  function htmlInscritos() {
    if (!P.inscritos) return '<p class="carregando" style="padding: 40px 0;">Carregando a lista…</p>';
    var lista = P.inscritos.filter(function (x) { return x.whatsapp; });
    var html = '<div class="barra"><h1>Grupo do WhatsApp</h1>' + (lista.length ? '<button type="button" class="btn btn-contorno" data-acao="copiar-numeros">' + icone('copiar') + 'Copiar todos os números</button>' : '') + '</div>' +
      '<p class="ajuda" style="margin-bottom: 18px;">Clientes que pediram para entrar no grupo de novidades. Adicione cada uma no grupo e, depois, apague da lista para saber quem já entrou.</p>';
    if (!lista.length) return html + '<p class="msg info">Ninguém pediu para entrar ainda.</p>';
    html += '<table class="tabela-simples"><thead><tr><th>Nome</th><th>WhatsApp</th><th>Data</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>';
    lista.forEach(function (x) {
      var d = x.criado_em ? new Date(x.criado_em).toLocaleDateString('pt-BR') : '';
      var tel = Pix.formatarTelefone(x.whatsapp);
      html += '<tr><td>' + esc(x.nome || '—') + '</td><td style="white-space: nowrap;"><a href="https://wa.me/' + esc(x.whatsapp) + '" target="_blank" rel="noopener noreferrer">' + esc(tel) + '</a></td><td>' + esc(d) + '</td>' +
        '<td style="text-align: right;"><button type="button" class="btn-peq perigo" data-acao="remover-inscrito" data-id="' + esc(x.id) + '" aria-label="Apagar ' + esc(x.nome || tel) + ' da lista">' + icone('lixo') + '</button></td></tr>';
    });
    return html + '</tbody></table>';
  }

  function copiarTexto(texto, ok) {
    var falhou = function () { avisar('Não deu para copiar. Selecione o texto e copie.'); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(function () { avisar(ok); }, falhou);
      else falhou();
    } catch (e) { falhou(); }
  }

  // ---------- eventos ----------
  app.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao]');
    if (!el) return;
    var acao = el.getAttribute('data-acao');
    var id = el.getAttribute('data-id');
    var e = P.editando;
    var i = Number(el.getAttribute('data-i'));
    switch (acao) {
      case 'aba':
        P.aba = el.getAttribute('data-aba'); P.msg = null; P.confirmar = null; P.confirmarCat = null;
        if (P.aba === 'loja') P.cfg = copia(P.dados.config || {});
        render();
        if (P.aba === 'inscritos') {
          D.listarInscritos().then(function (l) { P.inscritos = l; render(); }).catch(function (err) { P.inscritos = []; P.msg = { tipo: 'erro', texto: err.message }; render(); });
        }
        var aba = app.querySelector('[data-aba="' + P.aba + '"]');
        if (aba) aba.focus();
        break;
      case 'nova-peca': abrirEditor(null); break;
      case 'editar': abrirEditor(produtos().filter(function (p) { return p.id === id; })[0]); break;
      case 'subir': mover(id, -1); break;
      case 'descer': mover(id, 1); break;
      case 'visivel':
        var p = produtos().filter(function (x) { return x.id === id; })[0];
        if (!p) return;
        var novo = p.visivel === false;
        D.salvarProduto({ id: id, visivel: novo }).then(function (s) {
          p.visivel = s.visivel; render(); avisar(novo ? 'A peça voltou para a loja.' : 'A peça foi escondida da loja.');
        }).catch(function (err) { P.msg = { tipo: 'erro', texto: err.message }; render(); });
        break;
      case 'excluir': P.confirmar = id; render(); var cf = app.querySelector('[data-acao="confirmar-excluir"]'); if (cf) cf.focus(); break;
      case 'cancelar-excluir': P.confirmar = null; render(); break;
      case 'confirmar-excluir':
        D.excluirProduto(id).then(function () {
          P.dados.produtos = produtos().filter(function (x) { return x.id !== id; });
          if (P.dados.config && P.dados.config.destaque === id) P.dados.config.destaque = null;
          P.confirmar = null; render(); avisar('Peça excluída.');
        }).catch(function (err) { P.confirmar = null; P.msg = { tipo: 'erro', texto: err.message }; render(); });
        break;
      case 'cancelar-edicao':
        if (P.sujo) { P.descartar = true; render(); var d = app.querySelector('[data-acao="descartar"]'); if (d) d.focus(); }
        else { P.editando = null; P.msg = null; render(); }
        break;
      case 'descartar': P.editando = null; P.sujo = false; P.descartar = false; P.msg = null; render(); break;
      case 'continuar': P.descartar = false; render(); break;
      case 'cor-adicionar':
        e.cores.push({ nome: '', amostra: '#E8DCC8', foto: '' }); P.sujo = true; render();
        var n = document.getElementById('cor-nome-' + (e.cores.length - 1)); if (n) n.focus();
        break;
      case 'cor-remover': if (e.cores.length > 1) { e.cores.splice(i, 1); P.enviando = {}; P.sujo = true; render(); } break;
      case 'cor-subir':
      case 'cor-descer':
        var j = acao === 'cor-subir' ? i - 1 : i + 1;
        if (j < 0 || j >= e.cores.length) return;
        var tmp = e.cores[i]; e.cores[i] = e.cores[j]; e.cores[j] = tmp; P.sujo = true; render();
        break;
      case 'cat-subir': moverCategoria(id, -1); break;
      case 'cat-descer': moverCategoria(id, 1); break;
      case 'cat-salvar':
        var c = categorias().filter(function (x) { return x.id === id; })[0];
        if (!c) return;
        if (!String(c.nome || '').trim()) { P.msg = { tipo: 'erro', texto: 'O nome da categoria não pode ficar vazio.' }; render(); return; }
        c.nome = c.nome.trim(); c.secao = String(c.secao || '').trim() || c.nome;
        D.salvarCategoria(c, false).then(function () { P.msg = null; render(); avisar('Categoria salva!'); })
          .catch(function (err) { P.msg = { tipo: 'erro', texto: err.message }; render(); });
        break;
      case 'cat-excluir': P.confirmarCat = id; render(); break;
      case 'cat-cancelar': P.confirmarCat = null; render(); break;
      case 'cat-confirmar':
        D.excluirCategoria(id).then(function () {
          P.dados.categorias = categorias().filter(function (x) { return x.id !== id; }); P.confirmarCat = null; render(); avisar('Categoria excluída.');
        }).catch(function (err) { P.confirmarCat = null; P.msg = { tipo: 'erro', texto: err.message }; render(); });
        break;
      case 'banner':
        P.cfg.banner_foto = el.getAttribute('data-url'); P.cfg.banner_alt = el.getAttribute('data-alt');
        var y = window.scrollY; render(); window.scrollTo(0, y);
        break;
      case 'copiar-teste': copiarTexto(document.getElementById('pix-teste').textContent, 'Código de teste copiado!'); break;
      case 'copiar-numeros':
        copiarTexto(P.inscritos.filter(function (x) { return x.whatsapp; }).map(function (x) {
          return (x.nome ? x.nome + ': ' : '') + Pix.formatarTelefone(x.whatsapp);
        }).join('\n'), 'Números copiados!');
        break;
      case 'remover-inscrito':
        D.excluirInscrito(id).then(function () { P.inscritos = P.inscritos.filter(function (x) { return x.id !== id; }); render(); })
          .catch(function (err) { P.msg = { tipo: 'erro', texto: err.message }; render(); });
        break;
    }
  });

  app.addEventListener('input', function (ev) {
    var t = ev.target, e = P.editando;
    if (e && t.hasAttribute('data-campo')) { e[t.getAttribute('data-campo')] = t.value; P.sujo = true; return; }
    if (e && t.hasAttribute('data-cor-campo')) {
      var i = Number(t.getAttribute('data-i'));
      e.cores[i][t.getAttribute('data-cor-campo')] = t.value; P.sujo = true;
      if (t.getAttribute('data-cor-campo') === 'amostra') document.getElementById('bolinha-' + i).style.background = t.value;
      return;
    }
    if (e && t.hasAttribute('data-extras')) {
      var base = e.tamanhos.filter(function (x) { return TAMANHOS.indexOf(x) >= 0; });
      var extras = t.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 12);
      if (extras.length) base = base.filter(function (x) { return x !== 'Único'; });
      e.tamanhos = base.concat(extras.filter(function (x, k) { return extras.indexOf(x) === k && TAMANHOS.indexOf(x) < 0; }));
      P.sujo = true;
      return;
    }
    if (P.cfg && t.hasAttribute('data-cfg')) {
      P.cfg[t.getAttribute('data-cfg')] = t.value;
      if (/^pix_/.test(t.getAttribute('data-cfg'))) document.getElementById('pix-status').innerHTML = htmlPixStatus();
      return;
    }
    if (t.hasAttribute('data-cat-campo')) {
      var c = categorias().filter(function (x) { return x.id === t.getAttribute('data-id'); })[0];
      if (c) c[t.getAttribute('data-cat-campo')] = t.value;
      return;
    }
    if (t.id === 'nova-cat') P.novaCat = t.value;
  });

  app.addEventListener('change', function (ev) {
    var t = ev.target, e = P.editando;
    if (t.id === 'filtro') { P.filtro = t.value; render(); var f = document.getElementById('filtro'); if (f) f.focus(); return; }
    if (P.cfg && t.hasAttribute('data-cfg') && t.tagName === 'SELECT') {
      P.cfg[t.getAttribute('data-cfg')] = t.value;
      if (t.getAttribute('data-cfg') === 'pix_tipo') document.getElementById('pix-status').innerHTML = htmlPixStatus();
      return;
    }
    if (e && t.hasAttribute('data-campo') && t.tagName === 'SELECT') { e[t.getAttribute('data-campo')] = t.value; P.sujo = true; return; }
    if (e && t.hasAttribute('data-tamanho')) {
      var tam = t.getAttribute('data-tamanho');
      if (t.checked) {
        e.tamanhos = tam === 'Único' ? ['Único'] : e.tamanhos.filter(function (x) { return x !== 'Único'; }).concat([tam]);
      } else {
        e.tamanhos = e.tamanhos.filter(function (x) { return x !== tam; });
      }
      var extras = e.tamanhos.filter(function (x) { return TAMANHOS.indexOf(x) < 0; });
      e.tamanhos = TAMANHOS.filter(function (x) { return e.tamanhos.indexOf(x) >= 0; }).concat(extras);
      P.sujo = true; render();
      var cb = app.querySelector('[data-tamanho="' + tam + '"]'); if (cb) cb.focus();
      return;
    }
    if (e && t.hasAttribute('data-formato')) { e.foto_alta = t.getAttribute('data-formato') === 'alta'; e._formato = true; P.sujo = true; return; }
    if (e && t.hasAttribute('data-campo-check')) { e[t.getAttribute('data-campo-check')] = t.checked; P.sujo = true; return; }
    if (e && t.hasAttribute('data-foto-i') && t.files && t.files[0]) {
      var i = Number(t.getAttribute('data-foto-i'));
      var cor = e.cores[i];
      P.enviando[i] = true; P.msg = null; render();
      D.enviarFoto(t.files[0]).then(function (r) {
        cor.foto = r.url; P.sujo = true;
        if (!e._formato) e.foto_alta = r.alta;
      }).catch(function (err) { P.msg = { tipo: 'erro', texto: err.message }; })
        .then(function () { P.enviando[i] = false; if (P.editando === e) render(); });
      return;
    }
    if (P.cfg && t.hasAttribute('data-foto-banner') && t.files && t.files[0]) {
      P.enviando.banner = true; render();
      D.enviarFoto(t.files[0]).then(function (r) { P.cfg.banner_foto = r.url; P.cfg.banner_alt = 'Foto de destaque da Elegância de Mulher'; })
        .catch(function (err) { P.msg = { tipo: 'erro', texto: err.message }; })
        .then(function () { P.enviando.banner = false; render(); });
    }
  });

  app.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = ev.target;
    if (f.id === 'form-login') {
      var email = document.getElementById('login-email').value, senha = document.getElementById('login-senha').value;
      if (D.online && (!email || !senha)) { P.msg = { tipo: 'erro', texto: 'Preencha o e-mail e a senha.' }; render(); return; }
      P.ocupado = true; P.msg = null; render();
      D.entrar(email, senha).then(function () { P.ocupado = false; return depoisDeEntrar(); })
        .catch(function (err) { P.ocupado = false; P.msg = { tipo: 'erro', texto: err.message }; render(); });
    } else if (f.id === 'form-peca') salvarPeca();
    else if (f.id === 'form-loja') salvarLoja();
    else if (f.id === 'form-categoria') {
      var nome = P.novaCat.trim();
      if (!nome) return;
      var id = slug(nome) || 'categoria';
      if (categorias().some(function (c) { return c.id === id; })) { P.msg = { tipo: 'erro', texto: 'Já existe uma categoria com esse nome.' }; render(); return; }
      var nova = { id: id, nome: nome, secao: nome, chamada: '', nota: '', ordem: categorias().length + 1 };
      D.salvarCategoria(nova, true).then(function (s) {
        P.dados.categorias = categorias().concat([s]); P.novaCat = ''; P.msg = null; render(); avisar('Categoria criada!');
      }).catch(function (err) { P.msg = { tipo: 'erro', texto: err.message }; render(); });
    }
  });

  document.getElementById('sair').addEventListener('click', function () {
    D.sair().then(function () { P.vista = 'login'; P.dados = null; P.editando = null; P.msg = null; render(); });
  });
  document.getElementById('restaurar-demo').addEventListener('click', function () {
    D.restaurarDemo();
    window.location.reload();
  });
  window.addEventListener('beforeunload', function (ev) {
    if (P.editando && P.sujo) { ev.preventDefault(); ev.returnValue = ''; }
  });

  // ---------- início ----------
  function depoisDeEntrar() {
    return D.ehAdmin().then(function (ok) {
      if (!ok) { P.vista = 'sem-permissao'; render(); return; }
      return D.carregarTudo().then(function (dados) {
        P.dados = dados; P.cfg = copia(dados.config || {}); P.vista = 'painel'; P.msg = null; render();
      });
    }).catch(function (err) { P.vista = 'login'; P.msg = { tipo: 'erro', texto: err.message }; render(); });
  }

  document.getElementById('faixa-demo').hidden = D.online;
  if (D.online && !D.pronto) {
    app.innerHTML = '<p class="msg erro">A biblioteca do banco de dados não carregou. Confira se a pasta js foi enviada inteira.</p>';
    return;
  }
  D.sessao().then(function (u) {
    if (u) return depoisDeEntrar();
    P.vista = 'login'; render();
  }).catch(function () { P.vista = 'login'; render(); });
})();
