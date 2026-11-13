# Karyu Densetsu — Ficha

Construtor de fichas de **A Lenda do Dragão de Fogo: Karyu Densetsu** para montar o protagonista e jogar presencialmente pelo celular. Visual baseado no style guide do Figma (Fiery Soul / Steel Soul, Permanent Marker + Chakra Petch).

## Funcionalidades

- **Modo Editar:** nome, conceito, Aura, atributos (18 pontos), estilo de luta (6 pontos, com estilos de exemplo do livro), ocupações e especializações (6 pontos), trunfos, caminho, laços e técnicas. Um painel “Criação” mostra os pontos gastos, e os trunfos que mudam limites (Perito, Prodígio, Ciborgue, Incansável etc.) são aplicados automaticamente.
- **Cálculo automático:** Barra de Vigor, Limiar de Canalização, Limiar de Defesa, Limiar de Proteção, caixas de ferimento e sincronização por cena.
- **Catálogos:** 115 técnicas (custo, requisito, tipo e afinidade, com busca e filtros), trunfos, caminhos com seus eventos e upgrades.
- **Modo Jogar:**
  - Barra de Vigor com −/+ e ferimentos marcados automaticamente.
  - Laços que dão +1 de sincronização ao serem desmarcados.
  - Eventos de caminho e reviravolta.
  - Barra inferior com Sincronização, Nagen da rodada e Ações extras.
- **Rolador de dados:**
  - Rola os d6 do atributo, mais/menos dados por vantagem/desvantagem e os d10 de sincronização.
  - Separa os dois maiores; toque em um dado para trocar.
  - 6+ fora do total vira Sincronização e 1 vira Tensão.
  - Com o Limiar do alvo informado, mostra acerto/erro e splash.
  - Calcula nagen, sincronização e kiai das técnicas e a perda de Vigor ao exceder o Limiar de Canalização.
  - Mostra o efeito de sincronização quando ele é ativado.
- **Dados 3D:** animação com física e 3 skins nas cores do style guide (Karyu, Aço, Brasa). Pode ser desligada.
- **Mesa:** nova rodada, nova cena, fim de sessão (cálculo de karma), Tensão, Karma e poder das emoções (Esperança, Confiança…).
- **Várias fichas** no mesmo aparelho, com exportar/importar `.json`.
- **PWA:** dá para instalar na tela inicial, funciona offline e pode manter a tela ligada durante o jogo.

## Sorte justa

O resultado de cada dado é sorteado com `crypto.getRandomValues` (gerador criptográfico do navegador) com amostragem por rejeição, sem viés. A animação 3D ([dice-box-threejs](https://github.com/3d-dice/dice-box-threejs), MIT) só mostra os dados caindo nesses valores, usando a notação de resultado forçado (`4d6+1d10@3,6,1,4,9`). A física não decide nada. No d10, a face “0” vale 10.

## Publicar no GitHub Pages

O app é 100% estático, sem build.

1. Faça push destes arquivos para a branch `main`.
2. No GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. O endereço será `https://<usuario>.github.io/kd-ficha/`.

Para testar localmente:

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`. O service worker não funciona via `file://`.

## Estrutura

```
index.html              página única
css/style.css           tokens do style guide e componentes
js/app.js               estado, regras, render, rolador, mesa
js/data.js              atributos, ocupações, estilos, caminhos, trunfos, upgrades
js/tecnicas.js          catálogo de técnicas
vendor/                 dice-box-threejs (UMD, inclui three.js e cannon-es)
fonts/                  Chakra Petch Bold (números dos dados 3D, OFL)
sw.js, manifest.webmanifest, icons/   PWA
```

Ao alterar arquivos, aumente a versão de `CACHE` em `sw.js` para os celulares receberem a atualização.

## Créditos

App de fã, não oficial. *A Lenda do Dragão de Fogo: Karyu Densetsu* © Nina Bichara, Thiago Rosa e Jambô Editora. Os textos de referência são resumos; consulte o livro para as regras completas.
