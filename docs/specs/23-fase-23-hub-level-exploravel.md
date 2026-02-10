# Project Survivor - Fase 23: HUB como Level Explorável

## Contexto

Atualmente o jogador, ao sair do menu (New Game / Continue), entra no **HUB** como uma **tela estática**: um menu com opções "Enter Dungeon" e "High Scores", navegação por setas e Enter. Não há movimento no mundo; é apenas uma interface de escolha.

Esta fase transforma o HUB em um **level explorável**: um mapa (grid) onde o jogador **anda** com o personagem e, ao se aproximar de pontos de interesse ou interagir, pode **alterar o inventário**, **comprar cura** ou **entrar na dungeon**. O fluxo deixa de ser "menu → escolher dungeon" e passa a ser "level do HUB → andar → decidir o que fazer".

## Objetivos desta Fase

1. **Level do HUB**: Carregar e exibir um mapa (grid) específico do HUB, sem inimigos e sem bombas, onde o jogador se move com os mesmos controles do jogo (WASD/setas).
2. **Pontos de interesse (POIs)**: Definir no mapa zonas/tiles para: **Inventário** (acessar/alterar inventário), **Loja** (comprar cura) e **Entrada da dungeon** (entrar na dungeon com confirmação).
3. **Interação**: Ao estar em (ou adjacente a) um POI e apertar uma tecla de interação (ex.: E), abrir a ação correspondente (tela de inventário, tela de loja, ou prompt "Entrar na dungeon?").
4. **Transições**: Manter o fluxo atual: Menu → HUB (agora level) → Dungeon → ao escapar/completar → HUB (level). Save automático ao entrar no HUB permanece.

---

## Implementação da Fase 23

### Arquitetura

- **Estado STATE_HUB**: Em vez de desenhar apenas a UI de menu (`drawHub`), o jogo passa a ter um "hub level" carregado: grid, player posicionado, e renderização do mundo (background + entidades do hub). A lógica de update no HUB passa a ser movimento do jogador, colisão com o grid e detecção de interação com POIs.
- **Mapa do HUB**: Pode ser um grid estático (arquivo de dados ou constante) ou gerado por um `HubLevelGenerator` simples (corredores, salas, sem inimigos). Deve haver células marcadas como POI: inventário, loja, dungeon.
- **POIs**: Cada POI tem tipo (`inventory` | `shop` | `dungeon`) e posição (col, row). Quando o jogador está na célula ou adjacente e pressiona E (ou tecla definida), dispara a ação. Inventário e Loja podem abrir sub-estados/overlays (ex.: `STATE_HUB_INVENTORY`, `STATE_HUB_SHOP`) ou modais; a entrada da dungeon abre confirmação e então chama `_enterDungeon()`.
- **Player no HUB**: Reutilizar a mesma entidade Player (posição, sprite, movimento). Opcional: desabilitar bomba/ataque no HUB ou simplesmente não spawnar bombas; o grid do HUB não precisa de lógica de bombas.
- **Persistência**: Posição do jogador no HUB pode ser salva no save (para continuar andando de onde parou) ou sempre spawnar em um ponto fixo (ex.: centro ou próximo à entrada da dungeon). Definir em decisão de design.

### Arquivos a Modificar / Criar

1. **`js/constants.js`** – Constantes para tamanho/seed do hub (se gerado), tipos de POI, tecla de interação.
2. **`js/world/HubLevelGenerator.js`** (novo) ou **dados estáticos** – Geração ou definição do grid do HUB e lista de POIs (col, row, tipo).
3. **`js/core/Game.js`** – `_enterHub()` passa a carregar o level do HUB (`_loadHubLevel()`), posicionar o player e manter grid/entityManager para o hub. `_updateHub(dt)` passa a atualizar movimento, colisão com grid e interação com POIs; sub-estados para inventário/loja/confirmação dungeon. `_enterDungeon()` continua sendo chamado quando o jogador confirma no POI da dungeon.
4. **`js/rendering/Renderer.js`** – No `STATE_HUB`, em vez de só `drawHub`, desenhar o mundo do hub (background do grid do HUB, player, e opcionalmente indicadores visuais dos POIs). Se houver overlay de inventário/loja, desenhar por cima.
5. **`js/rendering/BackgroundLayer.js`** ou **novo HubBackgroundLayer** – Desenhar o grid do HUB (pode reutilizar lógica de chão/parede existente com tema "hub" ou estilo próprio).
6. **`js/rendering/UIRenderer.js`** – Adaptar ou criar: desenho dos POIs no HUB (ícones ou texto), overlay de inventário no HUB (pode reutilizar/mostrar mesmo barra de bombas se fizer sentido), overlay da loja (cura), e prompt "Entrar na dungeon? [Sim] [Não]".
7. **`js/systems/CollisionSystem.js`** ou lógica no Game – No HUB, colisão apenas player vs grid (paredes); sem inimigos/bombas.
8. **SaveSystem / save data** – Incluir posição do player no HUB e grid/seed do hub (se quiser persistir estado do hub); ou não persistir e sempre carregar hub "limpo" com spawn fixo.

---

## Mudanças Detalhadas

### 1. `js/constants.js`

- Adicionar tecla de interação no HUB (ex.: `HUB_INTERACT_KEY = 'KeyE'`).
- Opcional: `HUB_GRID_COLS`, `HUB_GRID_ROWS`, ou referência a arquivo de mapa do HUB.
- Tipos de POI: `POI_TYPE_INVENTORY`, `POI_TYPE_SHOP`, `POI_TYPE_DUNGEON` (strings ou constantes).

### 2. Hub level (novo: `js/world/HubLevelGenerator.js` ou `hubLevelData.js`)

- **Opção A – Gerador**: Classe estática que preenche um Grid com paredes e chão, e retorna lista de POIs `[{ col, row, type: 'inventory'|'shop'|'dungeon' }]`. Layout simples (ex.: uma sala com três “quinas” ou salas para cada POI).
- **Opção B – Dados estáticos**: Array 2D do grid (células vazias/paredes) e array de POIs. Carregado em `_loadHubLevel()`.

Garantir que o spawn do jogador (ex.: (1,1) ou centro) seja célula vazia e que os POIs estejam em células acessíveis.

### 3. `js/core/Game.js`

- **`_enterHub()`**: Chamar `_loadHubLevel()` (criar grid do HUB, registrar POIs, posicionar player no spawn do HUB). Manter save automático ao entrar.
- **`_loadHubLevel()`**: Limpar entityManager (exceto player), limpar grid, preencher grid com o mapa do HUB, adicionar player na posição de spawn do HUB, guardar referência aos POIs (array em `this.hubPOIs`).
- **`_updateHub(dt)`**:  
  - Se sub-estado ativo (ex.: `hubSubState === 'inventory'` ou `'shop'`): processar apenas input dessa tela (fechar com Escape, escolher itens etc.).  
  - Senão: aplicar movimento do player (input WASD), resolver colisão com o grid do HUB (sem bombas/inimigos), e a cada frame verificar se o player está em ou adjacente a um POI; se estiver e `wasPressed(HUB_INTERACT_KEY)`, disparar ação do POI (abrir inventário, abrir loja, ou mostrar confirmação "Entrar na dungeon?").  
  - Se confirmação dungeon: ao confirmar Sim, chamar `_enterDungeon()`; ao cancelar, voltar ao controle normal no HUB.
- **High Scores**: Manter acessível — por exemplo como POI "High Scores" no mapa que abre a tela de recordes, ou tecla dedicada (ex.: H) no HUB.

### 4. `js/rendering/Renderer.js`

- Em `STATE_HUB`: não chamar apenas `this.uiRenderer.drawHub(ctx, renderContext)`. Chamar: desenho do background do grid do HUB, desenho das entidades (player), opcionalmente desenho de indicadores dos POIs (ícone ou texto), depois `drawHub` pode ser reduzido a HUD do HUB (stats, ouro, instruções "E - Interagir") e overlays (inventário, loja, confirmação dungeon).

### 5. Background do HUB

- Reutilizar `BackgroundLayer` com um tema "hub" (ex.: chão e paredes visuais diferentes das dungeons) ou criar variante que desenhe o grid do HUB a partir do mesmo Grid usado em jogo. Garantir que o grid do HUB seja passado no rebuild/draw.

### 6. `js/rendering/UIRenderer.js`

- **drawHub**: Adaptar para o novo fluxo: quando não há sub-tela aberta, mostrar apenas HUD leve (vida, ouro, "E - Interagir" quando perto de POI). Quando em POI de inventário: desenhar overlay de inventário (lista de itens / barra de bombas já existente, conforme Fase 16). Quando em POI de loja: desenhar overlay da loja (opções de cura, custo em ouro; pode ser placeholder simples para Fase 22). Quando em POI dungeon com confirmação: desenhar caixa "Entrar na dungeon? [Sim] [Não]".
- Indicador visual de POI: próximo ao player, mostrar texto ou ícone do POI (ex.: "Inventário", "Loja", "Dungeon") quando estiver na célula ou adjacente.

### 7. Colisão no HUB

- Usar o mesmo Grid e checar colisão player vs paredes (células não caminháveis). Pode ser um método em Game (`_updateHubMovement(dt)`) que aplica velocidade ao player e testa contra `grid.isWalkable(col, row)` ou equivalente, sem usar CollisionSystem de entidades (inimigos não existem no HUB).

### 8. Save

- Se for persistir posição no HUB: em `saveData` incluir `hubPlayerCol`, `hubPlayerRow` (e eventualmente `hubGrid` ou `hubSeed` se o mapa for gerado). Em `_enterHub()` ou ao carregar continue, restaurar posição. Caso contrário, sempre spawnar em posição fixa no `_loadHubLevel()`.

---

## Decisões em aberto

- **Layout do mapa**: Uma sala única com três “estandes” (inventário, loja, dungeon), ou várias salas/corredores. Tamanho do grid (ex.: 11x9 como dungeon ou menor).
- **Persistência**: Salvar ou não a posição do jogador no HUB entre sessões.
- **High Scores**: Manter como POI no mapa ou tecla global (ex.: H) em qualquer lugar do HUB.
- **Loja/Inventário**: Nesta fase a loja pode ser placeholder (um botão "Comprar cura" que desconta ouro e cura X HP); a Fase 22 pode expandir. O inventário pode ser a barra de bombas já existente ou uma tela futura (Fase 20).

---

## Checklist de Aceitação

- [x] Ao sair do menu (New Game/Continue), o jogador entra em um level do HUB com grid visível e pode andar com WASD/setas.
- [x] Existe pelo menos um POI "Inventário": ao chegar perto e apertar E (ou tecla definida), abre interface de inventário (ou equivalente).
- [x] Existe pelo menos um POI "Loja": ao chegar perto e apertar E, abre interface de loja (cura); pode ser placeholder (comprar cura por ouro).
- [x] Existe um POI "Entrada da dungeon": ao chegar perto e apertar E, aparece confirmação "Entrar na dungeon?"; ao confirmar, o jogo chama _enterDungeon() e carrega a dungeon; ao cancelar, volta ao HUB.
- [x] Ao escapar ou completar a dungeon, o jogador retorna ao level do HUB (não à tela de menu antiga).
- [x] Save automático ao entrar no HUB é mantido.
- [x] High Scores continua acessível (por POI ou tecla no HUB).

---

## Notas de implementação

- **Indicadores visuais dos POIs:** No `Renderer.js`, método `_drawHubPOIMarkers()` desenha uma placa no chão em cada POI (Inventário, Loja, Dungeon, Recordes) com ícone e etiqueta, para o jogador identificar onde interagir sem depender só do "E - Interagir" ao se aproximar.
- **Animação do sprite no HUB:** O movimento no HUB é feito em `_updateHubMovement()` sem chamar o `PlayerControlBehavior`. Para os sprites do jogador (direção e animação de caminhada) atualizarem corretamente, após o movimento o jogo atualiza apenas o `animTimer` do player: `if (player.moving) player.animTimer += dt; else player.animTimer = 0;`.

---

## Status: ✅ IMPLEMENTADO
