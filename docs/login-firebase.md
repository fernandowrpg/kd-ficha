# Login com Firebase no GitHub Pages

Como o app faz login com Google e guarda as fichas na nuvem sendo um site estático no GitHub Pages, o que já está configurado no projeto Firebase `kd-ficha` e o que falta fazer.

> Atualizado em novembro de 2026. SDK web em uso: **Firebase JS SDK 13.3.0**, carregado do CDN `gstatic.com`.

## Situação atual

| Item | Situação |
|---|---|
| Projeto Firebase `kd-ficha` (plano Spark, gratuito; Analytics e Gemini desligados) | ✅ Criado |
| App web "KD Ficha Web" registrado (sem Firebase Hosting) | ✅ |
| Login com Google (nome público "Karyu Densetsu Ficha") | ✅ Ativo |
| Domínios autorizados do Authentication | ✅ `fernandowrpg.github.io` + padrões |
| Firestore (Standard, `southamerica-east1`, modo produção) | ✅ Criado |
| Regras de segurança do Firestore | ✅ Publicadas |
| Chave de API restrita por site | ✅ |
| App Check com reCAPTCHA Enterprise | ✅ Registrado e no código |
| **Bloqueio do App Check em Firestore e Authentication** | ⏳ **Falta:** ligar depois de conferir as métricas |
| Teste das regras no Rules Playground | ⏳ Não feito (o app funcionando no site cobre o caso normal) |

Testado no site publicado: login, sincronização e envio da ficha ao terminar a edição funcionam com a chave restrita e o App Check ativo.

## Por que é seguro deixar a config no código

A `firebaseConfig` (com a `apiKey`) está em [`js/nuvem.js`](../js/nuvem.js), visível para qualquer um. **Isso é esperado.** A chave de API do Firebase só *identifica* o projeto; quem decide o acesso são as camadas abaixo:

| Camada | O que protege |
|---|---|
| **Regras do Firestore** | Cada usuário só lê e grava `users/{seu uid}/fichas`. Tudo o mais é negado. **É a proteção principal.** |
| **Domínios autorizados** | Só o GitHub Pages (e os domínios do próprio Firebase) podem abrir o login. |
| **Restrição da chave de API** | A chave só aceita chamadas vindas do GitHub Pages e da página de login do Firebase. |
| **App Check** | Prova, com reCAPTCHA, que a chamada vem do site de verdade e não de um script ou de uma cópia do app. |

O que **nunca** pode ir para o repositório: chave de conta de serviço (`serviceAccount.json`), Admin SDK e chaves de outros serviços pagos.

## Por que o login é por popup

O `signInWithRedirect()` precisa que o `authDomain` esteja no mesmo domínio do app. Desde 2024 Chrome, Firefox e Safari bloqueiam o armazenamento de terceiros de que ele dependeria. Como o app está em `github.io` e o `authDomain` é `kd-ficha.firebaseapp.com`, o app usa **`signInWithPopup()`**. No celular o popup abre como uma aba nova e volta sozinho.

O popup precisa abrir colado ao toque do usuário. Por isso o app já baixa o Firebase quando o menu é aberto, antes de a pessoa tocar em "Entrar com Google".

---

## Como o app usa o Firebase

### Arquivos

- [`js/nuvem.js`](../js/nuvem.js) é o módulo ES que carrega o SDK do CDN, inicializa o App Check, o Auth e o Firestore, e exporta `entrar`, `sair`, `enviar`, `baixarTodas` e `apagar`.
- [`js/app.js`](../js/app.js) carrega o `nuvem.js` com `import()` **só quando precisa**: no clique em "Entrar com Google", ao abrir o menu, ou na abertura do app se a pessoa já tinha entrado naquele aparelho (marca `kd-nuvem` no `localStorage`). Quem nunca entra não baixa nada do Firebase.
- [`sw.js`](../sw.js) guarda o `js/nuvem.js` no cache offline. Os scripts do Firebase (gstatic) e as chamadas aos servidores do Google não passam pelo cache: o login precisa de internet de qualquer jeito.

### Dados

```
users/{uid}
  tema:       "light" | "dark"   (tema escolhido no botão do canto superior direito)
  updatedAt:  timestamp do servidor

users/{uid}/fichas/{fichaId}
  ficha:      { ...a ficha inteira, igual ao .json exportado, com "upd" }
  updatedAt:  timestamp do servidor
  v:          1
```

### Sincronização

- **O aparelho é a cópia principal.** O `localStorage` continua valendo; a nuvem é backup e serve para usar a mesma ficha em outro aparelho.
- **Cada ficha tem um campo `upd`** com a data da última alteração. Ele só muda quando o conteúdo muda de verdade: abrir uma ficha ou trocar de modo não conta.
- **Ao entrar**, o app baixa as fichas da nuvem. Para cada ficha vale a versão com o `upd` mais recente, e as que só existem na nuvem são adicionadas ao aparelho. Em seguida envia as fichas locais que estão mais novas.
- **Durante o uso**, cada alteração é enviada 2 s depois.
- **Ao terminar uma edição** (voltar para "Jogar", ir para o início ou trocar de ficha), o envio é imediato e aparece o aviso "Ficha salva na nuvem".
- **Ao excluir uma ficha**, ela também é apagada da nuvem.
- **Fichas nunca editadas** (sem `upd`) não são enviadas.
- **Tema claro/escuro**: fica no aparelho (`kd-tema` no `localStorage`) e, com login, em `users/{uid}`. Ao entrar, vale a escolha mais recente: a da conta é aplicada, ou a deste aparelho é enviada. Sem escolha salva, segue o tema do sistema.
- **Indicador na barra do topo** (sempre visível, no início e na ficha):

  | Indicador | Significado |
  |---|---|
  | "Entrar" (cinza) | Nunca entrou neste aparelho |
  | "Conectando…" | Verificando a conta ao abrir o app |
  | "Salvo" (bolinha verde) | Conectado; tudo enviado |
  | "Salvando…" | Enviando alterações |
  | "Pendente" (laranja) | Sem conexão; envia quando a internet voltar (toque para tentar já) |
  | **"Desconectado" (vermelho)** | Já tinha entrado aqui, mas a sessão não voltou; as alterações ficam só no aparelho até entrar de novo (toque para entrar) |

  Quando a sessão não volta, aparece também um aviso. Ao entrar de novo, as alterações feitas enquanto estava desconectado são enviadas, porque são mais novas que as da nuvem.
- **Limitação conhecida:** se outro aparelho ainda tiver a ficha excluída, ele a envia de volta na próxima sincronização. Resolver isso exige guardar um registro das fichas excluídas.

### Regras do Firestore (publicadas)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if isOwner(uid);
      allow create, update: if isOwner(uid) && validPrefs();
    }
    match /users/{uid}/fichas/{fichaId} {
      allow read, delete: if isOwner(uid);
      allow create, update: if isOwner(uid) && validFicha();
    }
    match /{document=**} {
      allow read, write: if false;
    }
    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }
    function validFicha() {
      let d = request.resource.data;
      return d.keys().hasOnly(['ficha', 'updatedAt', 'v']) && d.ficha is map
        && d.ficha.nome is string && d.ficha.nome.size() <= 200
        && d.updatedAt == request.time && d.v == 1;
    }
    function validPrefs() {
      let d = request.resource.data;
      return d.keys().hasOnly(['tema', 'updatedAt']) && d.tema in ['light', 'dark']
        && d.updatedAt == request.time;
    }
  }
}
```

`d.updatedAt == request.time` obriga o uso de `serverTimestamp()`, então o cliente não consegue inventar a data.

---

## Configuração feita no console (para refazer ou conferir)

### Firebase: Authentication

- **Método de login → Google:** ativado, com nome público "Karyu Densetsu Ficha" e o e-mail da conta como suporte.
- **Configurações → Domínios autorizados:**
  - `localhost` e `kd-ficha.web.app`: padrões, não usados pelo app;
  - `kd-ficha.firebaseapp.com`: padrão, **necessário** para o popup;
  - `fernandowrpg.github.io`: adicionado.

### Firebase: Firestore

- Edição Standard, local `southamerica-east1` (São Paulo; **não pode ser mudado depois**), começou em modo produção.
- Regras: as da seção acima. No console, o editor de regras fecha chaves sozinho ao digitar; confira o fim do texto antes de publicar.

### Google Cloud: chave de API

Em [APIs e serviços → Credenciais](https://console.cloud.google.com/apis/credentials?project=kd-ficha), na "Browser key (auto created by Firebase)":

- **Restrições do aplicativo → Sites:**
  - `https://fernandowrpg.github.io/*`
  - `https://kd-ficha.firebaseapp.com/*`: **obrigatório**. A janela de login do Google roda nesse domínio e usa a mesma chave; sem ele o login quebra.
- **Restrições de API:** a lista que o Firebase criou (25 APIs). Não foi mexida.
- **Sem `localhost`**, por decisão do projeto. Por isso **login e sincronização não funcionam no teste local** (`http://localhost:8765`), só no site publicado. O resto do app funciona normalmente em localhost. Para testar a nuvem localmente, seria preciso adicionar temporariamente `http://localhost:8765/*` (o console não aceita curinga na porta).

### Google Cloud + Firebase: App Check

1. Ativei a **reCAPTCHA Enterprise API** (hoje chamada "Fraud Defense") no projeto. São 10 mil avaliações grátis por mês e não pediu conta de faturamento.
2. Em [Segurança → Fraud Defense](https://console.cloud.google.com/security/recaptcha?project=kd-ficha), criei a chave **"KD Ficha App Check"**:
   - tipo Web, domínio `fernandowrpg.github.io`;
   - sem desafio de checkbox (baseada em pontuação), sem AMP, sem WAF.
   - Chave de site (pública): `6LcKJCAuAAAAAAnIjV-5HzBFHFHlKxSpDzZXPWW6`.
3. Em **Firebase → App Check → Apps**, registrei o "KD Ficha Web" com o provedor Fraud Defense, essa chave e TTL de 1 hora. O status aparece como **Registrado**.
4. No código, `initializeAppCheck(..., ReCaptchaEnterpriseProvider(chave))` roda antes do Auth e do Firestore, com renovação automática do token.
5. **Em localhost** o reCAPTCHA não vale. O código liga `FIREBASE_APPCHECK_DEBUG_TOKEN = true`, e o console do navegador mostra um token que pode ser cadastrado em **App Check → Apps → ⋮ → Gerenciar tokens de depuração**. (Com a chave de API sem localhost, isso só importa se o localhost for liberado para testes.)

---

## O que falta

### 1. Ligar o bloqueio do App Check

Hoje o App Check só **mede** as requisições, sem bloquear nenhuma. Depois de alguns dias de uso:

1. Abra **Firebase → App Check → APIs**.
2. Em **Cloud Firestore** e em **Authentication**, confira se quase todas as requisições aparecem como **verificadas**. Requisições "não verificadas" vindas de versões antigas do app em cache tendem a sumir.
3. Clique em **Aplicar** em cada um.

A partir daí, chamadas sem token válido são recusadas. Se algo quebrar, dá para desfazer no mesmo lugar.

### 2. Opcional

- **Cotas do Identity Toolkit**: dá para reduzir as cotas de `identitytoolkit.googleapis.com` no Google Cloud para algo do tamanho de um grupo de RPG.
- **Alertas de orçamento**: só fazem sentido se um dia o projeto passar para o plano Blaze.
- **Apagar meus dados da nuvem**: oferecer no app uma opção que apague a coleção do usuário e a conta (`deleteUser`), como manda a LGPD.
- **Registro de fichas excluídas**: para que a exclusão valha em todos os aparelhos.

## Checklist de segurança

- [x] Firestore em modo produção, com as regras acima publicadas
- [ ] Regras testadas no Rules Playground (ler outro uid: negado; gravar sem login: negado)
- [x] Domínios autorizados: GitHub Pages e os domínios padrão do Firebase
- [x] Login por `signInWithPopup` (não redirect)
- [x] Chave de API restrita por site (`github.io` e `firebaseapp.com`) e por API
- [x] App Check registrado e inicializado no código
- [ ] Bloqueio do App Check ligado em Firestore e Authentication
- [x] Nenhuma credencial de servidor ou chave de outro serviço no repositório

## Fontes

- [Best practices for using signInWithRedirect on browsers that block third-party storage](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [Learn about using and managing API keys for Firebase](https://firebase.google.com/docs/projects/api-keys)
- [App Check com reCAPTCHA Enterprise (web)](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)
- [Alternative ways to add Firebase to your JavaScript project (CDN)](https://firebase.google.com/docs/web/alt-setup)
- [Firebase JS SDK release notes](https://firebase.google.com/support/release-notes/js)
