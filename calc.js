/* ============================================================================
   calc.js — Motor de cálculo dietético
   Todas as fórmulas seguem o material "calculosss.pdf".
   ============================================================================ */

const Calc = {

  /* Idade a partir da data de nascimento (string yyyy-mm-dd) */
  idade(nascimento) {
    if (!nascimento) return null;
    const n = new Date(nascimento);
    if (isNaN(n)) return null;
    const hoje = new Date();
    let i = hoje.getFullYear() - n.getFullYear();
    const m = hoje.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) i--;
    return i;
  },

  /* ---- TMB ---------------------------------------------------------------- */
  /* FAO/OMS (2001) — por faixa etária e sexo, usa só peso */
  tmbFAO(sexo, peso, idade) {
    const f = sexo === 'Masculino';
    if (idade <= 30) return f ? 15.057 * peso + 692.2 : 14.818 * peso + 486.6;
    if (idade <= 60) return f ? 11.472 * peso + 873.1 : 8.126 * peso + 845.6;
    return f ? 11.711 * peso + 587.7 : 9.082 * peso + 658.5;
  },

  /* Harris & Benedict (1919) — peso, altura (cm), idade */
  tmbHarris(sexo, peso, alturaCm, idade) {
    return sexo === 'Masculino'
      ? 66.5 + 13.8 * peso + 5 * alturaCm - 6.8 * idade
      : 655.1 + 9.6 * peso + 1.8 * alturaCm - 4.7 * idade;
  },

  tmb(formula, { sexo, peso, alturaCm, idade }) {
    return formula === 'harris'
      ? this.tmbHarris(sexo, peso, alturaCm, idade)
      : this.tmbFAO(sexo, peso, idade);
  },

  fatorAtividade(sexo, intensidade) {
    return CALC_DATA.fatorAtividade[sexo][intensidade];
  },

  /* ---- GET / VET ---------------------------------------------------------- */
  /* Método VENTA (documento): separa horas de sono das horas de rotina.
     Ve1 = (TMB/24) × horas de sono
     Ve2 = (TMB/24) × (24 − sono) × fator de atividade
     VET = (Ve1 + Ve2) × 1,1  (efeito termogênico do alimento) */
  getVENTA(tmb, horasSono, fator) {
    const porHora = tmb / 24;
    const ve1 = porHora * horasSono;
    const ve2 = porHora * (24 - horasSono) * fator;
    const bruto = ve1 + ve2;
    const final = bruto * 1.1;
    return { porHora, ve1, ve2, bruto, termogenese: final - bruto, final };
  },

  /* Método do fator de atividade simples: GET = TMB × fator */
  getFator(tmb, fator) {
    const final = tmb * fator;
    return { porHora: null, ve1: null, ve2: null, bruto: final, termogenese: 0, final };
  },

  get(metodo, { tmb, horasSono, fator }) {
    return metodo === 'fator' ? this.getFator(tmb, fator) : this.getVENTA(tmb, horasSono, fator);
  },

  /* ---- IMC ---------------------------------------------------------------- */
  imc(peso, alturaCm) {
    const m = alturaCm / 100;
    return peso / (m * m);
  },
  classificaIMC(imc, idade) {
    const tabela = idade != null && idade > 60 ? CALC_DATA.imcIdoso : CALC_DATA.imcAdulto;
    for (const faixa of tabela) if (imc <= faixa.max) return faixa.classe;
    return '—';
  },

  /* ---- Meta calórica (método VENTA de déficit/superávit) ------------------ */
  ajusteVENTA(kgMes) {
    // valor exato ou mais próximo da tabela
    let melhor = CALC_DATA.venta[0];
    let dif = Infinity;
    for (const v of CALC_DATA.venta) {
      const d = Math.abs(v.kgMes - kgMes);
      if (d < dif) { dif = d; melhor = v; }
    }
    return melhor;
  },
  metaCalorica(vet, objetivo, kgMes) {
    if (objetivo === 'manter') return { alvo: vet, ajuste: 0, kgMes: 0 };
    const v = this.ajusteVENTA(kgMes);
    const ajuste = objetivo === 'perder' ? -v.kcal : v.kcal;
    return { alvo: vet + ajuste, ajuste, kgMes: v.kgMes, kcalTabela: v.kcal };
  },

  /* ---- Composição corporal (dobras Durnin & Wormersley) ------------------- */
  colunaDobras(sexo, idade) {
    // índices: H17-29,H30-39,H40-49,H50+, M16-29,M30-39,M40-49,M50+
    const base = sexo === 'Masculino' ? 0 : 4;
    if (idade < 30) return base + 0;
    if (idade < 40) return base + 1;
    if (idade < 50) return base + 2;
    return base + 3;
  },
  gorduraDobras(somaDobras, sexo, idade) {
    const { somas, tabela } = CALC_DATA.dobras;
    // soma mais próxima existente na tabela
    let chave = somas[0], dif = Infinity;
    for (const s of somas) { const d = Math.abs(s - somaDobras); if (d < dif) { dif = d; chave = s; } }
    const col = this.colunaDobras(sexo, idade);
    let val = tabela[chave][col];
    // se célula vazia, procura a linha existente mais próxima com valor
    if (val == null) {
      for (let i = 0; i < somas.length; i++) {
        const acima = tabela[somas[i]][col];
        if (acima != null && Math.abs(somas[i] - somaDobras) < 40) { val = acima; break; }
      }
    }
    return val;
  },
  classificaGordura(pct, sexo) {
    for (const faixa of CALC_DATA.gorduraRef[sexo]) if (pct <= faixa.max) return faixa.classe;
    return '—';
  },

  /* ---- Circunferências ---------------------------------------------------- */
  classificaCintura(cm, sexo) {
    const r = CALC_DATA.cintura[sexo];
    if (cm >= r.muito) return 'Muito aumentado (risco elevado)';
    if (cm >= r.aumentado) return 'Aumentado (risco)';
    return 'Adequado';
  },
  rcq(cintura, quadril, sexo) {
    if (!cintura || !quadril) return null;
    const valor = cintura / quadril;
    const limite = CALC_DATA.rcq[sexo];
    return { valor, risco: valor > limite, limite };
  },

  /* ---- Macronutrientes ---------------------------------------------------- */
  macros(vet, dist, peso) {
    const kcal = {
      ptn: vet * dist.ptn / 100,
      cho: vet * dist.cho / 100,
      lip: vet * dist.lip / 100,
    };
    const g = {
      ptn: kcal.ptn / 4,
      cho: kcal.cho / 4,
      lip: kcal.lip / 9,
    };
    const gkg = peso ? { ptn: g.ptn / peso, cho: g.cho / peso, lip: g.lip / peso } : null;
    return { kcal, g, gkg };
  },

  /* ---- Resultado completo ------------------------------------------------- */
  /* entrada: {sexo, idade, peso, alturaCm, horasSono, intensidade,
               formulaTMB, metodoGET, objetivo, kgMes, macroDist,
               cintura?, quadril?, somaDobras?} */
  completo(e) {
    const out = { entrada: e, avisos: [] };

    out.idade = e.idade;
    out.tmb = this.tmb(e.formulaTMB, e);
    out.fator = this.fatorAtividade(e.sexo, e.intensidade);
    out.get = this.get(e.metodoGET, { tmb: out.tmb, horasSono: e.horasSono, fator: out.fator });
    out.vet = out.get.final;

    if (e.alturaCm) {
      out.imc = this.imc(e.peso, e.alturaCm);
      out.imcClasse = this.classificaIMC(out.imc, e.idade);
    }

    out.meta = this.metaCalorica(out.vet, e.objetivo, e.kgMes);

    if (e.macroDist) out.macro = this.macros(out.meta.alvo, e.macroDist, e.peso);

    if (e.somaDobras) {
      out.gordura = this.gorduraDobras(e.somaDobras, e.sexo, e.idade);
      if (out.gordura != null) out.gorduraClasse = this.classificaGordura(out.gordura, e.sexo);
    }
    if (e.cintura) out.cinturaClasse = this.classificaCintura(e.cintura, e.sexo);
    if (e.cintura && e.quadril) out.rcq = this.rcq(e.cintura, e.quadril, e.sexo);

    return out;
  },
};
