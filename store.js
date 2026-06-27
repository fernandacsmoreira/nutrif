/* ============================================================================
   store.js — Armazenamento na nuvem (Firebase) com fallback local
   - Se o firebase-config.js estiver preenchido, usa Firestore + login.
   - Caso contrário, salva no próprio navegador (localStorage) para você
     testar o site imediatamente. Os dados ficam no aparelho até configurar
     o Firebase.
   ============================================================================ */

const Store = (() => {
  let mode = 'local';            // 'cloud' | 'local'
  let db = null, auth = null, uid = null;
  let authCb = null;

  function configurado() {
    const c = window.FIREBASE_CONFIG;
    return c && c.apiKey && !String(c.apiKey).includes('COLE_') && c.projectId;
  }

  function uuid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  /* -------- inicialização ------------------------------------------------- */
  function init(onAuthChange) {
    authCb = onAuthChange;
    if (configurado() && window.firebase) {
      try {
        firebase.initializeApp(window.FIREBASE_CONFIG);
        db = firebase.firestore();
        auth = firebase.auth();
        mode = 'cloud';
        // persistência offline (continua funcionando sem internet)
        db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
        auth.onAuthStateChanged(u => {
          uid = u ? u.uid : null;
          if (authCb) authCb(u ? { email: u.email, uid: u.uid } : null);
        });
        return 'cloud';
      } catch (err) {
        console.error('Falha ao iniciar Firebase, usando modo local:', err);
        mode = 'local';
      }
    }
    // modo local: "usuário" fictício sempre logado
    setTimeout(() => { if (authCb) authCb({ email: 'local', uid: 'local', local: true }); }, 0);
    return 'local';
  }

  const getMode = () => mode;

  /* -------- autenticação -------------------------------------------------- */
  async function login(email, senha) {
    if (mode !== 'cloud') return { ok: true };
    await auth.signInWithEmailAndPassword(email, senha);
    return { ok: true };
  }
  async function signup(email, senha) {
    if (mode !== 'cloud') return { ok: true };
    await auth.createUserWithEmailAndPassword(email, senha);
    return { ok: true };
  }
  async function recuperar(email) {
    if (mode !== 'cloud') return { ok: true };
    await auth.sendPasswordResetEmail(email);
    return { ok: true };
  }
  async function logout() {
    if (mode === 'cloud') await auth.signOut();
  }

  /* -------- helpers locais ------------------------------------------------ */
  const lkey = col => `nutri:${col}`;
  function lread(col) {
    try { return JSON.parse(localStorage.getItem(lkey(col)) || '[]'); }
    catch { return []; }
  }
  function lwrite(col, arr) { localStorage.setItem(lkey(col), JSON.stringify(arr)); }

  function colRef(col) {
    return db.collection('nutricionistas').doc(uid).collection(col);
  }

  /* -------- CRUD genérico ------------------------------------------------- */
  async function list(col) {
    if (mode === 'cloud') {
      const snap = await colRef(col).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return lread(col);
  }

  async function get(col, id) {
    if (mode === 'cloud') {
      const d = await colRef(col).doc(id).get();
      return d.exists ? { id: d.id, ...d.data() } : null;
    }
    return lread(col).find(x => x.id === id) || null;
  }

  /* upsert — cria (se não tiver id) ou atualiza */
  async function save(col, obj) {
    const agora = new Date().toISOString();
    if (!obj.id) { obj.id = uuid(); obj.createdAt = agora; }
    obj.updatedAt = agora;
    if (mode === 'cloud') {
      const { id, ...data } = obj;
      await colRef(col).doc(id).set(data, { merge: true });
    } else {
      const arr = lread(col);
      const i = arr.findIndex(x => x.id === obj.id);
      if (i >= 0) arr[i] = { ...arr[i], ...obj }; else arr.push(obj);
      lwrite(col, arr);
    }
    return obj;
  }

  async function remove(col, id) {
    if (mode === 'cloud') await colRef(col).doc(id).delete();
    else lwrite(col, lread(col).filter(x => x.id !== id));
  }

  return { init, getMode, login, signup, recuperar, logout, list, get, save, remove, uuid };
})();
