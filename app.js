/* ============================================================================
   app.js — Aplicação (interface, roteamento, auto-save, cálculo, PDF, dieta)
   Depende de: data.js (FORM_SCHEMAS, CALC_DATA, FOOD_DB, REFERENCIAS),
               calc.js (Calc), store.js (Store)
   ============================================================================ */

const App = (() => {

  /* ---------------------------------------------------------------- estado */
  const state = {
    user: null,
    config: null,          // perfil da nutricionista (cabeçalho dos PDFs)
    saveTimers: {},        // debounce por coleção:id
  };

  const COLECOES = { PAC: 'pacientes', AT: 'atendimentos', DIET: 'dietas', CFG: 'config' };
  const REFEICOES_PADRAO = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia'];

  /* ------------------------------------------------------------- DOM utils */
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else if (k === 'for') e.htmlFor = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v;
      else e.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false || kid === '') continue;
      e.appendChild(typeof kid === 'object' ? kid : document.createTextNode(String(kid)));
    }
    return e;
  }
  const $ = sel => document.querySelector(sel);

  function selectEl(opcoes, valor, onchange, attrs) {
    const s = el('select', attrs);
    for (const o of opcoes) {
      const val = typeof o === 'object' ? o.value : o;
      const txt = typeof o === 'object' ? o.label : o;
      s.appendChild(el('option', { value: val }, txt));
    }
    if (valor != null) s.value = valor;
    if (onchange) s.addEventListener('change', onchange);
    return s;
  }

  /* ---------------------------------------------------------- formatadores */
  const fmt = (n, d = 0) => (n == null || isNaN(n)) ? '—'
    : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  /* ---------------------------------------------------------------- toasts */
  function toast(msg, tipo) {
    const t = el('div', { class: 'toast' + (tipo === 'erro' ? ' erro' : '') }, msg);
    $('#toast-root').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  /* ---------------------------------------------------------------- modais */
  function modal(conteudo) {
    const root = $('#modal-root');
    const bg = el('div', { class: 'modal-bg', onclick: e => { if (e.target === bg) close(); } });
    const box = el('div', { class: 'modal' });
    const close = () => bg.remove();
    conteudo(box, close);
    bg.appendChild(box);
    root.appendChild(bg);
    return close;
  }

  /* ----------------------------------------------------------- auto-save */
  function debouncedSave(col, obj, ms = 800) {
    const key = col + ':' + (obj.id || 'novo');
    clearTimeout(state.saveTimers[key]);
    marcarSalvando();
    state.saveTimers[key] = setTimeout(async () => {
      try { await Store.save(col, obj); marcarSalvo(); }
      catch (e) { console.error(e); toast('Erro ao salvar na nuvem', 'erro'); }
    }, ms);
  }
  function marcarSalvando() { const s = $('#save-state'); if (s) s.innerHTML = '<span class="dot" style="background:var(--accent)"></span> salvando…'; }
  function marcarSalvo() { const s = $('#save-state'); if (s) s.innerHTML = '<span class="dot"></span> salvo na ' + (Store.getMode() === 'cloud' ? 'nuvem' : 'memória do navegador'); }

  /* ====================================================================== */
  /*  BOOT                                                                  */
  /* ====================================================================== */
  function boot() {
    Store.init(onAuth);
  }

  async function onAuth(user) {
    state.user = user;
    $('#loading-screen').setAttribute('hidden', '');
    const app = $('#app');
    app.removeAttribute('hidden');
    if (!user) { renderLogin(); return; }
    // carrega perfil
    try {
      const cfgs = await Store.list(COLECOES.CFG);
      state.config = cfgs[0] || { id: 'perfil' };
    } catch { state.config = { id: 'perfil' }; }
    window.addEventListener('hashchange', router);
    router();
  }

  /* ====================================================================== */
  /*  LOGIN  (apenas modo nuvem)                                            */
  /* ====================================================================== */
  function renderLogin() {
    let modo = 'login';
    const app = $('#app');
    const draw = () => {
      app.innerHTML = '';
      const campoEmail = el('input', { type: 'email', placeholder: 'seu@email.com', class: '' });
      const campoSenha = el('input', { type: 'password', placeholder: '••••••••' });
      const erro = el('div', { class: 'ajuda', style: 'color:var(--erro);min-height:16px' });

      const submit = async () => {
        erro.textContent = '';
        const email = campoEmail.value.trim(), senha = campoSenha.value;
        if (!email || !senha) { erro.textContent = 'Preencha e-mail e senha.'; return; }
        try {
          if (modo === 'login') await Store.login(email, senha);
          else { await Store.signup(email, senha); toast('Conta criada com sucesso.'); }
        } catch (e) {
          erro.textContent = traduzErroAuth(e);
        }
      };

      const card = el('div', { class: 'auth-card' },
        el('div', { class: 'brand' },
          el('div', { class: 'mark' }, 'N'),
          el('h1', null, modo === 'login' ? 'Bem-vinda de volta' : 'Criar conta'),
          el('div', { class: 'sub' }, 'Consultório de Nutrição · atendimento remoto')),
        el('div', { class: 'field', style: 'margin-bottom:14px' }, el('label', null, 'E-mail'), campoEmail),
        el('div', { class: 'field' }, el('label', null, 'Senha'), campoSenha),
        erro,
        el('button', { class: 'btn btn-primary', style: 'width:100%;margin-top:8px', onclick: submit },
          modo === 'login' ? 'Entrar' : 'Criar conta'),
        modo === 'login' ? el('div', { class: 'auth-toggle' },
          el('button', { onclick: async () => {
            if (!campoEmail.value.trim()) { erro.textContent = 'Digite o e-mail para recuperar a senha.'; return; }
            try { await Store.recuperar(campoEmail.value.trim()); toast('Enviamos um e-mail de recuperação.'); }
            catch (e) { erro.textContent = traduzErroAuth(e); }
          } }, 'Esqueci minha senha')) : null,
        el('div', { class: 'auth-toggle' },
          modo === 'login' ? 'Ainda não tem conta? ' : 'Já tem conta? ',
          el('button', { onclick: () => { modo = modo === 'login' ? 'signup' : 'login'; draw(); } },
            modo === 'login' ? 'Cadastre-se' : 'Entrar')),
      );
      app.appendChild(el('div', { class: 'auth-wrap' }, card));
      campoSenha.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    };
    draw();
  }

  function traduzErroAuth(e) {
    const c = (e && e.code) || '';
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'E-mail ou senha incorretos.';
    if (c.includes('email-already-in-use')) return 'Este e-mail já está cadastrado.';
    if (c.includes('weak-password')) return 'A senha precisa ter ao menos 6 caracteres.';
    if (c.includes('invalid-email')) return 'E-mail inválido.';
    return 'Não foi possível concluir. Tente novamente.';
  }

  /* ====================================================================== */
  /*  SHELL  (sidebar + conteúdo)                                          */
  /* ====================================================================== */
  function shell(ativo, ...conteudo) {
    const app = $('#app');
    app.innerHTML = '';
    const cloud = Store.getMode() === 'cloud';
    const nav = (hash, ic, txt) => el('a', {
      class: 'nav-item' + (ativo === hash ? ' active' : ''), href: '#' + hash
    }, el('span', { class: 'ic' }, ic), txt);

    const sidebar = el('aside', { class: 'sidebar' },
      el('div', { class: 'logo' },
        el('div', { class: 'mark' }, 'N'),
        el('div', { class: 'txt' }, el('b', null, 'Consultório'), el('span', null, 'Nutrição'))),
      nav('/', '◆', 'Início'),
      nav('/pacientes', '❏', 'Pacientes'),
      nav('/referencias', '✦', 'Referências'),
      el('div', { class: 'nav-sep' }),
      nav('/config', '⚙', 'Configurações'),
      el('div', { class: 'foot' },
        el('div', { class: 'mode' },
          el('span', { class: 'dot' + (cloud ? '' : ' local') }),
          cloud ? 'Conectada à nuvem' : 'Modo local (neste navegador)'),
        cloud && state.user && state.user.email ? el('div', { style: 'margin-top:8px' },
          state.user.email, ' · ',
          el('a', { href: '#', onclick: e => { e.preventDefault(); Store.logout(); } }, 'sair')) : null),
    );

    const main = el('main', { class: 'main' }, ...conteudo);
    app.appendChild(el('div', { class: 'shell' }, sidebar, main));
    window.scrollTo(0, 0);
  }

  function pageHead(eyebrow, titulo, lead) {
    return el('div', { class: 'page-head' },
      eyebrow ? el('div', { class: 'eyebrow' }, eyebrow) : null,
      el('h1', null, titulo),
      lead ? el('div', { class: 'lead' }, lead) : null);
  }
  function crumbs(...itens) {
    const c = el('div', { class: 'crumbs' });
    itens.forEach((it, i) => {
      if (i) c.appendChild(document.createTextNode('  ›  '));
      if (it.href) c.appendChild(el('a', { href: it.href }, it.txt));
      else c.appendChild(document.createTextNode(it.txt));
    });
    return c;
  }

  /* ====================================================================== */
  /*  ROTEADOR                                                              */
  /* ====================================================================== */
  function router() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [_, p1, p2] = h.split('/');
    if (!p1) return rotaDashboard();
    if (p1 === 'pacientes') return rotaPacientes();
    if (p1 === 'referencias') return rotaReferencias();
    if (p1 === 'config') return rotaConfig();
    if (p1 === 'atendimento' && p2) return rotaAtendimento(p2);
    if (p1 === 'dieta' && p2) return rotaDieta(p2);
    return rotaDashboard();
  }
  const go = hash => { location.hash = hash; };

  /* ====================================================================== */
  /*  DASHBOARD                                                             */
  /* ====================================================================== */
  async function rotaDashboard() {
    shell('/', el('div', { class: 'empty' }, el('div', { class: 'mark' }, 'N'), el('p', null, 'Carregando…')));
    const [ats, pacs] = await Promise.all([Store.list(COLECOES.AT), Store.list(COLECOES.PAC)]);
    ats.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    const tipos = ['padrao', 'idoso', 'estetica', 'retorno2', 'retorno3'];
    const grid = el('div', { class: 'tipo-grid' });
    tipos.forEach((t, i) => {
      const s = FORM_SCHEMAS[t];
      const primeira = ['padrao', 'idoso', 'estetica'].includes(t);
      grid.appendChild(el('button', { class: 'tipo-card', onclick: () => iniciarAtendimento(t, pacs) },
        el('span', { class: 'tag' }, primeira ? '1ª consulta' : 'Retorno'),
        el('div', { class: 'num' }, 'TIPO ' + (i + 1)),
        el('h3', null, s.nome),
        el('p', null, s.descricao),
        el('div', { class: 'dur' }, '◷ ' + s.duracao)));
    });

    const recentes = el('div');
    if (!ats.length) {
      recentes.appendChild(el('div', { class: 'empty' },
        el('div', { class: 'mark' }, '❏'),
        el('p', null, 'Nenhum atendimento ainda. Escolha um tipo acima para começar.')));
    } else {
      ats.slice(0, 8).forEach(a => recentes.appendChild(linhaAtendimento(a, pacs)));
    }

    shell('/',
      pageHead('Painel', 'Olá, ' + (state.config.nome ? state.config.nome.split(' ')[0] : 'bem-vinda'),
        'Inicie um atendimento, retome uma consulta ou monte um plano alimentar.'),
      el('div', { class: 'section-title' }, el('span', { class: 'idx' }, '01'), el('h2', null, 'Novo atendimento'), el('span', { class: 'rule' })),
      grid,
      el('div', { class: 'section-title' }, el('span', { class: 'idx' }, '02'), el('h2', null, 'Atendimentos recentes'), el('span', { class: 'rule' })),
      recentes,
    );
  }

  function pillTipo(tipo) {
    const map = { padrao: ['', '1ª consulta'], idoso: ['idoso', 'Idosos'], estetica: ['estetica', 'Estética'], retorno2: ['r2', '2ª consulta'], retorno3: ['r3', '3ª consulta'] };
    const m = map[tipo] || ['', tipo];
    return el('span', { class: 'pill ' + m[0] }, m[1]);
  }

  function linhaAtendimento(a, pacs) {
    const pac = pacs.find(p => p.id === a.pacienteId);
    const nome = (a.dados && a.dados.nome) || (pac && pac.nome) || 'Sem nome';
    const data = a.updatedAt ? new Date(a.updatedAt).toLocaleDateString('pt-BR') : '';
    return el('div', { class: 'list-row', onclick: () => go('/atendimento/' + a.id) },
      el('div', { class: 'avatar' }, (nome[0] || '?').toUpperCase()),
      el('div', { class: 'grow' },
        el('div', { class: 'nome' }, nome),
        el('div', { class: 'meta' }, FORM_SCHEMAS[a.tipo] ? FORM_SCHEMAS[a.tipo].nome : a.tipo, data ? ' · ' + data : '')),
      pillTipo(a.tipo));
  }

  /* ---------------------------------------------------- iniciar atendimento */
  async function iniciarAtendimento(tipo, pacs) {
    const primeira = ['padrao', 'idoso', 'estetica'].includes(tipo);
    if (primeira) {
      const pac = await Store.save(COLECOES.PAC, { nome: '', ultimoTipo: tipo });
      const at = await Store.save(COLECOES.AT, { tipo, pacienteId: pac.id, dados: {}, calcInput: {}, calc: null });
      go('/atendimento/' + at.id);
    } else {
      // retorno: escolher paciente existente
      if (!pacs) pacs = await Store.list(COLECOES.PAC);
      const validos = pacs.filter(p => p.nome);
      modal((box, close) => {
        box.appendChild(el('h3', null, 'Selecionar paciente'));
        box.appendChild(el('div', { class: 'sub' }, 'Para qual paciente é este ' + FORM_SCHEMAS[tipo].nome.toLowerCase() + '?'));
        if (!validos.length) {
          box.appendChild(el('div', { class: 'muted' }, 'Você ainda não tem pacientes cadastrados. Faça uma primeira consulta antes.'));
        } else {
          const lista = el('div', { class: 'pick-list' });
          validos.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(p => {
            lista.appendChild(el('div', { class: 'pick-row', onclick: async () => {
              close();
              const dados = { nome: p.nome, sexo: p.sexo, nascimento: p.nascimento };
              const at = await Store.save(COLECOES.AT, { tipo, pacienteId: p.id, dados, calcInput: {}, calc: null });
              go('/atendimento/' + at.id);
            } },
              el('div', { class: 'nome' }, p.nome),
              el('div', { class: 'meta' }, [p.sexo, p.nascimento ? Calc.idade(p.nascimento) + ' anos' : null].filter(Boolean).join(' · '))));
          });
          box.appendChild(lista);
        }
        box.appendChild(el('div', { class: 'modal-actions' }, el('button', { class: 'btn btn-ghost', onclick: close }, 'Fechar')));
      });
    }
  }

  /* ====================================================================== */
  /*  ATENDIMENTO  (anamnese + cálculo)                                    */
  /* ====================================================================== */
  async function rotaAtendimento(id) {
    shell(null, el('div', { class: 'empty' }, el('p', null, 'Carregando atendimento…')));
    const at = await Store.get(COLECOES.AT, id);
    if (!at) { shell('/', pageHead(null, 'Atendimento não encontrado'), el('a', { class: 'btn btn-ghost', href: '#/' }, 'Voltar ao início')); return; }
    at.dados = at.dados || {};
    at.calcInput = at.calcInput || {};
    const schema = FORM_SCHEMAS[at.tipo];

    const persist = () => debouncedSave(COLECOES.AT, at);
    const persistPaciente = async () => {
      const d = at.dados;
      const patch = { id: at.pacienteId, nome: d.nome || '', sexo: d.sexo, nascimento: d.nascimento, telefone: d.telefone, email: d.email, cidade_uf: d.cidade_uf, ultimoTipo: at.tipo };
      debouncedSave(COLECOES.PAC, patch, 1000);
    };

    const formWrap = el('div');
    schema.secoes.forEach((sec, i) => formWrap.appendChild(renderSecao(sec, i, at.dados, () => { persist(); persistPaciente(); })));

    const calcWrap = renderCalc(at, schema);

    shell(null,
      crumbs({ txt: 'Início', href: '#/' }, { txt: schema.nome }),
      pageHead(schema.nome, (at.dados.nome || 'Novo paciente'),
        schema.descricao + ' · ' + schema.duracao),
      el('div', { class: 'row between mb' },
        el('div', { class: 'save-state', id: 'save-state' }, el('span', { class: 'dot' }), 'salvo automaticamente'),
        el('div', { class: 'muted', style: 'font-size:12.5px' }, '✎ Tudo é salvo enquanto você digita')),
      formWrap,
      el('div', { class: 'section-title' }, el('span', { class: 'idx' }, '✦'), el('h2', null, 'Cálculo dietético'), el('span', { class: 'rule' })),
      calcWrap,
    );
    marcarSalvo();
  }

  /* -------------------------------------------------- render de uma seção */
  function renderSecao(sec, i, dados, onChange) {
    const grid = el('div', { class: 'form-grid' });
    sec.campos.forEach(c => grid.appendChild(renderCampo(c, dados, onChange)));
    return el('div', null,
      el('div', { class: 'section-title' },
        el('span', { class: 'idx' }, String(i + 1).padStart(2, '0')),
        el('h2', null, sec.titulo),
        el('span', { class: 'rule' })),
      el('div', { class: 'card card-pad' }, grid));
  }

  /* -------------------------------------------------- render de um campo */
  function renderCampo(c, dados, onChange) {
    const largura = c.largura || 'full';
    const wrap = el('div', { class: 'field ' + largura });
    const label = el('label', null, c.label);
    if (c.obrigatorio) label.appendChild(el('span', { class: 'req' }, ' *'));
    wrap.appendChild(label);

    const val = dados[c.id];

    if (c.tipo === 'textarea') {
      const t = el('textarea', { placeholder: c.placeholder || '' });
      if (val) t.value = val;
      t.addEventListener('input', () => { dados[c.id] = t.value; onChange(); });
      wrap.appendChild(t);
    } else if (c.tipo === 'select') {
      const s = selectEl(['', ...c.opcoes], val || '', () => { dados[c.id] = s.value; onChange(); });
      s.querySelector('option').textContent = '— selecione —';
      wrap.appendChild(s);
    } else if (c.tipo === 'checkbox') {
      const sel = Array.isArray(val) ? val : [];
      const box = el('div', { class: 'checks' });
      c.opcoes.forEach(op => {
        const ativo = sel.includes(op);
        const lab = el('label', { class: 'check' + (ativo ? ' on' : '') },
          el('input', { type: 'checkbox' }), op);
        lab.querySelector('input').checked = ativo;
        lab.addEventListener('click', e => {
          e.preventDefault();
          const arr = Array.isArray(dados[c.id]) ? dados[c.id] : [];
          const idx = arr.indexOf(op);
          if (idx >= 0) arr.splice(idx, 1); else arr.push(op);
          dados[c.id] = arr;
          lab.classList.toggle('on');
          onChange();
        });
        box.appendChild(lab);
      });
      wrap.appendChild(box);
    } else {
      const tipo = c.tipo === 'numero' ? 'number' : c.tipo === 'data' ? 'date' : 'text';
      const inp = el('input', { type: tipo, placeholder: c.placeholder || '', step: c.tipo === 'numero' ? 'any' : null });
      if (val != null) inp.value = val;
      inp.addEventListener('input', () => { dados[c.id] = inp.value; onChange(); });
      wrap.appendChild(inp);
    }
    if (c.ajuda) wrap.appendChild(el('div', { class: 'ajuda' }, c.ajuda));
    return wrap;
  }

  /* ====================================================================== */
  /*  PAINEL DE CÁLCULO                                                     */
  /* ====================================================================== */
  function renderCalc(at, schema) {
    const ci = at.calcInput;
    const d = at.dados;
    // defaults a partir da anamnese
    if (ci.formulaTMB == null) ci.formulaTMB = 'fao';
    if (ci.metodoGET == null) ci.metodoGET = 'venta';
    if (ci.sexo == null) ci.sexo = d.sexo || 'Feminino';
    if (ci.idade == null && d.nascimento) ci.idade = Calc.idade(d.nascimento);
    if (ci.peso == null && d.peso_atual) ci.peso = parseFloat(d.peso_atual);
    if (ci.intensidade == null) ci.intensidade = 2;
    if (ci.objetivo == null) ci.objetivo = 'perder';
    if (ci.kgMes == null) ci.kgMes = 2.0;
    if (ci.macroPreset == null) ci.macroPreset = 'Padrão (15/55/30)';

    const resultBox = el('div', { class: 'mt' });
    const onCi = () => debouncedSave(COLECOES.AT, at, 600);

    // ----- escolha de fórmula TMB
    const tmbGrid = el('div', { class: 'method-grid' });
    Object.entries(CALC_DATA.formulasTMB).forEach(([k, f]) => {
      const opt = el('div', { class: 'method-opt' + (ci.formulaTMB === k ? ' on' : ''), onclick: () => {
        ci.formulaTMB = k; onCi();
        tmbGrid.querySelectorAll('.method-opt').forEach(o => o.classList.remove('on'));
        opt.classList.add('on');
      } }, el('b', null, f.nome), el('span', null, f.descricao));
      tmbGrid.appendChild(opt);
    });

    // ----- escolha de método GET
    const metodos = {
      venta: { nome: 'Método VENTA (do material)', desc: 'Separa horas de sono e de rotina, com efeito térmico de +10%.' },
      fator: { nome: 'Fator de atividade', desc: 'GET = TMB × fator de atividade. Mais direto.' },
    };
    const getGrid = el('div', { class: 'method-grid' });
    Object.entries(metodos).forEach(([k, m]) => {
      const opt = el('div', { class: 'method-opt' + (ci.metodoGET === k ? ' on' : ''), onclick: () => {
        ci.metodoGET = k; onCi();
        getGrid.querySelectorAll('.method-opt').forEach(o => o.classList.remove('on'));
        opt.classList.add('on');
      } }, el('b', null, m.nome), el('span', null, m.desc));
      getGrid.appendChild(opt);
    });

    // ----- inputs
    const campo = (label, key, attrs, req) => {
      const inp = el('input', Object.assign({ type: 'number', step: 'any' }, attrs));
      if (ci[key] != null) inp.value = ci[key];
      inp.addEventListener('input', () => { ci[key] = inp.value === '' ? null : parseFloat(inp.value); onCi(); });
      const l = el('label', null, label);
      if (req) l.appendChild(el('span', { class: 'req' }, ' *'));
      return el('div', { class: 'field third' }, l, inp);
    };
    const sexoSel = selectEl(['Feminino', 'Masculino'], ci.sexo, e => { ci.sexo = e.target.value; onCi(); });
    const intensSel = selectEl(
      [{ value: 1, label: '1 · Leve' }, { value: 2, label: '2 · Moderada' }, { value: 3, label: '3 · Intensa' }],
      String(ci.intensidade), e => { ci.intensidade = parseInt(e.target.value); onCi(); });
    const objSel = selectEl(
      [{ value: 'perder', label: 'Perder peso' }, { value: 'manter', label: 'Manter peso' }, { value: 'ganhar', label: 'Ganhar peso' }],
      ci.objetivo, e => { ci.objetivo = e.target.value; onCi(); atualizarKg(); });
    const kgSel = selectEl(CALC_DATA.venta.map(v => ({ value: v.kgMes, label: fmt(v.kgMes, 1).replace('.', ',') + ' kg/mês  (±' + v.kcal + ' kcal)' })),
      String(ci.kgMes), e => { ci.kgMes = parseFloat(e.target.value); onCi(); });
    const macroSel = selectEl(Object.keys(CALC_DATA.macroPresets), ci.macroPreset, e => { ci.macroPreset = e.target.value; onCi(); });

    const kgField = el('div', { class: 'field third' }, el('label', null, 'Ritmo desejado'), kgSel);
    const atualizarKg = () => { kgField.style.display = ci.objetivo === 'manter' ? 'none' : ''; };

    const inputs = el('div', { class: 'form-grid' },
      el('div', { class: 'field third' }, el('label', null, 'Sexo'), sexoSel),
      campo('Idade (anos)', 'idade', {}, true),
      campo('Peso (kg)', 'peso', {}, true),
      campo('Altura (cm)', 'altura', {}, true),
      campo('Horas de sono', 'horasSono', { placeholder: 'ex.: 8' }, true),
      campo('Horas de atividade', 'horasAtividade', { placeholder: 'opcional' }),
      el('div', { class: 'field third' }, el('label', null, 'Intensidade da atividade'), intensSel),
      campo('Cintura (cm)', 'cintura', { placeholder: 'opcional' }),
      campo('Quadril (cm)', 'quadril', { placeholder: 'opcional' }),
      campo('Soma de 4 dobras (mm)', 'somaDobras', { placeholder: 'bíceps+tríceps+subesc.+supra' }),
      el('div', { class: 'field third' }, el('label', null, 'Objetivo'), objSel),
      kgField,
      el('div', { class: 'field third' }, el('label', null, 'Distribuição de macros'), macroSel),
    );

    const btnResultado = el('button', { class: 'btn btn-accent', onclick: () => gerarResultado(at, resultBox) }, '⚡ Gerar resultado');
    const btnRelatorio = el('button', { class: 'btn btn-primary', onclick: () => gerarRelatorioPDF(at, schema) }, '⬇ Gerar relatório da consulta (PDF)');
    const btnDieta = el('button', { class: 'btn btn-soft', onclick: () => abrirDietaDoAtendimento(at) }, '🍽 Montar dieta');

    const panel = el('div', { class: 'calc-panel' },
      el('div', { class: 'field' }, el('label', null, 'Fórmula de Taxa Metabólica Basal (TMB)')), tmbGrid,
      el('div', { class: 'field mt' }, el('label', null, 'Método de gasto energético (GET)')), getGrid,
      el('div', { class: 'mt' }, inputs),
      el('div', { class: 'sticky-actions' }, btnResultado, btnRelatorio, btnDieta),
      resultBox,
    );

    atualizarKg();
    // se já houver cálculo salvo, mostra
    if (at.calc) renderResultado(at.calc, resultBox, at);
    return panel;
  }

  /* ----------------------------------------------------- gerar resultado */
  function gerarResultado(at, box) {
    const ci = at.calcInput;
    const faltando = [];
    if (!ci.idade) faltando.push('idade');
    if (!ci.altura) faltando.push('altura');
    if (!ci.peso) faltando.push('peso');
    if (!ci.horasSono) faltando.push('horas de sono');
    if (faltando.length) { toast('Preencha: ' + faltando.join(', ') + '.', 'erro'); return; }

    const entrada = {
      sexo: ci.sexo, idade: ci.idade, peso: ci.peso, alturaCm: ci.altura,
      horasSono: ci.horasSono, intensidade: ci.intensidade,
      formulaTMB: ci.formulaTMB, metodoGET: ci.metodoGET,
      objetivo: ci.objetivo, kgMes: ci.kgMes,
      macroDist: CALC_DATA.macroPresets[ci.macroPreset],
      cintura: ci.cintura || null, quadril: ci.quadril || null, somaDobras: ci.somaDobras || null,
    };
    const r = Calc.completo(entrada);
    at.calc = r;
    Store.save(COLECOES.AT, at).then(marcarSalvo);
    renderResultado(r, box, at);
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderResultado(r, box, at) {
    box.innerHTML = '';
    const cards = el('div', { class: 'result-grid' });
    if (r.imc != null) cards.appendChild(el('div', { class: 'result-card' },
      el('div', { class: 'lbl' }, 'IMC'), el('div', { class: 'val' }, fmt(r.imc, 1)), el('div', { class: 'cls' }, r.imcClasse)));
    cards.appendChild(el('div', { class: 'result-card' },
      el('div', { class: 'lbl' }, 'TMB'), el('div', { class: 'val' }, fmt(r.tmb, 0), el('small', null, ' kcal')), el('div', { class: 'cls' }, 'metabolismo basal')));
    cards.appendChild(el('div', { class: 'result-card' },
      el('div', { class: 'lbl' }, 'GET / VET'), el('div', { class: 'val' }, fmt(r.vet, 0), el('small', null, ' kcal')),
      el('div', { class: 'cls' }, 'gasto total · fator ' + fmt(r.fator, 2))));
    const metaTxt = r.meta.ajuste === 0 ? 'manutenção'
      : (r.meta.ajuste < 0 ? 'déficit ' : 'superávit ') + fmt(Math.abs(r.meta.ajuste), 0) + ' kcal · ' + fmt(r.meta.kgMes, 1).replace('.', ',') + ' kg/mês';
    cards.appendChild(el('div', { class: 'result-card alvo' },
      el('div', { class: 'lbl' }, 'Meta calórica'), el('div', { class: 'val' }, fmt(r.meta.alvo, 0), el('small', null, ' kcal')), el('div', { class: 'cls' }, metaTxt)));
    if (r.gordura != null) cards.appendChild(el('div', { class: 'result-card' },
      el('div', { class: 'lbl' }, '% Gordura'), el('div', { class: 'val' }, fmt(r.gordura, 1), el('small', null, ' %')), el('div', { class: 'cls' }, r.gorduraClasse || '')));
    if (r.cinturaClasse) cards.appendChild(el('div', { class: 'result-card' },
      el('div', { class: 'lbl' }, 'Cintura'), el('div', { class: 'val' }, fmt(r.entrada.cintura, 0), el('small', null, ' cm')), el('div', { class: 'cls' }, r.cinturaClasse)));
    if (r.rcq) cards.appendChild(el('div', { class: 'result-card' },
      el('div', { class: 'lbl' }, 'Cintura/Quadril'), el('div', { class: 'val' }, fmt(r.rcq.valor, 2)), el('div', { class: 'cls' }, r.rcq.risco ? 'risco aumentado' : 'adequado')));
    box.appendChild(cards);

    // macros
    if (r.macro) {
      const linha = el('div', { class: 'macro-row' });
      const mb = (nome, g, kcal, gkg) => el('div', { class: 'macro-box' },
        el('div', { class: 'm-name' }, nome),
        el('div', { class: 'm-g' }, fmt(g, 0) + ' g'),
        el('div', { class: 'm-extra' }, fmt(kcal, 0) + ' kcal' + (gkg ? ' · ' + fmt(gkg, 1) + ' g/kg' : '')));
      linha.appendChild(mb('Proteínas', r.macro.g.ptn, r.macro.kcal.ptn, r.macro.gkg && r.macro.gkg.ptn));
      linha.appendChild(mb('Carboidratos', r.macro.g.cho, r.macro.kcal.cho, r.macro.gkg && r.macro.gkg.cho));
      linha.appendChild(mb('Gorduras', r.macro.g.lip, r.macro.kcal.lip, r.macro.gkg && r.macro.gkg.lip));
      box.appendChild(linha);
    }

    // passos / memória de cálculo
    const g = r.get;
    const passos = el('div', { class: 'steps' });
    passos.innerHTML = '<b>Como cheguei aqui</b><br>' +
      'TMB (' + (r.entrada.formulaTMB === 'harris' ? 'Harris & Benedict' : 'FAO/OMS') + ') = <b>' + fmt(r.tmb, 0) + ' kcal</b><br>' +
      (r.entrada.metodoGET === 'venta'
        ? 'Sono: ' + fmt(g.ve1, 0) + ' kcal + Rotina: ' + fmt(g.ve2, 0) + ' kcal (fator ' + fmt(r.fator, 2) + ') = ' + fmt(g.bruto, 0) + ' kcal<br>' +
          'Efeito térmico (+10%): ' + fmt(g.termogenese, 0) + ' kcal → <b>VET ' + fmt(r.vet, 0) + ' kcal</b><br>'
        : 'GET = TMB × fator (' + fmt(r.fator, 2) + ') = <b>' + fmt(r.vet, 0) + ' kcal</b><br>') +
      'Ajuste do objetivo: ' + (r.meta.ajuste === 0 ? 'nenhum' : fmt(r.meta.ajuste, 0) + ' kcal') + ' → <b>Meta ' + fmt(r.meta.alvo, 0) + ' kcal</b>';
    box.appendChild(passos);

    box.appendChild(el('div', { class: 'mt-s muted', style: 'font-size:12px' },
      'Resultado salvo no atendimento. Use “Montar dieta” para criar o plano alimentar com base nessa meta.'));
  }

  /* ====================================================================== */
  /*  RELATÓRIO PDF DA CONSULTA                                             */
  /* ====================================================================== */
  function pdfHeader(doc, titulo, sub) {
    const cfg = state.config || {};
    doc.setFillColor(74, 60, 44); doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(246, 238, 223); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(cfg.nome || 'Consultório de Nutrição', 14, 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const linha2 = [cfg.crn ? 'CRN ' + cfg.crn : null, cfg.especialidade, cfg.contato].filter(Boolean).join('  ·  ');
    doc.text(linha2 || 'Nutrição · atendimento remoto', 14, 18);
    doc.setTextColor(154, 123, 82); doc.setFontSize(8);
    doc.text((cfg.email || '') + (cfg.instagram ? '   ' + cfg.instagram : ''), 14, 23);
    doc.setTextColor(60, 49, 34); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(titulo, 14, 38);
    if (sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(120, 102, 78); doc.text(sub, 14, 44); }
    return sub ? 50 : 46;
  }

  function valorLegivel(v) {
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  }

  function gerarRelatorioPDF(at, schema) {
    if (!window.jspdf) { toast('Biblioteca de PDF não carregou. Verifique a internet.', 'erro'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const nome = at.dados.nome || 'Paciente';
    let y = pdfHeader(doc, 'Relatório de consulta', schema.nome + '  ·  ' + new Date().toLocaleDateString('pt-BR'));

    // identificação resumida
    const idade = at.dados.nascimento ? Calc.idade(at.dados.nascimento) + ' anos' : (at.calcInput.idade ? at.calcInput.idade + ' anos' : '—');
    doc.autoTable({
      startY: y + 2,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1.5, textColor: [60, 49, 34] },
      body: [
        ['Paciente', nome, 'Idade', idade],
        ['Sexo', at.dados.sexo || at.calcInput.sexo || '—', 'Contato', [at.dados.telefone, at.dados.email].filter(Boolean).join(' · ') || '—'],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 26 }, 2: { fontStyle: 'bold', cellWidth: 22 } },
    });
    y = doc.lastAutoTable.finalY + 4;

    // seções da anamnese (apenas campos preenchidos)
    schema.secoes.forEach(sec => {
      const linhas = [];
      sec.campos.forEach(c => {
        const v = at.dados[c.id];
        if (v == null || v === '' || (Array.isArray(v) && !v.length)) return;
        linhas.push([c.label, valorLegivel(v)]);
      });
      if (!linhas.length) return;
      if (y > 250) { doc.addPage(); y = 18; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(74, 60, 44);
      doc.text(sec.titulo, 14, y);
      doc.autoTable({
        startY: y + 2,
        head: [],
        body: linhas,
        theme: 'striped',
        styles: { fontSize: 9.5, cellPadding: 2, textColor: [60, 49, 34], overflow: 'linebreak' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 58, textColor: [110, 92, 68] } },
        headStyles: { fillColor: [231, 219, 201] },
        alternateRowStyles: { fillColor: [251, 247, 240] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 5;
    });

    // resultados do cálculo
    if (at.calc) {
      const r = at.calc;
      if (y > 235) { doc.addPage(); y = 18; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(74, 60, 44);
      doc.text('Cálculo dietético', 14, y);
      const body = [
        ['TMB (' + (r.entrada.formulaTMB === 'harris' ? 'Harris & Benedict' : 'FAO/OMS') + ')', fmt(r.tmb, 0) + ' kcal'],
        ['GET / VET (' + (r.entrada.metodoGET === 'venta' ? 'VENTA' : 'fator') + ')', fmt(r.vet, 0) + ' kcal'],
        ['Meta calórica', fmt(r.meta.alvo, 0) + ' kcal  (' + (r.meta.ajuste === 0 ? 'manutenção' : (r.meta.ajuste < 0 ? 'déficit ' : 'superávit ') + fmt(Math.abs(r.meta.ajuste), 0) + ' kcal') + ')'],
      ];
      if (r.imc != null) body.unshift(['IMC', fmt(r.imc, 1) + '  ·  ' + r.imcClasse]);
      if (r.macro) body.push(['Macros', 'PTN ' + fmt(r.macro.g.ptn, 0) + 'g · CHO ' + fmt(r.macro.g.cho, 0) + 'g · LIP ' + fmt(r.macro.g.lip, 0) + 'g']);
      if (r.gordura != null) body.push(['% Gordura corporal', fmt(r.gordura, 1) + '%  ·  ' + (r.gorduraClasse || '')]);
      doc.autoTable({
        startY: y + 2, body, theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2.5, textColor: [60, 49, 34] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 62, textColor: [74, 60, 44] } },
        bodyStyles: { fillColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    rodapePaginas(doc);
    doc.save('Relatorio_' + nome.replace(/\s+/g, '_') + '.pdf');
    toast('Relatório gerado.');
  }

  function rodapePaginas(doc) {
    const n = doc.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160, 145, 122);
      doc.text('Documento gerado pelo consultório · uso clínico', 14, 290);
      doc.text(i + '/' + n, 196, 290, { align: 'right' });
    }
  }

  /* ====================================================================== */
  /*  DIETA                                                                 */
  /* ====================================================================== */
  async function abrirDietaDoAtendimento(at) {
    // procura dieta já vinculada
    const dietas = await Store.list(COLECOES.DIET);
    let dieta = dietas.find(d => d.atendimentoId === at.id);
    if (!dieta) {
      const meta = at.calc ? {
        kcal: Math.round(at.calc.meta.alvo),
        ptn: at.calc.macro ? Math.round(at.calc.macro.g.ptn) : null,
        cho: at.calc.macro ? Math.round(at.calc.macro.g.cho) : null,
        lip: at.calc.macro ? Math.round(at.calc.macro.g.lip) : null,
      } : { kcal: null, ptn: null, cho: null, lip: null };
      dieta = await Store.save(COLECOES.DIET, {
        atendimentoId: at.id, pacienteId: at.pacienteId,
        nomePaciente: at.dados.nome || 'Paciente',
        meta, refeicoes: REFEICOES_PADRAO.map(n => ({ nome: n, itens: [] })), obs: '',
      });
    }
    go('/dieta/' + dieta.id);
  }

  async function rotaDieta(id) {
    shell(null, el('div', { class: 'empty' }, el('p', null, 'Carregando plano alimentar…')));
    const dieta = await Store.get(COLECOES.DIET, id);
    if (!dieta) { shell('/', pageHead(null, 'Dieta não encontrada'), el('a', { class: 'btn btn-ghost', href: '#/' }, 'Voltar')); return; }
    dieta.refeicoes = dieta.refeicoes || [];
    dieta.meta = dieta.meta || {};

    const persist = () => debouncedSave(COLECOES.DIET, dieta, 700);

    const targetBar = el('div', { class: 'target-bar' });
    const refeicoesWrap = el('div');

    const recalcular = () => {
      // totais
      let tot = { kcal: 0, ptn: 0, cho: 0, lip: 0 };
      dieta.refeicoes.forEach(m => {
        let mk = 0;
        m.itens.forEach(it => {
          const f = (it.g || 0) / 100;
          it.kcal = (it.per100.kcal || 0) * f;
          it.ptn = (it.per100.ptn || 0) * f;
          it.cho = (it.per100.cho || 0) * f;
          it.lip = (it.per100.lip || 0) * f;
          mk += it.kcal; tot.kcal += it.kcal; tot.ptn += it.ptn; tot.cho += it.cho; tot.lip += it.lip;
        });
        m._kcal = mk;
      });
      // barra-alvo
      targetBar.innerHTML = '';
      const meta = dieta.meta;
      const item = (k, l, suf) => el('div', { class: 't-item' },
        el('div', { class: 'k' }, k), el('div', { class: 'l' }, l + (suf || '')));
      targetBar.appendChild(item(fmt(tot.kcal, 0) + (meta.kcal ? ' / ' + meta.kcal : ''), 'kcal'));
      targetBar.appendChild(item(fmt(tot.ptn, 0) + (meta.ptn ? ' / ' + meta.ptn : '') + 'g', 'Proteína'));
      targetBar.appendChild(item(fmt(tot.cho, 0) + (meta.cho ? ' / ' + meta.cho : '') + 'g', 'Carboidrato'));
      targetBar.appendChild(item(fmt(tot.lip, 0) + (meta.lip ? ' / ' + meta.lip : '') + 'g', 'Gordura'));
      const pct = meta.kcal ? Math.min(100, tot.kcal / meta.kcal * 100) : 0;
      const over = meta.kcal && tot.kcal > meta.kcal * 1.03;
      targetBar.appendChild(el('div', { class: 'bar' },
        el('div', { class: 'progress' + (over ? ' over' : '') }, el('span', { style: 'width:' + pct + '%' })),
        el('div', { class: 'l', style: 'margin-top:6px' }, meta.kcal ? (over ? 'acima da meta' : fmt(pct, 0) + '% da meta calórica') : 'defina a meta no cálculo')));
      // atualiza kcal nos cabeçalhos
      dieta.refeicoes.forEach((m, i) => { const h = refeicoesWrap.querySelector('[data-mk="' + i + '"]'); if (h) h.textContent = fmt(m._kcal, 0) + ' kcal'; });
    };

    const desenharRefeicoes = () => {
      refeicoesWrap.innerHTML = '';
      dieta.refeicoes.forEach((m, mi) => refeicoesWrap.appendChild(renderRefeicao(m, mi, dieta, () => { persist(); recalcular(); }, () => { dieta.refeicoes.splice(mi, 1); persist(); desenharRefeicoes(); recalcular(); })));
      refeicoesWrap.appendChild(el('div', { class: 'mt' },
        el('button', { class: 'btn btn-ghost btn-sm', onclick: () => { dieta.refeicoes.push({ nome: 'Nova refeição', itens: [] }); persist(); desenharRefeicoes(); recalcular(); } }, '+ Adicionar refeição')));
    };

    const obsField = el('textarea', { placeholder: 'Orientações gerais, substituições, hidratação, suplementação…' });
    obsField.value = dieta.obs || '';
    obsField.addEventListener('input', () => { dieta.obs = obsField.value; persist(); });

    desenharRefeicoes();
    recalcular();

    shell(null,
      crumbs({ txt: 'Início', href: '#/' },
        dieta.atendimentoId ? { txt: 'Atendimento', href: '#/atendimento/' + dieta.atendimentoId } : { txt: 'Dieta' },
        { txt: 'Plano alimentar' }),
      pageHead('Plano alimentar', dieta.nomePaciente || 'Paciente',
        'Monte as refeições por grama e medida caseira. As sugestões são editáveis e tudo é salvo automaticamente.'),
      el('div', { class: 'row between mb' },
        el('div', { class: 'save-state', id: 'save-state' }, el('span', { class: 'dot' }), 'salvo automaticamente'),
        el('button', { class: 'btn btn-primary', onclick: () => exportarDietaPDF(dieta) }, '⬇ Exportar dieta (PDF)')),
      el('div', { class: 'diet-top' }, targetBar),
      refeicoesWrap,
      el('div', { class: 'section-title' }, el('span', { class: 'idx' }, '✎'), el('h2', null, 'Observações'), el('span', { class: 'rule' })),
      el('div', { class: 'card card-pad' }, el('div', { class: 'field' }, obsField)),
    );
    marcarSalvo();
  }

  /* --------------------------------------------------- render de refeição */
  function renderRefeicao(m, mi, dieta, onChange, onRemove) {
    const foods = el('div', { class: 'meal-foods' });

    const desenharItens = () => {
      foods.innerHTML = '';
      m.itens.forEach((it, ii) => foods.appendChild(renderItem(it, () => onChange(), () => { m.itens.splice(ii, 1); onChange(); desenharItens(); })));
      // adicionar alimento
      const dlId = 'dl-' + mi;
      const inp = el('input', { placeholder: 'Buscar alimento e Enter…', list: dlId });
      const dl = el('datalist', { id: dlId });
      FOOD_DB.forEach(f => dl.appendChild(el('option', { value: f.nome })));
      const add = () => {
        const nome = inp.value.trim(); if (!nome) return;
        const f = FOOD_DB.find(x => x.nome.toLowerCase() === nome.toLowerCase());
        if (f) m.itens.push({ nome: f.nome, per100: { kcal: f.kcal, ptn: f.ptn, cho: f.cho, lip: f.lip }, medidaLabel: f.medida, medidaG: f.g, g: f.g });
        else m.itens.push({ nome, per100: { kcal: 0, ptn: 0, cho: 0, lip: 0 }, medidaLabel: 'porção', medidaG: 100, g: 100, custom: true });
        inp.value = ''; onChange(); desenharItens(); inp.focus();
      };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      foods.appendChild(el('div', { class: 'add-food' }, dl, inp,
        el('button', { class: 'btn btn-soft btn-sm', onclick: add }, '+ Adicionar'),
        el('button', { class: 'btn btn-ghost btn-sm', onclick: () => abrirAlimentoManual(m, onChange, desenharItens) }, 'manual')));
    };
    desenharItens();

    const nomeInp = el('input', { class: 'meal-name', value: m.nome });
    nomeInp.addEventListener('input', () => { m.nome = nomeInp.value; onChange(); });

    return el('div', { class: 'meal' },
      el('div', { class: 'meal-head' },
        nomeInp,
        el('span', { class: 'm-kcal', dataset: { mk: String(mi) } }, fmt(m._kcal || 0, 0) + ' kcal'),
        el('button', { class: 'btn btn-danger btn-sm', onclick: onRemove }, 'remover')),
      foods);
  }

  /* ------------------------------------------------------- render de item */
  function renderItem(it, onChange, onRemove) {
    const fac = it.medidaG || 1;
    const gInp = el('input', { type: 'number', step: 'any', value: it.g });
    const medInp = el('input', { type: 'number', step: 'any', value: it.medidaG ? +(it.g / fac).toFixed(2) : '' });

    gInp.addEventListener('input', () => {
      it.g = gInp.value === '' ? 0 : parseFloat(gInp.value);
      if (it.medidaG) medInp.value = +(it.g / fac).toFixed(2);
      onChange(); atualizaKcal();
    });
    medInp.addEventListener('input', () => {
      const q = medInp.value === '' ? 0 : parseFloat(medInp.value);
      it.g = +(q * fac).toFixed(1);
      gInp.value = it.g; onChange(); atualizaKcal();
    });

    const kcalSpan = el('div', { class: 'right', style: 'font-size:13px;color:var(--texto-m)' });
    const atualizaKcal = () => { kcalSpan.textContent = fmt((it.per100.kcal || 0) * (it.g || 0) / 100, 0) + ' kcal'; };
    atualizaKcal();

    const nomeInp = el('input', { value: it.nome });
    nomeInp.addEventListener('input', () => { it.nome = nomeInp.value; onChange(); });

    return el('div', { class: 'food-row' },
      nomeInp,
      el('div', { style: 'display:flex;align-items:center;gap:4px' }, gInp, el('span', { style: 'font-size:11px;color:var(--texto-mm)' }, 'g')),
      el('div', { style: 'display:flex;align-items:center;gap:4px' }, medInp, el('span', { style: 'font-size:11px;color:var(--texto-mm)' }, it.medidaLabel || 'med.')),
      kcalSpan,
      el('button', { class: 'x', onclick: onRemove }, '×'));
  }

  function abrirAlimentoManual(m, onChange, redraw) {
    modal((box, close) => {
      box.appendChild(el('h3', null, 'Alimento manual'));
      box.appendChild(el('div', { class: 'sub' }, 'Informe os valores por 100 g (ou por porção, ajustando a medida).'));
      const f = (lab, ph) => { const i = el('input', { type: lab === 'Nome' ? 'text' : 'number', step: 'any', placeholder: ph || '' }); box.appendChild(el('div', { class: 'field mt-s' }, el('label', null, lab), i)); return i; };
      const nome = f('Nome');
      const kcal = f('Calorias / 100g', 'kcal');
      const ptn = f('Proteínas / 100g', 'g'); const cho = f('Carboidratos / 100g', 'g'); const lip = f('Gorduras / 100g', 'g');
      const med = f('Nome da medida caseira', 'ex.: colher de sopa'); const medG = f('Gramas por medida', 'ex.: 15');
      box.appendChild(el('div', { class: 'modal-actions' },
        el('button', { class: 'btn btn-ghost', onclick: close }, 'Cancelar'),
        el('button', { class: 'btn btn-accent', onclick: () => {
          if (!nome.value.trim()) { toast('Dê um nome ao alimento.', 'erro'); return; }
          const g = parseFloat(medG.value) || 100;
          m.itens.push({ nome: nome.value.trim(), per100: { kcal: +kcal.value || 0, ptn: +ptn.value || 0, cho: +cho.value || 0, lip: +lip.value || 0 }, medidaLabel: med.value.trim() || 'porção', medidaG: g, g, custom: true });
          close(); onChange(); redraw();
        } }, 'Adicionar')));
    });
  }

  /* ----------------------------------------------------- exportar dieta PDF */
  function exportarDietaPDF(dieta) {
    if (!window.jspdf) { toast('Biblioteca de PDF não carregou.', 'erro'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = pdfHeader(doc, 'Plano alimentar', (dieta.nomePaciente || 'Paciente') + '  ·  ' + new Date().toLocaleDateString('pt-BR'));

    if (dieta.meta && dieta.meta.kcal) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(110, 92, 68);
      const meta = dieta.meta;
      doc.text('Meta diária: ' + meta.kcal + ' kcal' +
        (meta.ptn ? '  ·  PTN ' + meta.ptn + 'g' : '') + (meta.cho ? '  ·  CHO ' + meta.cho + 'g' : '') + (meta.lip ? '  ·  LIP ' + meta.lip + 'g' : ''), 14, y);
      y += 6;
    }

    let totalKcal = 0;
    dieta.refeicoes.forEach(m => {
      if (!m.itens.length) return;
      let mk = 0;
      const body = m.itens.map(it => {
        const k = (it.per100.kcal || 0) * (it.g || 0) / 100; mk += k; totalKcal += k;
        const medidas = it.medidaG ? +(it.g / it.medidaG).toFixed(1) + ' ' + (it.medidaLabel || '') : '—';
        return [it.nome, fmt(it.g, 0) + ' g', medidas, fmt(k, 0) + ' kcal'];
      });
      if (y > 250) { doc.addPage(); y = 18; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(74, 60, 44);
      doc.text(m.nome + '   ·   ' + fmt(mk, 0) + ' kcal', 14, y);
      doc.autoTable({
        startY: y + 2, head: [['Alimento', 'Quantidade', 'Medida caseira', 'Energia']], body,
        theme: 'striped', styles: { fontSize: 9.5, cellPadding: 2.2, textColor: [60, 49, 34] },
        headStyles: { fillColor: [74, 60, 44], textColor: [246, 238, 223], fontSize: 9 },
        alternateRowStyles: { fillColor: [251, 247, 240] },
        columnStyles: { 1: { halign: 'right', cellWidth: 26 }, 2: { cellWidth: 50 }, 3: { halign: 'right', cellWidth: 24 } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 5;
    });

    if (y > 260) { doc.addPage(); y = 18; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(74, 60, 44);
    doc.text('Total do dia: ' + fmt(totalKcal, 0) + ' kcal', 14, y); y += 7;

    if (dieta.obs) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Orientações', 14, y); y += 2;
      doc.autoTable({ startY: y, body: [[dieta.obs]], theme: 'plain', styles: { fontSize: 10, textColor: [60, 49, 34], cellPadding: 2 }, margin: { left: 14, right: 14 } });
    }

    rodapePaginas(doc);
    doc.save('Plano_' + (dieta.nomePaciente || 'paciente').replace(/\s+/g, '_') + '.pdf');
    toast('Plano alimentar exportado.');
  }

  /* ====================================================================== */
  /*  PACIENTES                                                             */
  /* ====================================================================== */
  async function rotaPacientes() {
    shell('/pacientes', el('div', { class: 'empty' }, el('p', null, 'Carregando…')));
    const [pacs, ats] = await Promise.all([Store.list(COLECOES.PAC), Store.list(COLECOES.AT)]);
    const validos = pacs.filter(p => p.nome).sort((a, b) => a.nome.localeCompare(b.nome));

    const lista = el('div');
    const desenhar = filtro => {
      lista.innerHTML = '';
      const f = (filtro || '').toLowerCase();
      const arr = validos.filter(p => p.nome.toLowerCase().includes(f));
      if (!arr.length) { lista.appendChild(el('div', { class: 'empty' }, el('p', null, 'Nenhum paciente encontrado.'))); return; }
      arr.forEach(p => {
        const consultas = ats.filter(a => a.pacienteId === p.id);
        lista.appendChild(el('div', { class: 'list-row', onclick: () => abrirPaciente(p, consultas) },
          el('div', { class: 'avatar' }, (p.nome[0] || '?').toUpperCase()),
          el('div', { class: 'grow' },
            el('div', { class: 'nome' }, p.nome),
            el('div', { class: 'meta' }, [p.sexo, p.nascimento ? Calc.idade(p.nascimento) + ' anos' : null, consultas.length + ' atendimento' + (consultas.length === 1 ? '' : 's')].filter(Boolean).join(' · '))),
          el('span', { class: 'pill' }, 'ver')));
      });
    };
    const busca = el('input', { placeholder: 'Buscar paciente…', style: 'max-width:340px;padding:10px 14px;border:1px solid var(--linha-2);border-radius:100px;background:var(--surface)' });
    busca.addEventListener('input', () => desenhar(busca.value));
    desenhar('');

    shell('/pacientes',
      pageHead('Pacientes', 'Seus pacientes', 'Histórico de atendimentos e acesso rápido às consultas.'),
      el('div', { class: 'mb' }, busca),
      lista);
  }

  function abrirPaciente(p, consultas) {
    modal((box, close) => {
      box.appendChild(el('h3', null, p.nome));
      box.appendChild(el('div', { class: 'sub' }, [p.sexo, p.nascimento ? Calc.idade(p.nascimento) + ' anos' : null, p.telefone, p.email].filter(Boolean).join(' · ')));
      if (!consultas.length) box.appendChild(el('div', { class: 'muted' }, 'Sem atendimentos.'));
      else {
        const lista = el('div', { class: 'pick-list' });
        consultas.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).forEach(a => {
          lista.appendChild(el('div', { class: 'pick-row', onclick: () => { close(); go('/atendimento/' + a.id); } },
            el('div', { class: 'nome' }, FORM_SCHEMAS[a.tipo] ? FORM_SCHEMAS[a.tipo].nome : a.tipo),
            el('div', { class: 'meta' }, a.updatedAt ? new Date(a.updatedAt).toLocaleDateString('pt-BR') : '')));
        });
        box.appendChild(lista);
      }
      box.appendChild(el('div', { class: 'modal-actions' },
        el('button', { class: 'btn btn-danger', onclick: async () => {
          if (!confirm('Excluir este paciente e seus atendimentos? Esta ação não pode ser desfeita.')) return;
          for (const a of consultas) await Store.remove(COLECOES.AT, a.id);
          await Store.remove(COLECOES.PAC, p.id);
          close(); toast('Paciente excluído.'); rotaPacientes();
        } }, 'Excluir'),
        el('button', { class: 'btn btn-ghost', onclick: close }, 'Fechar')));
    });
  }

  /* ====================================================================== */
  /*  REFERÊNCIAS                                                           */
  /* ====================================================================== */
  function rotaReferencias() {
    const tabela = (titulo, head, linhas) => el('div', { class: 'card card-pad' },
      el('h3', { style: 'margin-bottom:12px' }, titulo),
      (() => {
        const t = el('table', { class: 'tbl' });
        t.appendChild(el('thead', null, el('tr', null, ...head.map(h => el('th', null, h)))));
        const tb = el('tbody');
        linhas.forEach(l => tb.appendChild(el('tr', null, ...l.map(c => el('td', null, c)))));
        t.appendChild(tb);
        return t;
      })());

    shell('/referencias',
      pageHead('Apoio clínico', 'Referências rápidas',
        'Sinais de carências nutricionais e ativos para nutrição estética. Material de consulta durante o atendimento.'),
      el('div', { class: 'ref-grid' },
        tabela('Sinais clínicos de carências', ['Local', 'Sinal', 'Possível carência'], REFERENCIAS.carencias),
        tabela('Ativos para nutrição estética', ['Ativo', 'Origem', 'Ação'], REFERENCIAS.ativosEsteticos)),
    );
  }

  /* ====================================================================== */
  /*  CONFIGURAÇÕES                                                         */
  /* ====================================================================== */
  function rotaConfig() {
    const cfg = state.config || { id: 'perfil' };
    const campo = (lab, key, ph) => {
      const i = el('input', { placeholder: ph || '', value: cfg[key] || '' });
      i.addEventListener('input', () => { cfg[key] = i.value; debouncedSave(COLECOES.CFG, cfg, 600); });
      return el('div', { class: 'field half' }, el('label', null, lab), i);
    };
    shell('/config',
      pageHead('Configurações', 'Seu perfil profissional',
        'Esses dados aparecem no cabeçalho dos relatórios e planos em PDF que você entrega ao paciente.'),
      el('div', { class: 'row between mb' }, el('div', { class: 'save-state', id: 'save-state' }, el('span', { class: 'dot' }), 'salvo automaticamente'), ''),
      el('div', { class: 'card card-pad' },
        el('div', { class: 'form-grid' },
          campo('Nome completo', 'nome', 'ex.: Dra. Ana Nutricionista'),
          campo('CRN', 'crn', 'ex.: 12345/P'),
          campo('Especialidade / título', 'especialidade', 'ex.: Nutrição clínica e estética'),
          campo('Telefone / WhatsApp', 'contato', ''),
          campo('E-mail profissional', 'email', ''),
          campo('Instagram / site', 'instagram', '@seuperfil'))),
      el('div', { class: 'card card-pad mt' },
        el('h3', { style: 'margin-bottom:8px' }, 'Sobre o armazenamento'),
        el('p', { class: 'muted', style: 'font-size:13.5px' },
          Store.getMode() === 'cloud'
            ? 'Seus dados estão sendo salvos na nuvem (Firebase) e sincronizam entre dispositivos.'
            : 'No momento os dados ficam salvos apenas neste navegador. Para sincronizar na nuvem, preencha o arquivo js/firebase-config.js (veja o README).')),
    );
    marcarSalvo();
  }

  /* ---------------------------------------------------------------- início */
  return { boot, _router: router };
})();

document.addEventListener('DOMContentLoaded', App.boot);
