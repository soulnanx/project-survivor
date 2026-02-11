# Project Survivor - Fase 26: HUB — Distinção Visual dos POIs (estruturas e cenário)

## Contexto

A Fase 23 tornou o HUB um level explorável com POIs (Inventário, Loja, Dungeon, Recordes). Na prática, esses pontos são **indicados por ícones e etiquetas sobre o mesmo chão** do grid, sem nenhuma estrutura física ou cenário que diferencie cada área. O resultado é uma tela hub **genérica**: o jogador vê um grid homogêneo com quatro “placas” flutuantes, sem sensação de lugar (loja, masmorra, etc.). Não há **separação espacial** nem **identidade visual** por sessão — por exemplo, não há nada que lembre uma loja, uma escada para a dungeon ou um cantinho de inventário.

Esta fase propõe **dar identidade visual e espacial a cada POI**: estruturas ou tiles que sugiram a função do local (ex.: balcão/estrutura de loja, escada ou entrada para dungeon, área de inventário com estante/baú) e, se possível, **separar melhor os locais** no layout (nichos, salas ou regiões distintas) para que o hub deixe de parecer um único salão com ícones no chão.

## Objetivos desta Fase

1. **Separar espacialmente os POIs**: Ajustar o layout do HUB (mapa/gerador ou dados estáticos) para que Inventário, Loja, Dungeon e Recordes ocupem **áreas ou “cantos” distintos** (ex.: corredores, salas pequenas ou nichos), em vez de uma única fila de tiles no mesmo corredor.
2. **Estrutura visual por tipo de POI**:
   - **Loja**: Alguma estrutura que lembre loja (ex.: balcão, prateleira, tenda, tile de “caixa” ou parede temática), mesmo que com tiles/sprites simples.
   - **Dungeon**: Entrada que sugira masmorra — por exemplo **escada descendo**, tile de “buraco”/portal ou parede com arco, alinhado ao tema apocalíptico.
   - **Inventário**: Área que sugira armazenamento (estante, baú, mesa com itens ou tile temático).
   - **Recordes**: Área que sugira ranking/placar (painel, quadro, pódio ou tile temático).
3. **Consistência com o tema**: Manter estilo visual (pixel-art, tema apocalíptico) e integração com o grid existente; estruturas podem ser combinações de tiles especiais ou sprites estáticos.
4. **Interação inalterada**: A lógica de “chegar perto e apertar E” para cada POI permanece; apenas o **visual e o layout** mudam.

---

## Implementação da Fase 26

### Arquitetura

- **Layout do HUB**: O grid do HUB (gerado por `HubLevelGenerator` ou definido em dados estáticos) passa a definir **regiões** para cada POI (não apenas uma célula). Cada região pode ter **tiles especiais** (ex.: `tile_shop_floor`, `tile_dungeon_stairs`, `tile_inventory_desk`) e **estruturas** (sprites ou overlays) desenhadas no background ou em camada de decoração.
- **Tipos de tile/estrutura**: Introduzir no sistema de grid ou no renderizador do HUB:
  - Tiles de “chão temático” por POI (opcional).
  - Tiles ou entidades estáticas que representem **estrutura** (balcão, escada, estante, painel) — desenhados na mesma camada do grid ou em camada de decoração do HUB.
- **POIs**: Continuam com (col, row) ou (col, row, width, height) para zona de interação; a detecção “player em/adjacente ao POI” não muda. O que muda é o **desenho** da área (estruturas + possivelmente tiles diferentes).
- **Assets**: Novos tiles ou sprites para: loja (balcão/tenda), dungeon (escada/entrada), inventário (estante/baú), recordes (painel/quadro). Podem ser placeholders (retângulos coloridos ou tiles reaproveitados) até arte final.

### Arquivos a Modificar / Criar

1. **`js/world/HubLevelGenerator.js`** (ou dados estáticos do HUB) – Redefinir layout com regiões separadas para cada POI; definir células com tipos de tile especiais (ex.: chão loja, chão dungeon) e posições de estruturas (escada, balcão, etc.).
2. **Grid / mapa do HUB** – Suporte a **tiles especiais** no HUB (ex.: enum ou constantes `HUB_TILE_FLOOR`, `HUB_TILE_SHOP`, `HUB_TILE_DUNGEON_STAIRS`, `HUB_TILE_INVENTORY`, `HUB_TILE_RECORDS`). Se o grid atual só tem “caminhável / parede”, estender para armazenar tipo de tile por célula (apenas no contexto do HUB).
3. **`js/rendering/BackgroundLayer.js`** ou **camada específica do HUB** – Desenhar tiles especiais do HUB (cores ou sprites por tipo) e desenhar **estruturas** (sprites de escada, balcão, estante, painel) nas posições definidas pelo layout.
4. **`js/rendering/Renderer.js`** – Garantir que, no `STATE_HUB`, a ordem de desenho seja: grid do HUB (incluindo tiles especiais) → estruturas → player → indicadores/UI (etiquetas dos POIs podem ser mantidas ou suavemente reduzidas, já que o visual passa a identificar o local).
5. **Assets** – Pasta sugerida: `assets/hub/` ou `assets/tiles/hub/` para tiles e sprites de estruturas (loja, escada, inventário, recordes). Documentar em **Assets utilizados** quais arquivos são necessários; permitir placeholders (ex.: retângulos ou tiles reaproveitados) até arte final.
6. **`js/constants.js`** – Constantes para tipos de tile do HUB e, se necessário, tamanhos/offsets das estruturas.

### Mudanças Detalhadas

#### 1. Layout do HUB (HubLevelGenerator ou dados estáticos)

- Redesenhar o mapa para ter **pelo menos 4 áreas distintas** (não uma única linha):
  - Ex.: uma sala central com corredores ou nichos para Loja, Dungeon, Inventário e Recordes; ou um “L” / “U” com cada POI em um canto.
- Para cada POI, definir:
  - Células de “chão” da área (podem ter tipo de tile especial).
  - Célula(s) de **estrutura** (onde fica a escada, o balcão, a estante, o painel).
  - Célula de interação (onde o jogador fica para apertar E) — pode ser a mesma da estrutura ou adjacente.
- Garantir spawn do jogador em célula neutra (ex.: centro ou entrada) e caminho livre até cada POI.

#### 2. Tiles especiais no HUB

- Se o grid do jogo suportar apenas walkable/wall, no contexto do HUB pode-se:
  - **Opção A**: Estender o grid do HUB para armazenar um “tipo” por célula (floor, shop_floor, dungeon_stairs, inventory_zone, records_zone) e desenhar de forma diferente cada tipo.
  - **Opção B**: Manter grid binário e ter uma “camada de decoração” (array 2D ou lista de entidades estáticas) que define, por (col, row), qual estrutura ou tile visual desenhar.
- Escolha a que exigir menos refatoração no restante do código; a Opção B tende a ser mais flexível para sprites de tamanho variado.

#### 3. Desenho das estruturas

- **Loja**: Desenhar em (col_shop, row_shop) um sprite ou composição de tiles que lembre balcão/tenda (ex.: 1x2 ou 2x1 tiles).
- **Dungeon**: Desenhar escada descendo (sprite ou tiles em degraus) na célula (ou células) da entrada da dungeon.
- **Inventário**: Desenhar estante/baú/mesa na área do POI inventário.
- **Recordes**: Desenhar painel/quadro na área do POI recordes.
- Ordem de desenho: chão → estruturas → player → UI, para o personagem passar “na frente” das bases das estruturas quando fizer sentido, ou “atrás” se for algo como um painel na parede (definir por tipo).

#### 4. POIs e interação

- Manter a lista de POIs (col, row, type). Se a área de interação for maior que 1x1, a lógica atual “em ou adjacente” já cobre; não é obrigatório mudar para retângulo. Foco desta fase é **visual**, não mudar regras de input.

#### 5. Constantes e assets

- Em `constants.js`: `HUB_TILE_*` para tipos de tile; opcionalmente `HUB_STRUCTURE_*` para offsets ou tamanhos.
- Em `assets/hub/` (ou equivalente): listar arquivos esperados (ex.: `shop_counter.png`, `dungeon_stairs.png`, `inventory_shelf.png`, `records_board.png`) e aceitar placeholders até arte final.

---

## Assets utilizados

- **Loja**: Sprite ou tile de “balcão” / “tenda” (ex.: `assets/hub/shop_counter.png` ou tiles 1x2). Placeholder: retângulo ou tile de parede reaproveitado com cor diferente.
- **Dungeon**: Sprite ou tiles de “escada descendo” (ex.: `assets/hub/dungeon_stairs.png`). Placeholder: seta ou degraus simples.
- **Inventário**: Sprite ou tile de “estante” / “baú” (ex.: `assets/hub/inventory_shelf.png`). Placeholder: tile temático ou retângulo.
- **Recordes**: Sprite ou tile de “painel” / “quadro” (ex.: `assets/hub/records_board.png`). Placeholder: retângulo ou tile com texto “Recordes”.

Todos devem seguir o estilo pixel-art e tema apocalíptico do projeto; documentar na spec ou em CONTEXT.md quando houver arte final.

---

## Checklist de Aceitação (MVP)

- [x] O layout do HUB separa claramente as áreas de Inventário, Loja, Dungeon e Recordes (não uma única fila no mesmo corredor).
- [x] A área da **Loja** possui uma estrutura visual que lembra loja (balcão, tenda ou placeholder).
- [x] A área da **Dungeon** possui uma estrutura visual que sugere entrada para masmorra (escada descendo ou placeholder).
- [x] A área do **Inventário** e a de **Recordes** possuem estrutura simples ou mantêm marcador atual (polish posterior aceitável).
- [x] A interação (E no POI) continua funcionando para cada tipo; apenas o visual e o layout mudaram.
- [x] O tema visual permanece consistente com o resto do jogo (pixel-art, apocalíptico).

---

## Decisões em aberto

- **Ordem de camada**: Player na frente ou atrás das estruturas (por tipo de estrutura).

---

## Recomendações adotadas (Fase 26)

- **Layout fixo**: Dados estáticos (array 2D + lista de POIs + lista de decorações); sem geração procedural. Tamanho do grid mantido (15x13).
- **Camada de decoração**: O grid global não é alterado (continua apenas `CELL_EMPTY` / `CELL_WALL`); estruturas são desenhadas por cima do chão em camada separada.
- **MVP de arte**: Estruturas visuais para **Dungeon** (escada) e **Loja** (balcão) com placeholders; **Inventário** e **Recordes** aceitam estrutura simples ou marcador atual na primeira entrega (polish posterior).
- **Prioridade**: Fase de polish; implementação não depende de Fase 21/22.

---

## Crítica da spec

- **Escopo de arte**: A spec depende de novos assets (tiles/sprites). Sem arte dedicada, o resultado pode continuar “placeholder” e pouco impactante. Vale definir um **mínimo viável** (ex.: só escada e balcão com placeholders) e marcar o restante como polish.
- **Complexidade do grid**: Introduzir tiles especiais só no HUB evita poluir o grid das dungeons, mas exige caminhos separados no código (HubLevelGenerator vs level normal). Manter a opção de “camada de decoração” sem alterar o grid global reduz risco.
- **Layout fixo vs gerado**: Se o HUB for gerado proceduralmente, garantir “regiões” para cada POI pode ser mais trabalhoso; um layout estático em dados (array 2D + lista de estruturas) é mais previsível e fácil de desenhar à mão.
- **Prioridade**: Esta fase é de **polish e clareza**, não de nova mecânica. Pode ser feita após fases de conteúdo (ex.: Fase 22 Loja completa, Fase 21 variedade de dungeons) para não bloquear gameplay.

---

## Status: ✅ IMPLEMENTADO
