# Consultório · Nutrição

Sistema web para nutricionista autônoma com atendimento 100% remoto. Funciona como um site estático (sem instalação, sem servidor) e pode ser publicado gratuitamente no **GitHub Pages**. Os dados são salvos automaticamente na nuvem com o **Firebase** (plano gratuito) e, enquanto o Firebase não estiver configurado, ficam salvos no próprio navegador para você já testar tudo.

## O que ele faz

- **5 tipos de atendimento**: 1ª consulta padrão, 2ª consulta (retorno), 3ª consulta (acompanhamento), 1ª consulta para idosos e nutrição estética. Cada um com sua anamnese.
- **Salvamento automático** de tudo que você digita (não existe botão "salvar": é contínuo).
- **Cálculo dietético** com as fórmulas do seu material: TMB (FAO/OMS ou Harris & Benedict), GET pelo método VENTA ou pelo fator de atividade, IMC, % de gordura por dobras, cintura, RCQ e **meta calórica** para o objetivo. Você escolhe o tipo de cálculo para cada paciente.
- **Relatório da consulta em PDF** (botão "Gerar relatório da consulta") com a anamnese preenchida e os resultados — para você extrair e usar na criação da dieta.
- **Montador de dieta**: puxa a meta do cálculo, sugere refeições editáveis e calcula os alimentos por **grama e medida caseira**. Exporta o plano em PDF para entregar ao paciente.
- **Pacientes**, **referências clínicas** (carências e ativos estéticos) e **configurações** do seu perfil (vai no cabeçalho dos PDFs).

## Como usar agora mesmo (modo local)

Abra o `index.html` no navegador (ou publique no GitHub Pages). Sem configurar nada, o sistema já funciona salvando no seu navegador. Ideal para testar. **Atenção:** nesse modo os dados ficam só naquele aparelho/navegador. Para guardar na nuvem e acessar de qualquer lugar, configure o Firebase abaixo.

---

## Passo 1 — Criar o projeto no Firebase (grátis)

1. Acesse <https://console.firebase.google.com> e clique em **Adicionar projeto**. Dê um nome (ex.: `consultorio-nutri`) e conclua (pode desativar o Google Analytics).
2. No menu lateral, vá em **Criar > Firestore Database** → **Criar banco de dados** → comece em **modo de produção** → escolha a localização (ex.: `southamerica-east1`).
3. Vá em **Criar > Authentication** → **Começar** → aba **Sign-in method** → ative **E-mail/senha**.
4. Ainda no Authentication, aba **Users** → **Adicionar usuário**: crie o seu login (e-mail e senha) que você usará para entrar no site.

## Passo 2 — Pegar a configuração

1. No Firebase, clique na engrenagem ⚙ (canto superior) → **Configurações do projeto**.
2. Em **Seus aplicativos**, clique no ícone **</>** (Web) para registrar um app web. Dê um apelido e clique em registrar.
3. O Firebase mostrará um bloco `const firebaseConfig = { ... }`. Copie os valores.
4. Abra o arquivo **`js/firebase-config.js`** deste projeto e cole os valores no lugar dos `COLE_AQUI...`:

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000:web:abc123",
};
```

Pronto: ao recarregar o site, ele passa a usar a nuvem e a pedir login com o e-mail/senha que você criou.

## Passo 3 — Regras de segurança do Firestore

Para que **cada conta só enxergue os próprios dados**, copie o conteúdo do arquivo `firestore.rules` deste projeto e cole em **Firestore Database > Regras**, depois clique em **Publicar**. As regras garantem que um usuário autenticado só leia e grave dentro de `nutricionistas/{seu-id}`.

---

## Passo 4 — Publicar no GitHub Pages

1. Crie um repositório no GitHub e suba todos os arquivos desta pasta (mantendo a estrutura `css/`, `js/`, `index.html`).
2. No repositório, vá em **Settings > Pages**.
3. Em **Source**, escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/ (root)`. Salve.
4. Em alguns instantes o site fica disponível em `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

> Importante: o `firebase-config.js` contém chaves públicas do Firebase (é normal elas ficarem visíveis no front-end). A segurança real vem das **regras do Firestore** + **login por e-mail/senha**. Por isso o Passo 3 é essencial.

## Estrutura dos arquivos

```
index.html              página principal
css/styles.css          identidade visual (off-white, bege, marrom · Fraunces + Jost)
js/firebase-config.js   onde você cola a configuração do Firebase
js/data.js              anamneses, tabelas de cálculo e base de alimentos (edite à vontade)
js/calc.js              motor de cálculo (fórmulas do material)
js/store.js             salvamento (nuvem ou local)
js/app.js               a aplicação (telas, navegação, PDFs)
firestore.rules         regras de segurança para colar no Firebase
```

## Personalizar

- **Perguntas das anamneses, alimentos e tabelas**: tudo está em `js/data.js`, em formato simples de editar.
- **Seu nome, CRN e contatos** (cabeçalho dos PDFs): preencha na tela **Configurações** dentro do site.

## Observações

- Os valores de alimentos e da tabela de dobras são aproximados (base TACO/IBGE e Durnin & Wormersley); confira e ajuste conforme sua prática.
- O sistema não substitui o julgamento clínico: ele organiza, calcula e gera documentos a partir do que você informa.
