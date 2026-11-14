// Inicialização comum do Firebase (App, App Check e Firestore), usada pelo app (nuvem.js)
// e pelo overlay do OBS (painel.js). Módulo ES carregado sob demanda.
// A configuração abaixo é pública por natureza: quem protege os dados são as regras do
// Firestore e as restrições da chave de API (ver docs/login-firebase.md).
export const V = '13.3.0';
export const base = `https://www.gstatic.com/firebasejs/${V}`;
const [{ initializeApp }, fs, ac] = await Promise.all([
  import(`${base}/firebase-app.js`),
  import(`${base}/firebase-firestore.js`),
  import(`${base}/firebase-app-check.js`),
]);

export const app = initializeApp({
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

export const db = fs.getFirestore(app);
export { fs };
