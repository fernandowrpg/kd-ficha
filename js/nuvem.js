// Login com Google, cópia das fichas no Firestore e mesas do modo narrador (opcional).
// Carregado sob demanda pelo app.js com import(); quem não entra não baixa nada do Firebase.
// Quem protege os dados são as regras do Firestore (ver docs/login-firebase.md).
import { app, db, fs, base } from './fb.js';

const auth = await import(`${base}/firebase-auth.js`);

const a = auth.getAuth(app);
a.languageCode = 'pt';
const col = (uid) => fs.collection(db, 'users', uid, 'fichas');
const uid = () => {
  if (!a.currentUser) throw new Error('sem login');
  return a.currentUser.uid;
};
const nomeUsuario = () => (a.currentUser && (a.currentUser.displayName || a.currentUser.email)) || 'Jogador';
// O Firestore não aceita undefined; a ida e volta por JSON garante dados limpos.
const limpo = (o) => JSON.parse(JSON.stringify(o));

// Resolve quando o Firebase termina de restaurar a sessão salva.
export const ready = a.authStateReady();
export const user = () => a.currentUser;
export const onUser = (cb) => auth.onAuthStateChanged(a, cb);

// No GitHub Pages o login por redirect não funciona nos navegadores atuais: usa popup.
export function entrar() {
  const p = new auth.GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return auth.signInWithPopup(a, p);
}
export const sair = () => auth.signOut(a);

export function enviar(ficha) {
  return fs.setDoc(fs.doc(col(uid()), ficha.id), {
    ficha: limpo(ficha), v: 1, updatedAt: fs.serverTimestamp(),
  });
}
export async function baixarTodas() {
  const snap = await fs.getDocs(col(uid()));
  return snap.docs.map((d) => d.data().ficha).filter((f) => f && f.id);
}
export const apagar = (id) => fs.deleteDoc(fs.doc(col(uid()), id));

// Preferências do usuário (por enquanto só o tema) em users/{uid}.
export async function lerPrefs() {
  const snap = await fs.getDoc(fs.doc(db, 'users', uid()));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { tema: d.tema, t: d.updatedAt ? d.updatedAt.toMillis() : 0 };
}
export const salvarPrefs = (tema) => fs.setDoc(fs.doc(db, 'users', uid()), { tema, updatedAt: fs.serverTimestamp() });

// ---------- Mesas (modo narrador) ----------
// salas/{salaId}                 nome, mestre (uid), mestreNome, aberta, criadaEm
// salas/{salaId}/membros/{uid}   status ('pendente' | 'aceito'), nome, fichaId, ficha (completa)
// salas/{salaId}/painel/{uid}    resumo público do protagonista aceito (lido pelo overlay do OBS)
const salaRef = (id) => fs.doc(db, 'salas', id);
const membroRef = (id, u) => fs.doc(db, 'salas', id, 'membros', u);
const painelRef = (id, u) => fs.doc(db, 'salas', id, 'painel', u);
const comId = (d) => ({ id: d.id, ...d.data() });

export const meuUid = () => uid();

export async function criarSala(nome) {
  const ref = fs.doc(fs.collection(db, 'salas'));
  await fs.setDoc(ref, {
    nome: String(nome).slice(0, 80), mestre: uid(), mestreNome: nomeUsuario().slice(0, 100),
    aberta: true, criadaEm: fs.serverTimestamp(), v: 1,
  });
  return ref.id;
}
export async function minhasSalas() {
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'salas'), fs.where('mestre', '==', uid())));
  return snap.docs.map(comId);
}
export async function lerSala(id) {
  const snap = await fs.getDoc(salaRef(id));
  return snap.exists() ? comId(snap) : null;
}
export const atualizarSala = (id, dados) => fs.updateDoc(salaRef(id), dados);
export function ouvirSala(id, cb, erro) {
  return fs.onSnapshot(salaRef(id), (s) => cb(s.exists() ? comId(s) : null), erro);
}
export function ouvirMembros(id, cb, erro) {
  return fs.onSnapshot(fs.collection(db, 'salas', id, 'membros'), (s) => cb(s.docs.map(comId)), erro);
}
// Apaga a mesa com tudo o que está dentro (o Firestore não apaga subcoleções sozinho).
export async function apagarSala(id) {
  const [m, p] = await Promise.all([
    fs.getDocs(fs.collection(db, 'salas', id, 'membros')),
    fs.getDocs(fs.collection(db, 'salas', id, 'painel')),
  ]);
  const b = fs.writeBatch(db);
  m.docs.forEach((d) => b.delete(d.ref));
  p.docs.forEach((d) => b.delete(d.ref));
  b.delete(salaRef(id));
  await b.commit();
}
export const definirStatus = (id, u, status) => fs.updateDoc(membroRef(id, u), { status });
export async function removerMembro(id, u) {
  const b = fs.writeBatch(db);
  b.delete(painelRef(id, u));
  b.delete(membroRef(id, u));
  await b.commit();
}
// O narrador grava o resumo na hora em que aceita (o jogador atualiza depois).
export const escreverPainel = (id, u, resumo) => fs.setDoc(painelRef(id, u), { ...limpo(resumo), updatedAt: fs.serverTimestamp(), v: 1 });

// Lado do jogador.
export async function pedirEntrada(id, ficha) {
  const ref = membroRef(id, uid());
  const atual = await fs.getDoc(ref);
  const dados = { nome: nomeUsuario().slice(0, 100), fichaId: ficha.id, ficha: limpo(ficha), updatedAt: fs.serverTimestamp(), v: 1 };
  if (atual.exists()) { await fs.updateDoc(ref, dados); return atual.data().status; }
  await fs.setDoc(ref, { ...dados, status: 'pendente' });
  return 'pendente';
}
// cb(null) quando o documento some (removido pelo narrador ou mesa apagada).
export function ouvirMeuMembro(id, cb, erro) {
  return fs.onSnapshot(membroRef(id, uid()), (s) => {
    if (!s.exists() && s.metadata.fromCache) return; // ainda sem resposta do servidor
    cb(s.exists() ? s.data() : null);
  }, erro);
}
export async function enviarFichaSala(id, ficha, resumo) {
  await fs.updateDoc(membroRef(id, uid()), { fichaId: ficha.id, ficha: limpo(ficha), updatedAt: fs.serverTimestamp() });
  if (resumo) await escreverPainel(id, uid(), resumo);
}
export async function sairSala(id) {
  const u = uid();
  await fs.deleteDoc(painelRef(id, u)).catch(() => {});
  await fs.deleteDoc(membroRef(id, u));
}
