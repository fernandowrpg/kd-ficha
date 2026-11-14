# Login com Firebase no GitHub Pages

Como adicionar login (Google) e sincronizar fichas na nuvem neste app, que é estático e roda no GitHub Pages, sem expor nada que comprometa a segurança.

> Pesquisa feita em novembro de 2026. SDK web atual: **Firebase JS SDK 13.3.0** (`npm view firebase version`).

## Resposta curta: dá, e é seguro

Dá sim. O ponto que costuma assustar é a `firebaseConfig` (com a `apiKey`) ficar pública no repositório. **Isso é esperado e não é uma falha.** Segundo a documentação do Firebase, a chave de API do Firebase só *identifica* o projeto. Quem decide o que cada usuário pode fazer são:

| Camada | O que protege |
|---|---|
| **Domínios autorizados** (Authentication) | Só `seu-usuario.github.io` e `localhost` podem abrir o fluxo de login. |
| **Regras de segurança** do Firestore | Cada usuário só lê e grava as próprias fichas. **É a proteção principal.** |
| **App Check** (reCAPTCHA Enterprise) | Bloqueia chamadas que não venham do seu site (scripts, bots, cópias do app). |
| **Restrição da chave de API** (Google Cloud) | A chave só funciona a partir dos seus domínios e só para as APIs do Firebase. |
| **Cotas** do Identity Toolkit | Limita o estrago se alguém abusar do cadastro ou do login. |

O que **nunca** pode ir para o repositório: chave de conta de serviço (`serviceAccount.json`), Admin SDK, chave da API do Gemini ou de qualquer outro serviço pago. O app deve continuar funcionando **sem login**. A nuvem é só um extra para backup e para usar a ficha em mais de um aparelho.

## A pegadinha do GitHub Pages: use popup, não redirect

O `signInWithRedirect()` depende de o `authDomain` estar no mesmo domínio do app. Desde 2024, o Chrome (M115+), o Firefox (109+) e o Safari (16.1+) bloqueiam o armazenamento de terceiros que ele usaria. As soluções que o Firebase lista são:

1. `authDomain` no domínio próprio via Firebase Hosting: **não serve**, o app está no GitHub Pages.
2. **`signInWithPopup()`**: **é esta.** Funciona em qualquer hospedagem.
3. Proxy reverso em `/__/auth/`: **não serve**, o GitHub Pages não permite.
4. Hospedar os arquivos do handler de login no próprio site: possível, mas exige ressincronizar os arquivos (houve correções importantes no 3º trimestre de 2026) e não funciona com Apple. **Não vale a pena aqui.**
5. Login pelo SDK do próprio provedor + `signInWithCredential()`: complexo demais.

Então use **`signInWithPopup`** com o `authDomain` padrão (`<projeto>.firebaseapp.com`). Em celular o popup abre como uma nova aba e volta sozinho. Funciona bem no Android/Chrome e no Safari do iOS, desde que a chamada parta de um toque do usuário (não de um `setTimeout` nem de um `await` longo antes).

> Se um dia o app migrar para o Firebase Hosting (ou para um domínio próprio servido por ele), dá para trocar para redirect com a opção 1.

---

## Passo a passo

### 1. Console do Firebase

1. Em <https://console.firebase.google.com>, crie o projeto (o Analytics pode ficar desligado).
2. **Adicionar app → Web**. Copie o objeto `firebaseConfig`. **Não** marque "Firebase Hosting".
3. **Authentication → Método de login → Google → Ativar.** Escolha o e-mail de suporte.
4. **Authentication → Configurações → Domínios autorizados**: adicione `fernandowrpg.github.io`, mantenha `localhost` e **remova** qualquer outro domínio que não use.
5. **Firestore Database → Criar banco** em **modo de produção** (tudo bloqueado), região `southamerica-east1` (São Paulo).
6. Publique as regras do passo 3.

### 2. Estrutura dos dados

```
users/{uid}/fichas/{fichaId}
  ficha:      { ...objeto da ficha, igual ao exportado em .json }
  updatedAt:  timestamp do servidor
  v:          1
```

Uma ficha por documento. O limite é 1 MiB por documento, e uma ficha tem poucos KB.

### 3. Regras de segurança do Firestore

Esta é a parte que realmente protege os dados. Cole em **Firestore → Regras**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Cada usuário só enxerga a própria pasta.
    match /users/{uid}/fichas/{fichaId} {
      allow read, delete: if isOwner(uid);
      allow create, update: if isOwner(uid) && validFicha();
    }

    // Todo o resto é negado.
    match /{document=**} {
      allow read, write: if false;
    }

    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    function validFicha() {
      let d = request.resource.data;
      return d.keys().hasOnly(['ficha', 'updatedAt', 'v'])
        && d.ficha is map
        && d.ficha.nome is string && d.ficha.nome.size() <= 200
        && d.updatedAt == request.time      // obriga serverTimestamp()
        && d.v == 1;
    }
  }
}
```

Teste antes de publicar, no **Rules Playground** do console:

- Leitura de `users/OUTRO_UID/fichas/x` logado como você: **negada**.
- Gravação sem estar logado: **negada**.

### 4. Código: módulo carregado só quando a pessoa quiser entrar

O app é um script clássico (IIFE). O Firebase usa módulos ES, então o melhor é um arquivo separado `js/nuvem.js` carregado com `import()` no clique em "Entrar". Quem nunca usar login não baixa nada do Firebase, e o app continua 100% offline.

`js/nuvem.js`:

```js
// Login e sincronização opcionais. Carregado sob demanda pelo app.js.
const V = '13.3.0';
const base = `https://www.gstatic.com/firebasejs/${V}`;
const [{ initializeApp }, auth, fs, ac] = await Promise.all([
  import(`${base}/firebase-app.js`),
  import(`${base}/firebase-auth.js`),
  import(`${base}/firebase-firestore.js`),
  import(`${base}/firebase-app-check.js`),
]);

// Público por natureza: identifica o projeto, não dá acesso a nada sozinho.
const app = initializeApp({
  apiKey: '...',
  authDomain: 'SEU-PROJETO.firebaseapp.com',
  projectId: 'SEU-PROJETO',
  appId: '...',
});

// App Check antes de qualquer outro serviço (passo 5).
if (location.hostname === 'localhost') self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
ac.initializeAppCheck(app, {
  provider: new ac.ReCaptchaEnterpriseProvider('CHAVE_RECAPTCHA_ENTERPRISE'),
  isTokenAutoRefreshEnabled: true,
});

const a = auth.getAuth(app);
a.languageCode = 'pt';
await auth.setPersistence(a, auth.browserLocalPersistence);
const db = fs.initializeFirestore(app, {
  localCache: fs.persistentLocalCache(), // funciona offline e sincroniza depois
});

const col = (uid) => fs.collection(db, 'users', uid, 'fichas');

export const onUser = (cb) => auth.onAuthStateChanged(a, cb);

// Precisa ser chamado direto do clique (senão o navegador bloqueia o popup).
export function entrar() {
  return auth.signInWithPopup(a, new auth.GoogleAuthProvider());
}
export const sair = () => auth.signOut(a);

export async function enviar(ficha) {
  const u = a.currentUser;
  if (!u) throw new Error('sem login');
  await fs.setDoc(fs.doc(col(u.uid), ficha.id), {
    ficha, v: 1, updatedAt: fs.serverTimestamp(),
  });
}

export async function baixarTodas() {
  const u = a.currentUser;
  if (!u) return [];
  const snap = await fs.getDocs(col(u.uid));
  return snap.docs.map((d) => ({ ficha: d.data().ficha, updatedAt: d.data().updatedAt?.toMillis() || 0 }));
}

export const apagar = (id) => fs.deleteDoc(fs.doc(col(a.currentUser.uid), id));
```

No `app.js` (dentro da IIFE):

```js
let nuvem = null;
const getNuvem = () => (nuvem ||= import('./nuvem.js'));

// No menu: <button class="menu-item" data-act="login">Entrar com Google</button>
case 'login': {
  // Dica: chame getNuvem() já ao abrir o menu, para o módulo estar pronto
  // e o popup sair "colado" ao toque.
  getNuvem().then((n) => n.entrar())
    .then(() => toast('Conectado. Suas fichas serão salvas na nuvem.'))
    .catch((e) => toast(e.code === 'auth/popup-blocked'
      ? 'O navegador bloqueou a janela de login. Toque de novo.'
      : 'Não foi possível entrar.'));
  break;
}
```

E no `save()`, depois do `localStorage`, envie a ficha atual com *debounce* (por exemplo, 3 s) se houver usuário logado. Na entrada, faça `baixarTodas()` e mescle: para cada `id`, fica a versão com `updatedAt` mais recente. Guarde um `updatedAt` local na ficha para comparar.

### 5. App Check (recomendado)

1. No Google Cloud console, em **Security → reCAPTCHA** (Fraud Defense), crie uma chave do tipo **Web**, **baseada em pontuação**, sem desafio de checkbox, com o domínio `fernandowrpg.github.io`. **Não** inclua `localhost` na chave de produção.
2. No console do Firebase, em **App Check → Apps**, registre o app web com **reCAPTCHA Enterprise** e essa chave.
3. Em localhost use o **token de depuração**: o `FIREBASE_APPCHECK_DEBUG_TOKEN = true` do código imprime um token no console do navegador. Cadastre esse token em **App Check → Apps → Gerenciar tokens de depuração**.
4. Acompanhe as métricas por alguns dias e só então clique em **Aplicar** (enforce) para **Firestore** e **Authentication**.

### 6. Restringir a chave de API

No [Google Cloud console → APIs e serviços → Credenciais](https://console.cloud.google.com/apis/credentials), abra a "Browser key (auto created by Firebase)":

- **Restrições de aplicativo → Referenciadores HTTP**: `https://fernandowrpg.github.io/*` e `http://localhost:*/*`.
- **Restrições de API**: deixe só as que o Firebase marcou (Identity Toolkit, Token Service, Firestore, Firebase App Check, Firebase Installations). Não adicione outras.
- Em **Cotas**, reduza as do `identitytoolkit.googleapis.com` para algo compatível com um grupo de RPG.

### 7. Ajustes no app

- **Service worker**: o `sw.js` atual só trata requisições do próprio domínio e do Google Fonts, então as chamadas para `googleapis.com`/`gstatic.com/firebasejs` passam direto. **Não** coloque os scripts do Firebase no `ASSETS` (o login precisa de rede de qualquer jeito). Lembre de colocar `js/nuvem.js` no `ASSETS` e subir o `CACHE`.
- **Sem login, tudo igual**: `localStorage` continua sendo a fonte principal. A nuvem é cópia.
- **Excluir conta**: ofereça "Apagar meus dados da nuvem" (apaga a coleção e chama `deleteUser`). É boa prática e exigência da LGPD.
- **Não confie no cliente**: qualquer regra de negócio que importe (limite de fichas, campos válidos) tem de estar nas *Security Rules*, não no JS.

## Checklist de segurança

- [ ] Firestore criado em modo produção, com as regras acima publicadas e testadas no Playground
- [ ] Domínios autorizados: apenas `fernandowrpg.github.io` e `localhost`
- [ ] Login por `signInWithPopup` (não redirect)
- [ ] Chave de API restrita por referenciador e por API
- [ ] App Check registrado, monitorado e depois aplicado em Firestore e Auth
- [ ] Nenhuma credencial de servidor ou chave de outro serviço no repositório
- [ ] Alertas de orçamento no Google Cloud (plano Spark gratuito basta para esse uso)

## Fontes

- [Best practices for using signInWithRedirect on browsers that block third-party storage](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [Learn about using and managing API keys for Firebase](https://firebase.google.com/docs/projects/api-keys)
- [App Check com reCAPTCHA Enterprise (web)](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [Alternative ways to add Firebase to your JavaScript project (CDN)](https://firebase.google.com/docs/web/alt-setup)
- [Firebase JS SDK release notes](https://firebase.google.com/support/release-notes/js)
