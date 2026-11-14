// Login com Google e cópia das fichas no Firestore (opcional).
// Carregado sob demanda pelo app.js com import(); quem não entra não baixa nada do Firebase.
// A configuração abaixo é pública por natureza: quem protege os dados são as regras do
// Firestore (cada usuário só acessa users/{uid}/fichas) e os domínios autorizados.
const V = '13.3.0';
const base = `https://www.gstatic.com/firebasejs/${V}`;
const [{ initializeApp }, auth, fs, ac] = await Promise.all([
  import(`${base}/firebase-app.js`),
  import(`${base}/firebase-auth.js`),
  import(`${base}/firebase-firestore.js`),
  import(`${base}/firebase-app-check.js`),
]);

const app = initializeApp({
  apiKey: 'AIzaSyBKarV3Hz3t8ee2aZ3hLtH7w4P4uZeCpAE',
  authDomain: 'kd-ficha.firebaseapp.com',
  projectId: 'kd-ficha',
  storageBucket: 'kd-ficha.firebasestorage.app',
  messagingSenderId: '572775102420',
  appId: '1:572775102420:web:46990930636d9a92854841',
});

// App Check: prova para o Firebase que a requisição vem deste site (reCAPTCHA Enterprise,
// sem desafio). A chave do site é pública. Em localhost o reCAPTCHA não vale, então usa o
// token de depuração: o console do navegador mostra um token para cadastrar em
// Firebase > App Check > Apps > Gerenciar tokens de depuração.
if (['localhost', '127.0.0.1'].includes(location.hostname)) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
ac.initializeAppCheck(app, {
  provider: new ac.ReCaptchaEnterpriseProvider('6LcKJCAuAAAAAAnIjV-5HzBFHFHlKxSpDzZXPWW6'),
  isTokenAutoRefreshEnabled: true,
});

const a = auth.getAuth(app);
a.languageCode = 'pt';
const db = fs.getFirestore(app);
const col = (uid) => fs.collection(db, 'users', uid, 'fichas');
const uid = () => {
  if (!a.currentUser) throw new Error('sem login');
  return a.currentUser.uid;
};

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

// O Firestore não aceita undefined; a ida e volta por JSON garante dados limpos.
export function enviar(ficha) {
  return fs.setDoc(fs.doc(col(uid()), ficha.id), {
    ficha: JSON.parse(JSON.stringify(ficha)), v: 1, updatedAt: fs.serverTimestamp(),
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
