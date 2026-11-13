// Dados de referência de A Lenda do Dragão de Fogo: Karyu Densetsu (2ª ed., Jambô).
// Resumos curtos para consulta rápida na mesa — consulte o livro para o texto completo.

window.KD = {
  atributos: [
    { id: 'FOR', nome: 'Força' },
    { id: 'RAZ', nome: 'Razão' },
    { id: 'AGI', nome: 'Agilidade' },
    { id: 'INS', nome: 'Instinto' },
    { id: 'VON', nome: 'Vontade' },
    { id: 'PRE', nome: 'Presença' },
  ],

  // Ordem igual à da ficha no Figma (2 colunas).
  estilo: [
    { id: 'agarrao', nome: 'Agarrão' },
    { id: 'projetil', nome: 'Projétil' },
    { id: 'golpe', nome: 'Golpe' },
    { id: 'bloqueio', nome: 'Bloqueio' },
    { id: 'combo', nome: 'Combo' },
    { id: 'esquiva', nome: 'Esquiva' },
  ],

  ocupacoes: [
    { id: 'artista', nome: 'Artista', dica: 'Artes, performance, impressionar com sua arte.' },
    { id: 'atleta', nome: 'Atleta', dica: 'Saltar, correr, nadar, escalar, esportes.' },
    { id: 'cientista', nome: 'Cientista', dica: 'Ciências formais, pesquisa, contatos acadêmicos.' },
    { id: 'diplomata', nome: 'Diplomata', dica: 'Entender pessoas, convencer, não ser enganado.' },
    { id: 'engenheiro', nome: 'Engenheiro', dica: 'Construir, reparar e projetar máquinas.' },
    { id: 'medico', nome: 'Médico', dica: 'Diagnosticar, primeiros socorros, tratar feridos.' },
    { id: 'mistico', nome: 'Místico', dica: 'Espíritos, rituais, fluxo do nagen.' },
    { id: 'piloto', nome: 'Piloto', dica: 'Dirigir, pilotar, navegar, conhecer as ruas.' },
    { id: 'trapaceiro', nome: 'Trapaceiro', dica: 'Enganar, se esconder, submundo.' },
    { id: 'vigilante', nome: 'Vigilante', dica: 'Observar, investigar, proteger.' },
  ],
  niveisOcupacao: ['Leigo', 'Aprendiz', 'Proficiente', 'Mestre'],

  estilosExemplo: [
    { nome: 'Capoeira', v: { agarrao: 0, bloqueio: 0, combo: 2, esquiva: 2, golpe: 2, projetil: 0 }, ougi: 'Ginga de Batalha' },
    { nome: 'Karatê', v: { agarrao: 1, bloqueio: 1, combo: 1, esquiva: 1, golpe: 1, projetil: 1 }, ougi: 'Golpe Explosivo' },
    { nome: 'MMA', v: { agarrao: 2, bloqueio: 1, combo: 0, esquiva: 1, golpe: 2, projetil: 0 }, ougi: 'Imobilização' },
    { nome: 'Muay Thai', v: { agarrao: 1, bloqueio: 3, combo: 0, esquiva: 0, golpe: 2, projetil: 0 }, ougi: 'Bloqueio Agressivo' },
    { nome: 'Sistema de Combate Tuchi', secreto: true, v: { agarrao: 2, bloqueio: 1, combo: 1, esquiva: 1, golpe: 2, projetil: 0 }, ougi: 'Dragão Nascente, Aura de Batalha' },
    { nome: 'Karyujutsu', secreto: true, v: { agarrao: 1, bloqueio: 1, combo: 1, esquiva: 1, golpe: 1, projetil: 2 }, ougi: 'Telepatia, Disparo Elemental' },
    { nome: 'Neohopak', secreto: true, v: { agarrao: 0, bloqueio: 2, combo: 1, esquiva: 2, golpe: 2, projetil: 0 }, ougi: 'Ginga de Batalha, Sorriso Selvagem' },
  ],

  tiposGolpe: ['Agarrão', 'Combo', 'Golpe', 'Projétil', 'Esquiva', 'Bloqueio'],
  elementos: ['Água', 'Fogo', 'Terra', 'Ar'],

  caminhos: [
    { nome: 'Amizade', eventos: ['Se arriscar para ajudar um amigo', 'Conversar com um amigo', 'Falar sobre a importância da amizade'], rev: 'Decidir se virar sozinho' },
    { nome: 'Amnésia', eventos: ['Encontrar alguém que conhece você, mas que você não reconhece', 'Tentar descobrir mais sobre o seu passado', 'Não saber responder uma pergunta sobre o seu passado'], rev: 'Descobrir o seu passado' },
    { nome: 'Aventura', eventos: ['Agir sem pensar', 'Correr perigo sem motivo', 'Reclamar sobre uma situação chata'], rev: 'Parar de se aventurar' },
    { nome: 'Boomer', eventos: ['Desprezar abertamente os ideais ou atitudes dos mais jovens', 'Dizer que está velho demais pra isso', 'Apontar para os mais jovens a falência moral do mundo'], rev: 'Descobrir que ainda tem ideais e não está tão distante dos jovens' },
    { nome: 'Cautela', eventos: ['Evitar participar de uma cena por causa do risco', 'Aconselhar outra pessoa a não correr riscos', 'Planejar cuidadosamente antes de agir'], rev: 'Enfrentar o perigo de frente' },
    { nome: 'Crença', eventos: ['Explicar seus ideais para outra pessoa', 'Entrar em confusão por causa dos seus ideais', 'Acatar a decisão de uma autoridade da sua crença'], rev: 'Abandonar sua crença' },
    { nome: 'Ganância', eventos: ['Tirar vantagem de uma situação ruim', 'Se arriscar por riqueza/poder/influência', 'Prejudicar uma pessoa em nome da sua ganância'], rev: 'Abrir mão de sua riqueza/poder/influência' },
    { nome: 'Heroísmo', eventos: ['Ajudar um desconhecido', 'Sofrer ferimentos ou contratempos por ajudar alguém', 'Atender a um pedido de ajuda'], rev: 'Parar de se importar com os outros' },
    { nome: 'Honra de Assassino', eventos: ['Deixar de matar alguém por não ter sido pago', 'Matar um alvo sob contrato', 'Relativizar assassinatos que cometeu'], rev: 'Deixar de ser um assassino' },
    { nome: 'Independência', eventos: ['Recusar ajuda', 'Se prejudicar por ter recusado ajuda', 'Conseguir fazer algo difícil sozinho'], rev: 'Passar a aceitar ajuda' },
    { nome: 'Macunaíma', eventos: ['Enganar alguém', 'Encontrar uma forma de evitar trabalhar', 'Fazer outra pessoa resolver um problema que você criou'], rev: 'Tomar vergonha na cara' },
    { nome: 'Missão', eventos: ['Explicar sua missão e a importância dela', 'Procurar informações sobre sua missão', 'Correr riscos para avançar sua missão'], rev: 'Abandonar a missão' },
    { nome: 'Orgulho', eventos: ['Explicar em detalhes sua superioridade', 'Racionalizar como alguém tão superior pode falhar', 'Ser bem-sucedido em uma tarefa importante'], rev: 'Perceber que não é melhor que os outros' },
    { nome: 'Policarpo', eventos: ['Mencionar a grandiosidade do seu país', 'Dar argumentos fracos contra críticas ao Brasil', 'Meter-se em confusão para defender a imagem do país'], rev: 'Perceber que uma bandeira é apenas um pedaço de pano' },
    { nome: 'Proteção', eventos: ['Conversar com o seu protegido', 'Mudar seu curso de ação por causa do protegido', 'Salvar seu protegido do perigo'], rev: 'Perceber que essa pessoa não precisa da sua proteção' },
    { nome: 'Risadas', eventos: ['Fazer uma piada, trocadilho ou comentário sarcástico', 'Importunar outro personagem com humor', 'Fazer outro jogador (não personagem!) rir'], rev: 'Abandonar o escudo do humor' },
    { nome: 'Romance', eventos: ['Falar abertamente sobre a beleza de outro personagem', 'Flertar com outro personagem', 'Encrencar-se por causa dos seus flertes'], rev: 'Sossegar o facho' },
    { nome: 'Ruptura', eventos: ['Explicar por que seus mentores estão errados', 'Usar a reputação dos mentores a seu favor', 'Entrar em confusão pelos ideais/práticas dos mentores'], rev: 'Voltar ao ninho' },
    { nome: 'Sanguinolência', eventos: ['Falar abertamente sobre sua sede de sangue', 'Entrar em combate', 'Espancar alguém brutalmente'], rev: 'Desistir de lutar' },
    { nome: 'Vingança', eventos: ['Deixar de fazer algo para focar na vingança', 'Prejudicar o alvo da sua vingança', 'Explicar os motivos da sua vingança'], rev: 'Desistir da vingança' },
  ],

  // fx: efeitos aplicados automaticamente nos cálculos da ficha.
  trunfos: [
    { nome: 'Aceito', req: '', desc: 'Sintonia com um elemento (água, ar, fogo ou terra): técnicas dele custam 1 nagen a menos e têm vantagem. Não aprende técnicas de outros elementos. Perde 2 de Vigor ao ser atingido pelo elemento oposto.' },
    { nome: 'Agente', req: '', desc: 'Trabalha para uma organização poderosa: equipamento extra, transporte e salário. Para pedir recursos, teste Presença contra a Tensão.' },
    { nome: 'Amigos Importantes', req: '', desc: 'Um coadjuvante com quem tem laço é poderoso e influente. Pedir ajuda direta a ele aumenta a Tensão em 1.' },
    { nome: 'Arsenal', req: '', desc: 'Começa com dois equipamentos (armas, artefatos ou implantes) e um item indeterminado adicional.' },
    { nome: 'Caminho da Perfeição', req: '', desc: 'Uma técnica de ataque refinada: splash com margem 4+, dano +1, vantagem no ataque e até 2 upgrades nela. Só escolhe 5 técnicas na criação.', fx: { tecnicas: -1 } },
    { nome: 'Ciborgue', req: '', desc: '+3 Limiar de Proteção, +3 Vigor e uma caixa de ferimento extra; vantagem com eletrônicos. −1 Limiar de Canalização e 1 dado de sincronização a menos por cena.', fx: { protecao: 3, vigor: 3, ferimentos: 1, canal: -1, sinc: -1 } },
    { nome: 'Conhecimento Efêmero', req: '', desc: 'Uma vez por sessão, declara ter uma ocupação nível 2, uma especialização ou uma técnica (cumprindo requisitos) até o fim da cena. Tensão +1.' },
    { nome: 'Espírito Guardião', req: '', desc: 'Um espírito com Aura +2 protege você. Quando fica ferido ele surge; pode entrar no seu corpo, desmarcar um ferimento e dar vantagem até o fim da cena.' },
    { nome: 'Estilo Secreto', req: '', desc: 'Seu estilo tem dois ougi em vez de um e você ganha +1 ponto para as habilidades do estilo.', fx: { estilo: 1, ougi: 1 } },
    { nome: 'Hanyo', req: '', desc: 'Sangue de yokai: pode escolher uma técnica shintai além das 6 normais.', fx: { tecnicas: 1 } },
    { nome: 'Incansável', req: 'Vontade 4', desc: 'Você nunca desiste. +2 na Barra de Vigor e pode usar o poder da esperança duas vezes na mesma cena.', fx: { vigor: 2 } },
    { nome: 'Jasq', req: '', desc: 'Parasita do Outro Mundo: perde 1 Vigor no começo de cada cena e 1 extra ao exceder a Canalização, mas começa cada cena com +1 dado de sincronização.', fx: { sinc: 1, jasq: 1 } },
    { nome: 'Lobo Solitário', req: '', desc: '+1 sincronização em cenas em que é o único protagonista. Uma vez por cena, ao recusar ajuda, troca um dado por um d10. Começa com apenas 2 laços.', fx: { lacos: -1 } },
    { nome: 'Médium', req: '', desc: 'Percebe e conversa com espíritos; vantagem em Presença com eles. Conhece um Ritual de Invocação.' },
    { nome: 'Mestre de Armas', req: '', desc: 'Ataques com armas causam +1 de dano. Com vantagem e uma característica de arma escolhida, troca um dado por um d10.' },
    { nome: 'Perito', req: '', desc: 'Apenas 4 pontos de estilo (máx. 2 cada) e nenhum ougi, mas 12 pontos de ocupações e uma especialização gratuita.', fx: { estilo: -2, estiloMax: 2, ocupacoes: 6, esp: 1, ougi: -1 } },
    { nome: 'Prodígio', req: 'Atributo 5', desc: 'Talento inato: eleve um atributo de 5 para 6.', fx: { attrMax: 6 } },
    { nome: 'Rede de Contatos', req: '', desc: 'Começa com 4 laços. Seus contatos são boas fontes de informação (normalmente não na mesma cena).', fx: { lacos: 1 } },
    { nome: 'Ritualista', req: '', desc: 'Rituais custam 2 nagen a menos e têm vantagem. Sabe 3 rituais e apenas 2 outras técnicas.', fx: { tecnicas: -1 } },
    { nome: 'Síndrome de Lúcifer', req: '16 anos ou menos', desc: 'Aceito de fogo: técnicas de fogo causam +2 de dano. Resultados 2 não usados também aumentam a Tensão.', fx: { lucifer: 1 } },
    { nome: 'Tocado', req: '', desc: 'Afinidade com um elemento: técnicas dele custam 1 nagen a menos. Não aprende técnicas do elemento oposto; perde 2 de Vigor ao ser atingido por ele.' },
    { nome: 'Vitória Magnética', req: '', desc: 'Depois de derrotar alguém, gaste 1 dado de sincronização para formar um laço com essa pessoa.' },
    { nome: 'Volta por Cima', req: '', desc: 'Quanto pior a situação, mais forte você fica. Quando está ferido, pode somar a Tensão nas jogadas em vez de uma ocupação ou estilo de luta.', fx: { voltaPorCima: 1 } },
  ],

  upgrades: [
    { nome: 'Finesse', desc: 'Técnicas com dano baseado em Força passam a usar Agilidade.' },
    { nome: 'Invencibilidade', desc: 'Quem tentar retaliar contra a técnica sofre desvantagem.' },
    { nome: 'Poder', desc: 'Some +2 ou sua Aura (o maior) ao dano. Só técnicas com dano e jogada de ataque.' },
    { nome: 'Precisão', desc: 'Ataca com vantagem ao usar a técnica. Só técnicas de ataque.' },
    { nome: 'Preparação', desc: 'Cada ação extra usada para preparar dá +1 dado de vantagem (máx. Aura +1).' },
    { nome: 'Quebra de Guarda', desc: 'A defesa total de Bloqueio não funciona; técnicas de Bloqueio sofrem desvantagem.' },
    { nome: 'Ressonância', desc: 'Custo em nagen −1 (mínimo 1).' },
    { nome: 'Retribuição', desc: 'Vantagem quando usada para retaliar. Só técnicas de ataque.' },
    { nome: 'Versatilidade', desc: 'Altera a afinidade elemental da técnica.' },
  ],

  splash: [
    { nome: 'Sincronização', desc: 'Ganha 1 dado de sincronização (não precisa descartar).' },
    { nome: 'Ataque Decisivo', desc: 'Dano +5.' },
    { nome: 'Empecilho', desc: 'O alvo tem desvantagem até o fim do próximo turno dele.' },
    { nome: 'Ataque Total', desc: 'Novo ataque como ação extra; se errar, o alvo retalia com vantagem.' },
  ],

  emocoes: [
    { nome: 'Confiança', desc: 'Some 2 dados de sincronização em uma jogada.' },
    { nome: 'Esperança', desc: 'Remove a condição ferido e recupera toda a Barra de Vigor.' },
    { nome: 'Raiva', desc: 'Transforma um erro em acerto ou um acerto em splash.' },
    { nome: 'Amor', desc: 'Só com um dado vindo de um laço: +1 dado de sincronização em todas as ações até o fim da cena.' },
  ],
};
