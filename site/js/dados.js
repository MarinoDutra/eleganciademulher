/* Camada de dados: lê e grava peças, categorias e configurações.
   Com o Supabase configurado em js/config.js, usa o banco de dados online.
   Sem ele, usa o modo demonstração (dados iniciais + mudanças guardadas neste navegador). */
(function () {
  'use strict';

  var cfg = window.LOJA_CONFIG || {};
  var online = !!(cfg.supabaseUrl && cfg.supabaseKey);
  var sb = null;
  if (online && window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(cfg.supabaseUrl.trim(), cfg.supabaseKey.trim());
  }
  var CHAVE_DEMO = 'elegancia-demo-v1';
  var BUCKET = 'fotos';

  function copia(o) { return JSON.parse(JSON.stringify(o)); }

  function ordenarProdutos(lista) {
    return lista.slice().sort(function (a, b) {
      return (a.ordem - b.ordem) || String(a.criado_em || '').localeCompare(String(b.criado_em || '')) || a.nome.localeCompare(b.nome);
    });
  }
  function ordenarCategorias(lista) {
    return lista.slice().sort(function (a, b) { return (a.ordem - b.ordem) || a.nome.localeCompare(b.nome); });
  }

  // Mensagens de erro em português para o painel
  function traduzir(err) {
    var m = String((err && (err.message || err.error_description || err)) || '');
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(m)) return 'Este e-mail ainda não foi confirmado no Supabase.';
    if (/row-level security|permission denied|not authorized|Unauthorized/i.test(m)) return 'Sua conta não tem permissão para mudar a loja.';
    if (/Failed to fetch|NetworkError|Load failed|network/i.test(m)) return 'Sem conexão com o banco de dados. Confira a internet e tente de novo.';
    if (/foreign key|violates foreign key/i.test(m)) return 'Esta categoria ainda tem peças. Mude as peças de categoria antes de excluir.';
    if (/duplicate key|already exists/i.test(m)) return 'Já existe um item com esse identificador.';
    if (/Payload too large|exceeded the maximum allowed size|too large/i.test(m)) return 'A foto é grande demais. Tente outra imagem.';
    return m || 'Algo deu errado. Tente de novo.';
  }

  function checar(res) {
    if (res && res.error) throw new Error(traduzir(res.error));
    return res ? res.data : null;
  }

  // ---------- modo demonstração ----------
  function demoLer() {
    try {
      var s = window.localStorage.getItem(CHAVE_DEMO);
      if (s) return JSON.parse(s);
    } catch (e) { /* sem armazenamento: usa os dados iniciais */ }
    var d = copia(window.DADOS_INICIAIS || { categorias: [], produtos: [], config: { id: 1 } });
    d.inscritos = d.inscritos || [];
    return d;
  }
  function demoGravar(d) {
    try {
      window.localStorage.setItem(CHAVE_DEMO, JSON.stringify(d));
    } catch (e) {
      throw new Error('O navegador não deixou guardar a mudança (espaço cheio). No site de verdade isso não acontece.');
    }
  }
  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
      var r = Math.random() * 16 | 0; return (ch === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function esperar(v) { return new Promise(function (ok) { setTimeout(function () { ok(v); }, 120); }); }

  var CAMPOS_PRODUTO = ['nome', 'categoria', 'preco', 'descricao', 'tamanhos', 'cores', 'foto_alta', 'visivel', 'ordem'];
  var CAMPOS_CATEGORIA = ['id', 'nome', 'secao', 'chamada', 'nota', 'ordem'];
  var CAMPOS_CONFIG = ['aviso', 'hero_chamada', 'hero_texto', 'hero_detalhe', 'banner_foto', 'banner_alt', 'destaque',
    'pix_chave', 'pix_tipo', 'pix_nome', 'pix_cidade', 'whatsapp', 'email', 'instagram', 'endereco', 'entrega'];
  function so(obj, campos) {
    var r = {};
    campos.forEach(function (k) { if (Object.prototype.hasOwnProperty.call(obj, k)) r[k] = obj[k]; });
    return r;
  }

  var api = {
    online: online,
    pronto: !online || !!sb,

    // Tudo o que a vitrine precisa (só peças visíveis)
    carregarLoja: async function () {
      if (!online) {
        var d = demoLer();
        return esperar({
          config: d.config || {},
          categorias: ordenarCategorias(d.categorias || []),
          produtos: ordenarProdutos((d.produtos || []).filter(function (p) { return p.visivel !== false; }))
        });
      }
      if (!sb) throw new Error('A biblioteca do Supabase não carregou.');
      var r = await Promise.all([
        sb.from('config').select('*').eq('id', 1).maybeSingle(),
        sb.from('categorias').select('*').order('ordem'),
        sb.from('produtos').select('*').eq('visivel', true).order('ordem').order('criado_em')
      ]);
      return { config: checar(r[0]) || {}, categorias: ordenarCategorias(checar(r[1]) || []), produtos: ordenarProdutos(checar(r[2]) || []) };
    },

    // Para o painel: inclui peças escondidas
    carregarTudo: async function () {
      if (!online) {
        var d = demoLer();
        return esperar({ config: d.config || {}, categorias: ordenarCategorias(d.categorias || []), produtos: ordenarProdutos(d.produtos || []) });
      }
      var r = await Promise.all([
        sb.from('config').select('*').eq('id', 1).maybeSingle(),
        sb.from('categorias').select('*').order('ordem'),
        sb.from('produtos').select('*').order('ordem').order('criado_em')
      ]);
      return { config: checar(r[0]) || {}, categorias: ordenarCategorias(checar(r[1]) || []), produtos: ordenarProdutos(checar(r[2]) || []) };
    },

    // ---------- login ----------
    sessao: async function () {
      if (!online) {
        try { return window.sessionStorage.getItem('elegancia-demo-login') ? { email: 'demonstracao' } : null; } catch (e) { return null; }
      }
      var r = await sb.auth.getSession();
      return r.data && r.data.session ? r.data.session.user : null;
    },
    entrar: async function (email, senha) {
      if (!online) {
        try { window.sessionStorage.setItem('elegancia-demo-login', '1'); } catch (e) { /* segue sem lembrar */ }
        return esperar({ email: email || 'demonstracao' });
      }
      var r = await sb.auth.signInWithPassword({ email: String(email || '').trim(), password: senha || '' });
      checar(r);
      return r.data.user;
    },
    sair: async function () {
      if (!online) { try { window.sessionStorage.removeItem('elegancia-demo-login'); } catch (e) { /* nada */ } return; }
      await sb.auth.signOut();
    },
    ehAdmin: async function () {
      if (!online) return true;
      var r = await sb.rpc('is_admin');
      if (r.error) throw new Error(traduzir(r.error));
      return r.data === true;
    },

    // ---------- peças ----------
    salvarProduto: async function (p) {
      var dados = so(p, CAMPOS_PRODUTO);
      if (!online) {
        var d = demoLer();
        var agora = new Date().toISOString();
        var salvo;
        if (p.id) {
          d.produtos = d.produtos.map(function (x) {
            if (x.id !== p.id) return x;
            salvo = Object.assign({}, x, dados, { atualizado_em: agora });
            return salvo;
          });
        } else {
          salvo = Object.assign({ id: uuid(), criado_em: agora, atualizado_em: agora }, dados);
          d.produtos.push(salvo);
        }
        demoGravar(d);
        return esperar(copia(salvo));
      }
      var r = p.id
        ? await sb.from('produtos').update(dados).eq('id', p.id).select().single()
        : await sb.from('produtos').insert(dados).select().single();
      return checar(r);
    },
    excluirProduto: async function (id) {
      if (!online) {
        var d = demoLer();
        d.produtos = d.produtos.filter(function (x) { return x.id !== id; });
        if (d.config && d.config.destaque === id) d.config.destaque = null;
        demoGravar(d);
        return esperar(true);
      }
      checar(await sb.from('produtos').delete().eq('id', id));
      return true;
    },
    // mudancas: [{ id, ordem }]
    salvarOrdem: async function (mudancas) {
      if (!online) {
        var d = demoLer();
        var mapa = {};
        mudancas.forEach(function (m) { mapa[m.id] = m.ordem; });
        d.produtos.forEach(function (x) { if (mapa[x.id] !== undefined) x.ordem = mapa[x.id]; });
        demoGravar(d);
        return esperar(true);
      }
      for (var i = 0; i < mudancas.length; i++) {
        checar(await sb.from('produtos').update({ ordem: mudancas[i].ordem }).eq('id', mudancas[i].id));
      }
      return true;
    },

    // ---------- categorias ----------
    salvarCategoria: async function (c, nova) {
      var dados = so(c, CAMPOS_CATEGORIA);
      if (!online) {
        var d = demoLer();
        if (nova) {
          if (d.categorias.some(function (x) { return x.id === c.id; })) throw new Error('Já existe uma categoria com esse nome.');
          d.categorias.push(dados);
        } else {
          d.categorias = d.categorias.map(function (x) { return x.id === c.id ? Object.assign({}, x, dados) : x; });
        }
        demoGravar(d);
        return esperar(copia(dados));
      }
      var r = nova
        ? await sb.from('categorias').insert(dados).select().single()
        : await sb.from('categorias').update(dados).eq('id', c.id).select().single();
      return checar(r);
    },
    excluirCategoria: async function (id) {
      if (!online) {
        var d = demoLer();
        if (d.produtos.some(function (p) { return p.categoria === id; })) throw new Error(traduzir('foreign key'));
        d.categorias = d.categorias.filter(function (x) { return x.id !== id; });
        demoGravar(d);
        return esperar(true);
      }
      checar(await sb.from('categorias').delete().eq('id', id));
      return true;
    },

    // ---------- configurações ----------
    salvarConfig: async function (c) {
      var dados = so(c, CAMPOS_CONFIG);
      if (!online) {
        var d = demoLer();
        d.config = Object.assign({}, d.config, dados, { id: 1 });
        demoGravar(d);
        return esperar(copia(d.config));
      }
      return checar(await sb.from('config').update(dados).eq('id', 1).select().single());
    },

    // ---------- fotos ----------
    // Recebe um arquivo de imagem, reduz para no máximo 1600 px e envia. Devolve { url, alta }.
    enviarFoto: async function (arquivo) {
      var img = await carregarImagem(arquivo);
      var maior = online ? 1600 : 900;
      var escala = Math.min(1, maior / Math.max(img.width, img.height));
      var w = Math.round(img.width * escala), h = Math.round(img.height * escala);
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      var alta = h / w >= 1.5;
      if (!online) return { url: canvas.toDataURL('image/jpeg', 0.8), alta: alta };
      var blob = await new Promise(function (ok) { canvas.toBlob(ok, 'image/jpeg', 0.85); });
      if (!blob) throw new Error('Não deu para preparar a foto. Tente outra imagem.');
      var nome = 'produtos/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
      checar(await sb.storage.from(BUCKET).upload(nome, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false }));
      return { url: sb.storage.from(BUCKET).getPublicUrl(nome).data.publicUrl, alta: alta };
    },

    // ---------- novidades por e-mail ----------
    inscrever: async function (email) {
      email = String(email || '').trim().toLowerCase();
      if (!online) {
        var d = demoLer();
        d.inscritos = d.inscritos || [];
        if (!d.inscritos.some(function (x) { return x.email === email; })) {
          d.inscritos.unshift({ id: uuid(), email: email, criado_em: new Date().toISOString() });
          demoGravar(d);
        }
        return esperar(true);
      }
      var r = await sb.from('inscritos').insert({ email: email });
      if (r.error && !/duplicate key|23505/.test(String(r.error.message) + String(r.error.code))) throw new Error(traduzir(r.error));
      return true;
    },
    listarInscritos: async function () {
      if (!online) return esperar((demoLer().inscritos || []).slice());
      return checar(await sb.from('inscritos').select('*').order('criado_em', { ascending: false })) || [];
    },
    excluirInscrito: async function (id) {
      if (!online) {
        var d = demoLer();
        d.inscritos = (d.inscritos || []).filter(function (x) { return x.id !== id; });
        demoGravar(d);
        return esperar(true);
      }
      checar(await sb.from('inscritos').delete().eq('id', id));
      return true;
    },

    // Volta o modo demonstração para os dados iniciais
    restaurarDemo: function () {
      try { window.localStorage.removeItem(CHAVE_DEMO); } catch (e) { /* nada */ }
    },
    traduzir: traduzir
  };

  function carregarImagem(arquivo) {
    return new Promise(function (ok, falha) {
      if (!arquivo || !/^image\//.test(arquivo.type || 'image/')) { falha(new Error('Escolha um arquivo de imagem (JPG ou PNG).')); return; }
      var url = URL.createObjectURL(arquivo);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); ok(img); };
      img.onerror = function () { URL.revokeObjectURL(url); falha(new Error('Não deu para abrir esta imagem. Tente uma foto em JPG ou PNG.')); };
      img.src = url;
    });
  }

  window.LojaDados = api;
})();
