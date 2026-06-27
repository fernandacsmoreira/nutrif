/* ============================================================================
   data.js — Esquemas das anamneses, tabelas de cálculo e base de alimentos
   Tudo aqui é DADO puro (sem lógica). Pode editar livremente: adicionar
   perguntas, alimentos ou ajustar valores conforme sua prática.
   ============================================================================ */

/* ----------------------------------------------------------------------------
   Campos de identificação reutilizados em todas as fichas
---------------------------------------------------------------------------- */
const IDENT_FIELDS = [
  { id: 'nome',        label: 'Nome completo',      tipo: 'texto',  obrigatorio: true,  largura: 'full' },
  { id: 'nascimento',  label: 'Data de nascimento', tipo: 'data',   largura: 'third' },
  { id: 'sexo',        label: 'Sexo biológico',     tipo: 'select', opcoes: ['Feminino', 'Masculino'], largura: 'third', ajuda: 'Usado nos cálculos de TMB e composição corporal.' },
  { id: 'estado_civil',label: 'Estado civil',       tipo: 'select', opcoes: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'], largura: 'third' },
  { id: 'telefone',    label: 'Telefone / WhatsApp',tipo: 'texto',  largura: 'third' },
  { id: 'email',       label: 'E-mail',             tipo: 'texto',  largura: 'third' },
  { id: 'cidade_uf',   label: 'Cidade / UF',        tipo: 'texto',  largura: 'third' },
  { id: 'profissao',   label: 'Profissão / ocupação',tipo: 'texto', largura: 'half' },
  { id: 'indicacao',   label: 'Como conheceu / indicação', tipo: 'texto', largura: 'half' },
];

/* Bloco de recordatório alimentar reutilizado */
const RECORDATORIO_FIELDS = [
  { id: 'r24_cafe',    label: 'Café da manhã (o que costuma comer e horário)', tipo: 'textarea', largura: 'full' },
  { id: 'r24_lanche1', label: 'Lanche da manhã', tipo: 'textarea', largura: 'half' },
  { id: 'r24_almoco',  label: 'Almoço', tipo: 'textarea', largura: 'half' },
  { id: 'r24_lanche2', label: 'Lanche da tarde', tipo: 'textarea', largura: 'half' },
  { id: 'r24_jantar',  label: 'Jantar', tipo: 'textarea', largura: 'half' },
  { id: 'r24_ceia',    label: 'Ceia / antes de dormir', tipo: 'textarea', largura: 'half' },
  { id: 'r24_belisco', label: 'Beliscos fora de hora (o quê e quando)', tipo: 'textarea', largura: 'half' },
];

/* ----------------------------------------------------------------------------
   ESQUEMAS DAS FICHAS
---------------------------------------------------------------------------- */
const FORM_SCHEMAS = {

  /* ===== 1. PRIMEIRA CONSULTA — PADRÃO ===================================== */
  padrao: {
    id: 'padrao',
    nome: 'Primeira consulta — Padrão',
    descricao: 'Anamnese completa para montar o plano alimentar do zero, adaptado à rotina.',
    duracao: '45 min',
    secoes: [
      { titulo: 'Identificação', campos: IDENT_FIELDS },

      { titulo: 'Objetivo e expectativas', campos: [
        { id: 'objetivo_principal', label: 'Objetivo principal', tipo: 'select',
          opcoes: ['Emagrecimento', 'Ganho de massa muscular', 'Reeducação alimentar', 'Saúde / controle de doença', 'Performance esportiva', 'Manutenção de peso', 'Outro'], largura: 'half' },
        { id: 'objetivos_3', label: 'Três principais razões para a consulta', tipo: 'textarea', largura: 'full' },
        { id: 'como_ajudar', label: 'Como você acha que posso te ajudar?', tipo: 'textarea', largura: 'full' },
        { id: 'prazo', label: 'Existe um prazo ou evento (viagem, casamento, etc.)?', tipo: 'texto', largura: 'half' },
        { id: 'nutri_anterior', label: 'Já foi a nutricionista? O que funcionou / não funcionou?', tipo: 'textarea', largura: 'full' },
      ]},

      { titulo: 'História clínica', campos: [
        { id: 'doencas', label: 'Doenças diagnosticadas', tipo: 'textarea', largura: 'full', placeholder: 'Diabetes, hipertensão, tireoide, SOP, gastrite...' },
        { id: 'hist_familiar', label: 'Histórico familiar', tipo: 'checkbox',
          opcoes: ['Diabetes', 'Hipertensão', 'Dislipidemia / colesterol', 'Obesidade', 'Doença cardíaca', 'Câncer', 'Doença da tireoide', 'Nenhum'], largura: 'full' },
        { id: 'cirurgias', label: 'Cirurgias / internações relevantes', tipo: 'textarea', largura: 'half' },
        { id: 'medicamentos', label: 'Medicamentos em uso (nome e dose)', tipo: 'textarea', largura: 'half',
          ajuda: 'Verifique interações na aba Referências.' },
        { id: 'suplementos', label: 'Suplementos / fitoterápicos em uso', tipo: 'textarea', largura: 'half' },
        { id: 'alergias', label: 'Alergias e intolerâncias alimentares', tipo: 'textarea', largura: 'half', placeholder: 'Lactose, glúten, frutos do mar...' },
        { id: 'exames', label: 'Exames laboratoriais recentes (valores relevantes)', tipo: 'textarea', largura: 'full', placeholder: 'Glicemia, HbA1c, colesterol total/HDL/LDL, TG, TSH, ferritina, vit. D...' },
      ]},

      { titulo: 'Sinais e sintomas', campos: [
        { id: 'intestino', label: 'Hábito intestinal', tipo: 'select', opcoes: ['Diário', '1x a cada 2 dias', '2-3x por semana', 'Constipado', 'Diarreia frequente', 'Alternado'], largura: 'third' },
        { id: 'digestao', label: 'Digestão', tipo: 'select', opcoes: ['Boa', 'Azia / refluxo', 'Gases / distensão', 'Empachamento', 'Náusea'], largura: 'third' },
        { id: 'sono_qualidade', label: 'Qualidade do sono', tipo: 'select', opcoes: ['Excelente', 'Boa', 'Regular', 'Ruim'], largura: 'third' },
        { id: 'estresse', label: 'Nível de estresse', tipo: 'select', opcoes: ['Baixo', 'Moderado', 'Alto', 'Muito alto'], largura: 'third' },
        { id: 'energia', label: 'Disposição / energia no dia', tipo: 'select', opcoes: ['Alta', 'Média', 'Baixa', 'Oscila muito'], largura: 'third' },
        { id: 'fome_emocional', label: 'Come por ansiedade / estresse?', tipo: 'select', opcoes: ['Não', 'Às vezes', 'Frequente', 'Sempre'], largura: 'third' },
      ]},

      { titulo: 'Hábitos alimentares', campos: [
        { id: 'refeicoes_dia', label: 'Quantas refeições faz por dia?', tipo: 'select', opcoes: ['1-2', '3', '4', '5', '6 ou mais'], largura: 'third' },
        { id: 'agua', label: 'Copos de água por dia', tipo: 'select', opcoes: ['Menos de 3', '3-5', '6-8', 'Mais de 8'], largura: 'third' },
        { id: 'horario_fome', label: 'Horário de maior fome', tipo: 'texto', largura: 'third' },
        { id: 'quem_cozinha', label: 'Quem prepara as refeições?', tipo: 'select', opcoes: ['Eu mesmo(a)', 'Família', 'Empregada(o)', 'Marmita / delivery', 'Varia'], largura: 'third' },
        { id: 'come_fora', label: 'Refeições feitas fora de casa por semana', tipo: 'texto', largura: 'third' },
        { id: 'tempo_preparo', label: 'Tempo disponível para cozinhar', tipo: 'select', opcoes: ['Bastante', 'Moderado', 'Pouco', 'Quase nenhum'], largura: 'third' },
        { id: 'alcool', label: 'Consumo de álcool', tipo: 'texto', largura: 'third', placeholder: 'Tipo e frequência' },
        { id: 'ultraprocessados', label: 'Ultraprocessados / fast-food (frequência)', tipo: 'texto', largura: 'third' },
        { id: 'cafeina', label: 'Café / cafeína por dia', tipo: 'texto', largura: 'third' },
      ]},

      { titulo: 'Recordatório alimentar (24h)', campos: RECORDATORIO_FIELDS },

      { titulo: 'Preferências e restrições', campos: [
        { id: 'padrao_alimentar', label: 'Padrão alimentar', tipo: 'checkbox',
          opcoes: ['Onívoro', 'Vegetariano', 'Vegano', 'Low carb', 'Sem glúten', 'Sem lactose', 'Restrição religiosa'], largura: 'full' },
        { id: 'ama', label: 'Alimentos que ama / não abre mão', tipo: 'textarea', largura: 'half' },
        { id: 'nao_gosta', label: 'Alimentos que não gosta', tipo: 'textarea', largura: 'half' },
        { id: 'frutas_consome', label: 'Frutas que costuma consumir', tipo: 'textarea', largura: 'half' },
        { id: 'verduras_consome', label: 'Verduras e legumes que aceita bem', tipo: 'textarea', largura: 'half' },
      ]},

      { titulo: 'Rotina e estilo de vida', campos: [
        { id: 'rotina', label: 'Descreva um dia típico (acordar, trabalho, refeições, dormir)', tipo: 'textarea', largura: 'full' },
        { id: 'trabalho_horario', label: 'Horário de trabalho', tipo: 'texto', largura: 'half' },
        { id: 'atividade_fisica', label: 'Atividade física (tipo, frequência, horário)', tipo: 'textarea', largura: 'half' },
        { id: 'fumante', label: 'Tabagismo', tipo: 'select', opcoes: ['Não', 'Sim', 'Ex-fumante'], largura: 'third' },
        { id: 'hora_dormir', label: 'Costuma dormir às', tipo: 'texto', largura: 'third' },
        { id: 'hora_acordar', label: 'Costuma acordar às', tipo: 'texto', largura: 'third' },
      ]},

      { titulo: 'Antropometria e metas', campos: [
        { id: 'peso_atual', label: 'Peso atual (kg)', tipo: 'numero', largura: 'third' },
        { id: 'peso_habitual', label: 'Peso habitual (kg)', tipo: 'numero', largura: 'third' },
        { id: 'peso_desejado', label: 'Peso desejado (kg)', tipo: 'numero', largura: 'third' },
        { id: 'obs_gerais', label: 'Observações da consulta', tipo: 'textarea', largura: 'full' },
      ]},
    ]
  },

  /* ===== 2. SEGUNDA CONSULTA — RETORNO ==================================== */
  retorno2: {
    id: 'retorno2',
    nome: 'Segunda consulta — Retorno',
    descricao: 'Acompanhamento do início do tratamento: adesão, primeiras mudanças e ajustes.',
    duracao: '30 min',
    secoes: [
      { titulo: 'Identificação', campos: [
        { id: 'nome', label: 'Nome completo', tipo: 'texto', obrigatorio: true, largura: 'full' },
        { id: 'sexo', label: 'Sexo biológico', tipo: 'select', opcoes: ['Feminino', 'Masculino'], largura: 'third' },
        { id: 'nascimento', label: 'Data de nascimento', tipo: 'data', largura: 'third' },
        { id: 'dias_desde', label: 'Dias desde a última consulta', tipo: 'texto', largura: 'third' },
      ]},
      { titulo: 'Adesão ao plano', campos: [
        { id: 'adesao', label: 'Adesão ao plano alimentar', tipo: 'select', opcoes: ['Total (>90%)', 'Boa (70-90%)', 'Parcial (40-70%)', 'Baixa (<40%)'], largura: 'half' },
        { id: 'dificuldades', label: 'Principais dificuldades encontradas', tipo: 'textarea', largura: 'full' },
        { id: 'funcionou', label: 'O que funcionou bem', tipo: 'textarea', largura: 'half' },
        { id: 'nao_funcionou', label: 'O que não funcionou / precisa mudar', tipo: 'textarea', largura: 'half' },
      ]},
      { titulo: 'Mudanças percebidas', campos: [
        { id: 'fome_saciedade', label: 'Fome e saciedade', tipo: 'select', opcoes: ['Melhor controle', 'Sem mudança', 'Mais fome', 'Muita vontade de doce'], largura: 'third' },
        { id: 'energia_ret', label: 'Energia / disposição', tipo: 'select', opcoes: ['Melhorou', 'Igual', 'Piorou'], largura: 'third' },
        { id: 'intestino_ret', label: 'Intestino', tipo: 'select', opcoes: ['Melhorou', 'Igual', 'Piorou'], largura: 'third' },
        { id: 'sono_ret', label: 'Sono', tipo: 'select', opcoes: ['Melhorou', 'Igual', 'Piorou'], largura: 'third' },
        { id: 'compulsao', label: 'Episódios de compulsão / beliscos', tipo: 'textarea', largura: 'full' },
      ]},
      { titulo: 'Rotina e exercício', campos: [
        { id: 'atividade_ret', label: 'Atividade física atual', tipo: 'textarea', largura: 'half' },
        { id: 'exames_novos', label: 'Novos exames ou sintomas', tipo: 'textarea', largura: 'half' },
      ]},
      { titulo: 'Reavaliação e metas', campos: [
        { id: 'peso_atual', label: 'Peso atual (kg)', tipo: 'numero', largura: 'third' },
        { id: 'ajustes', label: 'Ajustes desejados pelo paciente', tipo: 'textarea', largura: 'full' },
        { id: 'metas_proximo', label: 'Metas para o próximo período', tipo: 'textarea', largura: 'full' },
        { id: 'obs_gerais', label: 'Observações da consulta', tipo: 'textarea', largura: 'full' },
      ]},
    ]
  },

  /* ===== 3. TERCEIRA CONSULTA — ACOMPANHAMENTO ============================ */
  retorno3: {
    id: 'retorno3',
    nome: 'Terceira consulta — Acompanhamento',
    descricao: 'Consolidação de hábitos, análise de resultados e estratégia de manutenção.',
    duracao: '30 min',
    secoes: [
      { titulo: 'Identificação', campos: [
        { id: 'nome', label: 'Nome completo', tipo: 'texto', obrigatorio: true, largura: 'full' },
        { id: 'sexo', label: 'Sexo biológico', tipo: 'select', opcoes: ['Feminino', 'Masculino'], largura: 'third' },
        { id: 'nascimento', label: 'Data de nascimento', tipo: 'data', largura: 'third' },
        { id: 'tempo_tratamento', label: 'Tempo de acompanhamento', tipo: 'texto', largura: 'third' },
      ]},
      { titulo: 'Evolução desde o início', campos: [
        { id: 'resumo_evolucao', label: 'Resumo da evolução (peso, medidas, hábitos)', tipo: 'textarea', largura: 'full' },
        { id: 'resultados', label: 'Resultados objetivos alcançados', tipo: 'textarea', largura: 'half' },
        { id: 'satisfacao', label: 'Satisfação do paciente', tipo: 'select', opcoes: ['Muito satisfeito', 'Satisfeito', 'Neutro', 'Insatisfeito'], largura: 'half' },
      ]},
      { titulo: 'Hábitos e comportamento', campos: [
        { id: 'adesao', label: 'Adesão atual', tipo: 'select', opcoes: ['Total (>90%)', 'Boa (70-90%)', 'Parcial (40-70%)', 'Baixa (<40%)'], largura: 'half' },
        { id: 'habitos_consolidados', label: 'Hábitos já consolidados', tipo: 'textarea', largura: 'half' },
        { id: 'habitos_dificeis', label: 'Hábitos ainda difíceis', tipo: 'textarea', largura: 'half' },
        { id: 'relacao_comida', label: 'Relação com a comida / compulsão', tipo: 'textarea', largura: 'half' },
      ]},
      { titulo: 'Saúde geral', campos: [
        { id: 'sono_estresse', label: 'Sono e estresse', tipo: 'textarea', largura: 'half' },
        { id: 'exercicio_ret', label: 'Exercício físico', tipo: 'textarea', largura: 'half' },
        { id: 'exames_acomp', label: 'Exames de acompanhamento', tipo: 'textarea', largura: 'full' },
      ]},
      { titulo: 'Reavaliação e manutenção', campos: [
        { id: 'peso_atual', label: 'Peso atual (kg)', tipo: 'numero', largura: 'third' },
        { id: 'estrategia_manutencao', label: 'Estratégia de manutenção / próximos passos', tipo: 'textarea', largura: 'full' },
        { id: 'obs_gerais', label: 'Observações da consulta', tipo: 'textarea', largura: 'full' },
      ]},
    ]
  },

  /* ===== 4. PRIMEIRA CONSULTA — IDOSOS ==================================== */
  idoso: {
    id: 'idoso',
    nome: 'Primeira consulta — Idosos',
    descricao: 'Avaliação geriátrica com foco em risco nutricional, mastigação, mobilidade e suporte.',
    duracao: '45 min',
    secoes: [
      { titulo: 'Identificação', campos: [
        ...IDENT_FIELDS,
        { id: 'acompanhante', label: 'Acompanhante / cuidador presente', tipo: 'texto', largura: 'half' },
        { id: 'mora_sozinho', label: 'Mora sozinho(a)?', tipo: 'select', opcoes: ['Sim', 'Não — com familiares', 'Não — com cuidador'], largura: 'half' },
      ]},
      { titulo: 'Objetivo', campos: [
        { id: 'objetivo_principal', label: 'Objetivo da consulta', tipo: 'textarea', largura: 'full' },
      ]},
      { titulo: 'História clínica e medicamentos', campos: [
        { id: 'doencas', label: 'Doenças crônicas diagnosticadas', tipo: 'textarea', largura: 'full' },
        { id: 'medicamentos', label: 'Medicamentos em uso — lista completa (polifarmácia)', tipo: 'textarea', largura: 'full', ajuda: 'Consulte interações com vitaminas/minerais na aba Referências.' },
        { id: 'suplementos', label: 'Suplementos em uso', tipo: 'textarea', largura: 'half' },
        { id: 'alergias', label: 'Alergias e intolerâncias', tipo: 'textarea', largura: 'half' },
        { id: 'exames', label: 'Exames recentes (albumina, hemograma, vit. D, B12...)', tipo: 'textarea', largura: 'full' },
      ]},
      { titulo: 'Mastigação, deglutição e apetite', campos: [
        { id: 'denticao', label: 'Dentição / prótese', tipo: 'select', opcoes: ['Dentição própria boa', 'Prótese adaptada', 'Prótese mal adaptada', 'Edêntulo sem prótese'], largura: 'half' },
        { id: 'mastigacao', label: 'Dificuldade de mastigação', tipo: 'select', opcoes: ['Não', 'Leve', 'Moderada', 'Importante'], largura: 'half' },
        { id: 'disfagia', label: 'Engasga ou tem dificuldade de engolir (disfagia)?', tipo: 'select', opcoes: ['Não', 'Com líquidos', 'Com sólidos', 'Ambos'], largura: 'half' },
        { id: 'apetite', label: 'Apetite', tipo: 'select', opcoes: ['Bom', 'Reduzido', 'Muito reduzido'], largura: 'half' },
        { id: 'paladar', label: 'Alteração de paladar / olfato', tipo: 'texto', largura: 'full' },
      ]},
      { titulo: 'Função intestinal e hidratação', campos: [
        { id: 'intestino', label: 'Hábito intestinal', tipo: 'select', opcoes: ['Regular', 'Constipação', 'Diarreia', 'Alternado'], largura: 'half' },
        { id: 'hidratacao', label: 'Ingestão de líquidos ao dia', tipo: 'texto', largura: 'half' },
      ]},
      { titulo: 'Capacidade funcional e cognição', campos: [
        { id: 'mobilidade', label: 'Mobilidade', tipo: 'select', opcoes: ['Independente', 'Anda com apoio', 'Cadeira de rodas', 'Acamado'], largura: 'half' },
        { id: 'quedas', label: 'Quedas no último ano', tipo: 'select', opcoes: ['Nenhuma', '1', '2 ou mais'], largura: 'half' },
        { id: 'faz_compras', label: 'Faz compras e cozinha sozinho(a)?', tipo: 'select', opcoes: ['Sim, totalmente', 'Com ajuda', 'Não'], largura: 'half' },
        { id: 'cognicao', label: 'Esquece de comer ou beber?', tipo: 'select', opcoes: ['Não', 'Às vezes', 'Frequentemente'], largura: 'half' },
        { id: 'quem_prepara', label: 'Quem prepara as refeições?', tipo: 'texto', largura: 'full' },
      ]},
      { titulo: 'Risco nutricional e sarcopenia', campos: [
        { id: 'perda_peso', label: 'Perda de peso involuntária recente', tipo: 'select', opcoes: ['Não', 'Sim, leve', 'Sim, importante (>5% em 6 meses)'], largura: 'half' },
        { id: 'forca', label: 'Sinais de fraqueza / perda de força', tipo: 'select', opcoes: ['Não', 'Leve', 'Importante'], largura: 'half' },
        { id: 'panturrilha', label: 'Circunferência da panturrilha (cm)', tipo: 'numero', largura: 'third', ajuda: '< 31 cm sugere risco de sarcopenia.' },
      ]},
      { titulo: 'Recordatório alimentar', campos: RECORDATORIO_FIELDS },
      { titulo: 'Antropometria e metas', campos: [
        { id: 'peso_atual', label: 'Peso atual (kg)', tipo: 'numero', largura: 'third' },
        { id: 'peso_habitual', label: 'Peso habitual (kg)', tipo: 'numero', largura: 'third' },
        { id: 'obs_gerais', label: 'Observações da consulta', tipo: 'textarea', largura: 'full' },
      ]},
    ]
  },

  /* ===== 5. NUTRIÇÃO ESTÉTICA ============================================ */
  estetica: {
    id: 'estetica',
    nome: 'Nutrição estética',
    descricao: 'Foco em composição corporal, pele, cabelo, unhas, retenção e qualidade tecidual.',
    duracao: '45 min',
    secoes: [
      { titulo: 'Identificação', campos: IDENT_FIELDS },
      { titulo: 'Objetivo estético', campos: [
        { id: 'objetivo_estetico', label: 'Objetivos estéticos', tipo: 'checkbox',
          opcoes: ['Redução de gordura localizada', 'Celulite', 'Flacidez', 'Retenção de líquido / inchaço', 'Qualidade da pele', 'Cabelo e unhas', 'Definição muscular'], largura: 'full' },
        { id: 'areas_preocupacao', label: 'Áreas de maior preocupação', tipo: 'textarea', largura: 'half' },
        { id: 'prazo_evento', label: 'Prazo ou evento alvo', tipo: 'texto', largura: 'half' },
      ]},
      { titulo: 'História hormonal', campos: [
        { id: 'ciclo', label: 'Ciclo menstrual', tipo: 'select', opcoes: ['Regular', 'Irregular', 'Menopausa', 'Não se aplica'], largura: 'third' },
        { id: 'anticoncepcional', label: 'Uso de anticoncepcional / TRH', tipo: 'texto', largura: 'third' },
        { id: 'tpm', label: 'TPM / retenção pré-menstrual', tipo: 'select', opcoes: ['Não', 'Leve', 'Intensa'], largura: 'third' },
        { id: 'tireoide_sop', label: 'Tireoide / SOP / alterações hormonais', tipo: 'texto', largura: 'full' },
      ]},
      { titulo: 'Pele, cabelo e unhas', campos: [
        { id: 'pele', label: 'Pele', tipo: 'checkbox', opcoes: ['Oleosa', 'Seca', 'Acne', 'Manchas', 'Sensível', 'Boa'], largura: 'full' },
        { id: 'cabelo', label: 'Cabelo (queda, ressecamento, brilho)', tipo: 'texto', largura: 'half' },
        { id: 'unhas', label: 'Unhas (fracas, quebradiças)', tipo: 'texto', largura: 'half' },
      ]},
      { titulo: 'Hábitos que impactam a estética', campos: [
        { id: 'agua', label: 'Ingestão de água por dia', tipo: 'select', opcoes: ['Menos de 1L', '1-2L', '2-3L', 'Mais de 3L'], largura: 'third' },
        { id: 'sodio', label: 'Consumo de sódio / industrializados', tipo: 'select', opcoes: ['Baixo', 'Moderado', 'Alto'], largura: 'third' },
        { id: 'acucar', label: 'Consumo de açúcar / doces', tipo: 'select', opcoes: ['Baixo', 'Moderado', 'Alto'], largura: 'third' },
        { id: 'alcool', label: 'Álcool (tipo e frequência)', tipo: 'texto', largura: 'third' },
        { id: 'sono_qualidade', label: 'Qualidade do sono', tipo: 'select', opcoes: ['Boa', 'Regular', 'Ruim'], largura: 'third' },
        { id: 'estresse', label: 'Nível de estresse', tipo: 'select', opcoes: ['Baixo', 'Moderado', 'Alto'], largura: 'third' },
        { id: 'intestino', label: 'Hábito intestinal (relação com inchaço)', tipo: 'select', opcoes: ['Regular', 'Constipado', 'Diarreia', 'Alternado'], largura: 'third' },
      ]},
      { titulo: 'Exercício e procedimentos', campos: [
        { id: 'atividade_fisica', label: 'Atividade física (tipo, foco, frequência)', tipo: 'textarea', largura: 'half' },
        { id: 'procedimentos', label: 'Procedimentos estéticos em andamento', tipo: 'textarea', largura: 'half', placeholder: 'Drenagem, criolipólise, radiofrequência...' },
        { id: 'suplementos', label: 'Suplementos estéticos em uso', tipo: 'textarea', largura: 'full', placeholder: 'Colágeno, antioxidantes, ativos...' },
      ]},
      { titulo: 'Recordatório alimentar', campos: RECORDATORIO_FIELDS },
      { titulo: 'Preferências e restrições', campos: [
        { id: 'padrao_alimentar', label: 'Padrão alimentar', tipo: 'checkbox', opcoes: ['Onívoro', 'Vegetariano', 'Vegano', 'Low carb', 'Sem glúten', 'Sem lactose'], largura: 'full' },
        { id: 'ama', label: 'Alimentos que não abre mão', tipo: 'textarea', largura: 'half' },
        { id: 'nao_gosta', label: 'Alimentos que não gosta', tipo: 'textarea', largura: 'half' },
      ]},
      { titulo: 'Antropometria e composição', campos: [
        { id: 'peso_atual', label: 'Peso atual (kg)', tipo: 'numero', largura: 'third' },
        { id: 'peso_desejado', label: 'Peso desejado (kg)', tipo: 'numero', largura: 'third' },
        { id: 'obs_gerais', label: 'Observações da consulta', tipo: 'textarea', largura: 'full' },
      ]},
    ]
  },
};

/* ----------------------------------------------------------------------------
   TABELAS DE CÁLCULO  (transcritas do seu material "calculosss.pdf")
---------------------------------------------------------------------------- */
const CALC_DATA = {

  /* Fórmulas de TMB disponíveis para escolha */
  formulasTMB: {
    fao: {
      nome: 'FAO/OMS (2001)',
      descricao: 'Por faixa etária e sexo. Usa apenas peso. Recomendada pela OMS.',
      precisaAltura: false,
    },
    harris: {
      nome: 'Harris & Benedict (1919)',
      descricao: 'Usa peso, altura e idade. Clássica e amplamente usada.',
      precisaAltura: true,
    },
  },

  /* Fatores de atividade (intensidade 1=leve, 2=moderada, 3=intensa) */
  fatorAtividade: {
    Feminino:  { 1: 1.56, 2: 1.64, 3: 1.82 },
    Masculino: { 1: 1.55, 2: 1.78, 3: 2.10 },
  },
  intensidadeLabel: { 1: 'Leve', 2: 'Moderada', 3: 'Intensa' },

  /* Método VENTA — kcal/dia a ajustar conforme ritmo de perda/ganho */
  venta: [
    { kgMes: 1.0, kcal: 256 },
    { kgMes: 1.5, kcal: 384 },
    { kgMes: 2.0, kcal: 513 },
    { kgMes: 2.5, kcal: 641 },
    { kgMes: 3.0, kcal: 770 },
    { kgMes: 3.5, kcal: 898 },
    { kgMes: 4.0, kcal: 1026 },
  ],

  /* IMC adultos */
  imcAdulto: [
    { max: 16,   classe: 'Magreza grau 3' },
    { max: 16.9, classe: 'Magreza grau 2' },
    { max: 18.4, classe: 'Magreza grau 1' },
    { max: 24.9, classe: 'Eutrofia' },
    { max: 29.9, classe: 'Sobrepeso' },
    { max: 34.9, classe: 'Obesidade grau 1' },
    { max: 39.9, classe: 'Obesidade grau 2' },
    { max: Infinity, classe: 'Obesidade grau 3' },
  ],

  /* IMC idosos (>60 anos) */
  imcIdoso: [
    { max: 22, classe: 'Magreza' },
    { max: 27, classe: 'Eutrofia' },
    { max: Infinity, classe: 'Obesidade' },
  ],

  /* Referência de % de gordura corporal */
  gorduraRef: {
    Masculino: [
      { max: 8,  classe: 'Magro' },
      { max: 15, classe: 'Ótimo' },
      { max: 20, classe: 'Leve adiposidade' },
      { max: 24, classe: 'Adiposidade' },
      { max: Infinity, classe: 'Obesidade' },
    ],
    Feminino: [
      { max: 13, classe: 'Magro' },
      { max: 23, classe: 'Ótimo' },
      { max: 27, classe: 'Leve adiposidade' },
      { max: 32, classe: 'Adiposidade' },
      { max: Infinity, classe: 'Obesidade' },
    ],
  },

  /* Circunferência da cintura */
  cintura: {
    Masculino: { aumentado: 94, muito: 102 },
    Feminino:  { aumentado: 80, muito: 88 },
  },
  /* Relação cintura-quadril — limite de risco cardiovascular */
  rcq: { Masculino: 1.0, Feminino: 0.85 },

  /* Tabela Durnin & Wormersley — % de gordura pela soma de 4 dobras
     (bíceps, tríceps, subescapular, supra-ilíaca).
     Colunas: H17-29, H30-39, H40-49, H50+, M16-29, M30-39, M40-49, M50+
     Valores ausentes no original foram interpolados; usar a soma mais próxima. */
  dobras: {
    somas: [15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140,145,150,155,160,165,170,175,180,185,190,195,200,205,210],
    tabela: {
      15:[4.8,null,null,null,10.5,null,null,null],
      20:[8.1,12.2,12.2,12.6,14.1,17.0,19.8,21.4],
      25:[10.5,14.2,15.0,15.6,16.8,19.4,22.2,24.0],
      30:[12.9,16.2,17.7,18.6,19.5,21.8,24.5,26.6],
      35:[14.7,17.7,19.6,20.8,21.5,23.7,26.4,28.5],
      40:[16.4,19.2,21.4,22.9,23.4,25.5,28.2,30.3],
      45:[17.7,20.4,23.0,24.7,25.0,26.9,29.6,31.9],
      50:[19.0,21.5,24.6,26.5,26.5,28.2,31.0,33.4],
      55:[20.1,22.5,25.9,27.9,27.8,29.4,32.1,34.6],
      60:[21.2,23.5,27.1,29.2,29.1,30.6,33.2,35.7],
      65:[22.2,24.3,28.2,30.4,30.2,31.6,34.1,36.7],
      70:[23.1,25.1,29.3,31.6,31.2,32.5,35.0,37.7],
      75:[24.0,25.9,30.3,32.7,32.2,33.4,35.9,38.7],
      80:[24.8,26.6,31.2,33.8,33.1,34.3,36.7,39.6],
      85:[25.5,27.2,32.1,34.8,34.0,35.1,37.5,40.4],
      90:[26.2,27.8,33.0,35.8,35.6,35.8,38.3,41.2],
      95:[26.9,28.4,33.7,36.6,36.4,36.5,39.0,41.9],
      100:[27.6,29.0,34.4,37.4,37.1,37.2,39.7,42.6],
      105:[28.2,29.6,35.1,37.8,37.8,37.9,40.4,43.3],
      110:[28.8,30.1,35.8,39.0,38.4,38.6,41.0,43.9],
      115:[29.4,30.6,36.4,39.7,39.0,39.1,41.5,44.5],
      120:[30.0,31.1,37.0,40.4,39.6,39.6,42.0,45.1],
      125:[30.5,31.5,37.6,41.1,40.2,40.1,42.5,45.7],
      130:[31.0,31.9,38.2,41.8,40.8,40.6,43.0,46.2],
      135:[31.5,32.3,38.7,42.4,41.3,41.1,43.5,46.7],
      140:[32.0,32.7,39.2,43.0,41.8,41.6,44.0,47.2],
      145:[32.5,33.1,39.7,43.6,42.3,42.1,44.5,47.7],
      150:[32.9,33.5,40.2,44.1,42.8,42.6,45.0,48.2],
      155:[33.3,33.9,40.7,44.6,43.3,43.1,45.4,48.7],
      160:[33.7,34.3,41.2,45.1,43.7,43.6,45.8,49.2],
      165:[34.1,34.6,41.6,45.6,44.1,44.0,46.2,49.6],
      170:[34.5,34.8,42.0,46.1,null,44.4,46.6,50.0],
      175:[34.9,null,null,null,null,44.8,47.0,50.4],
      180:[35.3,null,null,null,null,45.2,47.4,50.8],
      185:[35.6,null,null,null,null,45.6,47.8,51.2],
      190:[35.9,null,null,null,null,45.9,48.2,51.6],
      195:[null,null,null,null,null,46.2,48.5,52.0],
      200:[null,null,null,null,null,46.5,48.8,52.4],
      205:[null,null,null,null,null,null,49.1,52.7],
      210:[null,null,null,null,null,null,49.4,53.0],
    }
  },

  /* Distribuição de macronutrientes — presets (% do VET) */
  macroPresets: {
    'Padrão (15/55/30)':        { ptn: 15, cho: 55, lip: 30 },
    'Emagrecimento (25/45/30)': { ptn: 25, cho: 45, lip: 30 },
    'Hipertrofia (30/50/20)':   { ptn: 30, cho: 50, lip: 20 },
    'Low carb (30/40/30)':      { ptn: 30, cho: 40, lip: 30 },
    'Idoso / proteico (25/50/25)': { ptn: 25, cho: 50, lip: 25 },
  },
};

/* ----------------------------------------------------------------------------
   BASE DE ALIMENTOS  (valores aproximados por 100 g, base TACO/IBGE)
   Edite, adicione ou ajuste à vontade. Campos:
   nome, grupo, kcal, ptn, cho, lip (por 100 g), medida (caseira), g (gramas da medida)
---------------------------------------------------------------------------- */
const FOOD_DB = [
  // Cereais e tubérculos
  { nome: 'Arroz branco cozido', grupo: 'Cereais', kcal: 128, ptn: 2.5, cho: 28.1, lip: 0.2, medida: 'colher de sopa cheia', g: 25 },
  { nome: 'Arroz integral cozido', grupo: 'Cereais', kcal: 124, ptn: 2.6, cho: 25.8, lip: 1.0, medida: 'colher de sopa cheia', g: 25 },
  { nome: 'Macarrão cozido', grupo: 'Cereais', kcal: 158, ptn: 5.8, cho: 30.9, lip: 0.9, medida: 'pegador', g: 60 },
  { nome: 'Batata inglesa cozida', grupo: 'Tubérculos', kcal: 52, ptn: 1.2, cho: 11.9, lip: 0.0, medida: 'unidade média', g: 130 },
  { nome: 'Batata doce cozida', grupo: 'Tubérculos', kcal: 77, ptn: 0.6, cho: 18.4, lip: 0.1, medida: 'fatia média', g: 80 },
  { nome: 'Mandioca cozida', grupo: 'Tubérculos', kcal: 125, ptn: 0.6, cho: 30.1, lip: 0.3, medida: 'pedaço médio', g: 90 },
  { nome: 'Pão francês', grupo: 'Pães', kcal: 300, ptn: 8.0, cho: 58.6, lip: 3.1, medida: 'unidade', g: 50 },
  { nome: 'Pão de forma integral', grupo: 'Pães', kcal: 253, ptn: 9.4, cho: 49.9, lip: 3.5, medida: 'fatia', g: 25 },
  { nome: 'Tapioca (goma)', grupo: 'Cereais', kcal: 240, ptn: 0.0, cho: 60.0, lip: 0.0, medida: 'colher de sopa', g: 20 },
  { nome: 'Aveia em flocos', grupo: 'Cereais', kcal: 394, ptn: 13.9, cho: 66.6, lip: 8.5, medida: 'colher de sopa', g: 15 },
  { nome: 'Granola', grupo: 'Cereais', kcal: 471, ptn: 11.0, cho: 64.0, lip: 17.0, medida: 'colher de sopa', g: 18 },

  // Proteínas
  { nome: 'Peito de frango grelhado', grupo: 'Carnes', kcal: 159, ptn: 32.0, cho: 0.0, lip: 2.5, medida: 'filé médio', g: 100 },
  { nome: 'Coxa de frango assada (s/ pele)', grupo: 'Carnes', kcal: 215, ptn: 28.0, cho: 0.0, lip: 11.0, medida: 'unidade', g: 90 },
  { nome: 'Patinho moído cozido', grupo: 'Carnes', kcal: 219, ptn: 35.0, cho: 0.0, lip: 8.0, medida: 'colher de sopa', g: 30 },
  { nome: 'Bife de alcatra grelhado', grupo: 'Carnes', kcal: 241, ptn: 32.0, cho: 0.0, lip: 12.0, medida: 'bife médio', g: 100 },
  { nome: 'Filé de tilápia grelhado', grupo: 'Pescados', kcal: 128, ptn: 26.0, cho: 0.0, lip: 2.7, medida: 'filé', g: 100 },
  { nome: 'Salmão grelhado', grupo: 'Pescados', kcal: 211, ptn: 23.0, cho: 0.0, lip: 13.0, medida: 'posta', g: 100 },
  { nome: 'Atum em água (lata)', grupo: 'Pescados', kcal: 116, ptn: 26.0, cho: 0.0, lip: 1.0, medida: 'lata escorrida', g: 120 },
  { nome: 'Ovo de galinha cozido', grupo: 'Ovos', kcal: 146, ptn: 13.3, cho: 0.6, lip: 9.5, medida: 'unidade', g: 50 },
  { nome: 'Clara de ovo cozida', grupo: 'Ovos', kcal: 52, ptn: 11.0, cho: 0.7, lip: 0.0, medida: 'unidade', g: 33 },

  // Leguminosas
  { nome: 'Feijão carioca cozido', grupo: 'Leguminosas', kcal: 76, ptn: 4.8, cho: 13.6, lip: 0.5, medida: 'concha média', g: 90 },
  { nome: 'Feijão preto cozido', grupo: 'Leguminosas', kcal: 77, ptn: 4.5, cho: 14.0, lip: 0.5, medida: 'concha média', g: 90 },
  { nome: 'Lentilha cozida', grupo: 'Leguminosas', kcal: 93, ptn: 6.3, cho: 16.3, lip: 0.5, medida: 'colher de sopa', g: 30 },
  { nome: 'Grão-de-bico cozido', grupo: 'Leguminosas', kcal: 130, ptn: 8.4, cho: 18.0, lip: 2.6, medida: 'colher de sopa', g: 30 },
  { nome: 'Soja / proteína texturizada hidratada', grupo: 'Leguminosas', kcal: 105, ptn: 14.0, cho: 7.0, lip: 1.5, medida: 'colher de sopa', g: 30 },

  // Laticínios
  { nome: 'Leite desnatado', grupo: 'Laticínios', kcal: 35, ptn: 3.4, cho: 4.9, lip: 0.2, medida: 'copo (200 ml)', g: 200 },
  { nome: 'Leite integral', grupo: 'Laticínios', kcal: 61, ptn: 3.2, cho: 4.7, lip: 3.3, medida: 'copo (200 ml)', g: 200 },
  { nome: 'Iogurte natural integral', grupo: 'Laticínios', kcal: 61, ptn: 3.8, cho: 4.7, lip: 3.0, medida: 'pote (170 g)', g: 170 },
  { nome: 'Iogurte natural desnatado', grupo: 'Laticínios', kcal: 41, ptn: 4.1, cho: 5.5, lip: 0.2, medida: 'pote (170 g)', g: 170 },
  { nome: 'Queijo minas frescal', grupo: 'Laticínios', kcal: 264, ptn: 17.4, cho: 3.2, lip: 20.2, medida: 'fatia', g: 30 },
  { nome: 'Queijo mussarela', grupo: 'Laticínios', kcal: 280, ptn: 22.0, cho: 3.0, lip: 21.0, medida: 'fatia', g: 20 },
  { nome: 'Requeijão', grupo: 'Laticínios', kcal: 257, ptn: 9.6, cho: 3.0, lip: 23.0, medida: 'colher de sopa', g: 30 },

  // Frutas
  { nome: 'Banana prata', grupo: 'Frutas', kcal: 98, ptn: 1.3, cho: 26.0, lip: 0.1, medida: 'unidade', g: 70 },
  { nome: 'Maçã', grupo: 'Frutas', kcal: 56, ptn: 0.3, cho: 15.2, lip: 0.0, medida: 'unidade', g: 130 },
  { nome: 'Mamão papaia', grupo: 'Frutas', kcal: 40, ptn: 0.5, cho: 10.4, lip: 0.1, medida: 'fatia', g: 150 },
  { nome: 'Laranja', grupo: 'Frutas', kcal: 37, ptn: 1.0, cho: 8.9, lip: 0.1, medida: 'unidade', g: 130 },
  { nome: 'Morango', grupo: 'Frutas', kcal: 30, ptn: 0.9, cho: 6.8, lip: 0.3, medida: 'xícara', g: 150 },
  { nome: 'Abacate', grupo: 'Frutas', kcal: 96, ptn: 1.2, cho: 6.0, lip: 8.4, medida: 'colher de sopa', g: 30 },
  { nome: 'Uva', grupo: 'Frutas', kcal: 53, ptn: 0.7, cho: 13.6, lip: 0.2, medida: 'cacho pequeno', g: 100 },

  // Hortaliças
  { nome: 'Alface', grupo: 'Hortaliças', kcal: 11, ptn: 1.3, cho: 1.7, lip: 0.2, medida: 'prato', g: 50 },
  { nome: 'Tomate', grupo: 'Hortaliças', kcal: 15, ptn: 1.1, cho: 3.1, lip: 0.2, medida: 'unidade', g: 80 },
  { nome: 'Brócolis cozido', grupo: 'Hortaliças', kcal: 25, ptn: 2.1, cho: 4.4, lip: 0.5, medida: 'colher de sopa', g: 30 },
  { nome: 'Cenoura crua', grupo: 'Hortaliças', kcal: 34, ptn: 1.3, cho: 7.7, lip: 0.2, medida: 'unidade', g: 70 },
  { nome: 'Abobrinha cozida', grupo: 'Hortaliças', kcal: 19, ptn: 1.1, cho: 2.9, lip: 0.2, medida: 'colher de sopa', g: 30 },

  // Gorduras e oleaginosas
  { nome: 'Azeite de oliva', grupo: 'Gorduras', kcal: 884, ptn: 0.0, cho: 0.0, lip: 100.0, medida: 'colher de sopa', g: 8 },
  { nome: 'Castanha de caju', grupo: 'Oleaginosas', kcal: 570, ptn: 18.5, cho: 29.1, lip: 46.3, medida: 'unidade', g: 5 },
  { nome: 'Castanha-do-pará', grupo: 'Oleaginosas', kcal: 643, ptn: 14.5, cho: 15.1, lip: 63.5, medida: 'unidade', g: 5 },
  { nome: 'Pasta de amendoim', grupo: 'Oleaginosas', kcal: 600, ptn: 25.0, cho: 20.0, lip: 50.0, medida: 'colher de sopa', g: 20 },
  { nome: 'Chia', grupo: 'Sementes', kcal: 486, ptn: 16.5, cho: 42.0, lip: 30.7, medida: 'colher de sopa', g: 12 },

  // Outros
  { nome: 'Whey protein (pó)', grupo: 'Suplementos', kcal: 400, ptn: 80.0, cho: 8.0, lip: 6.0, medida: 'scoop', g: 30 },
  { nome: 'Mel', grupo: 'Açúcares', kcal: 309, ptn: 0.0, cho: 84.0, lip: 0.0, medida: 'colher de sopa', g: 20 },
];

/* ----------------------------------------------------------------------------
   REFERÊNCIAS RÁPIDAS (resumo do seu material — sinais de carência e ativos)
---------------------------------------------------------------------------- */
const REFERENCIAS = {
  carencias: [
    ['Cabelo', 'Alopecia, quebradiço, despigmentado, ressecado', 'Proteína, Vit. A, Zn, Biotina (B7), Vit. E'],
    ['Olhos', 'Palidez conjuntival, cegueira noturna, xerose', 'Ferro, Vit. A, Zn'],
    ['Lábios', 'Estomatite angular, queilite', 'B2, B3, B6'],
    ['Língua', 'Glossite, língua magenta, hipogeusia', 'B2, B6, B9, B12, Zn'],
    ['Gengivas', 'Esponjosas, sangramento', 'Vit. C'],
    ['Pele', 'Dermatite seborreica, xerose, petéquias, má cicatrização', 'B2, B6, Zn, Vit. A, C, K, Niacina'],
    ['Unhas', 'Coiloníquia, quebradiças', 'Ferro'],
    ['Músculo', 'Atrofia, flacidez de panturrilha', 'Vit. D, B1, Cálcio, Proteína'],
    ['Sist. nervoso', 'Alterações psicomotoras, formigamento, demência', 'B1, B6, B12'],
  ],
  ativosEsteticos: [
    ['Pycnogenol', 'Pinus pinaster', 'Fortalece capilares, protege colágeno e elastina, antioxidante'],
    ['Astaxantina', 'Microalga', 'Antioxidante potente, anti-inflamatório, fotoproteção'],
    ['Quercetina', 'Vegetais', 'Antioxidante, anti-inflamatório — usual 400 mg/dia'],
    ['Coenzima Q10', 'Endógena', 'Antioxidante, saúde mitocondrial, pele'],
    ['Luteína / Zeaxantina', 'Flores', 'Antioxidante, saúde da pele e dos olhos'],
    ['Rutina', 'Vegetais', 'Fortalece capilares, varizes — ~100 mg/dia'],
  ],
};
