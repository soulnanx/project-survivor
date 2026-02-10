# Contexto do Projeto - Project Survivor

Documento de **arquitetura e padrões** do código. Para status das fases (implementadas/planejadas), use **`docs/specs/README.md`** como fonte da verdade.

---

## Arquitetura Atual

### Sistemas Principais

- **ExperienceSystem** (`js/systems/ExperienceSystem.js`)
  - Gerencia XP, levels e bonuses
  - Escuta `enemy:killed` para dar XP
  - Emite `player:levelup` e `xp:gained`
  - Bonuses de stats RPG nos level ups

- **SaveSystem** (`js/systems/SaveSystem.js`)
  - Persistência em localStorage
  - Save automático ao completar dungeon, ao tomar dano e ao entrar no HUB
  - Delete automático na morte (permadeath)
  - Carrega progresso do player
  - Salva seed do nível atual e métricas da run (versão 3, preparação para v4)

- **CollisionSystem** (`js/systems/CollisionSystem.js`)
  - Sistema de HP para player e inimigos
  - Dano gradual ao invés de morte instantânea
  - Aplica defense, attackPower e sistema de crítico

- **DungeonGenerator** (`js/world/DungeonGenerator.js`)
  - Geração procedural de dungeons baseada em seed
  - Controla quantidade e posicionamento de blocos e inimigos
  - Geração determinística e reproduzível
  - Power-ups removidos (serão substituídos por drops na Fase 13)

- **PRNG** (`js/utils/PRNG.js`)
  - Gerador de números pseudo-aleatórios baseado em seed
  - Algoritmo Mulberry32 para geração determinística

- **AttractionSystem** (`js/systems/AttractionSystem.js`)
  - Gerencia atração de zumbis a explosões de bombas
  - Escuta `bomb:detonated` para registrar pontos de atração
  - Atrações duram 10 segundos
  - Cada zumbi (independente do behavior) é atraído pela explosão mais próxima
  - Comportamentos adaptam movimento para perseguir atração ao invés do alvo original

- **RageSystem** (`js/systems/RageSystem.js`)
  - Gerencia estado de rage dos zumbis quando bombas explodem
  - Escuta `bomb:detonated` e emite `rage:triggered`
  - Calcula duração dinâmica baseada em distância Manhattan e tipo de zumbi
  - Multiplicadores de tempo por tipo: wanderer (0.9x), chaser (1.0x), smart (1.1x)
  - Estados: `moving` → `paused` → `none`
  - Velocidade aumentada com transição suave (lerp) e cap máximo de 2x
  - Cooldown de 1.5s após sair de rage (evita loops)
  - Feedback visual: aura pulsante + tint vermelho com intensidade por fase

- **DropSystem** (`js/systems/DropSystem.js`) — Fase 20 (ouro)
  - Brick: 5% fixo. Zumbi: 15–30% definido pelo seed do level (determinístico)
  - Escuta `brick:destroyed` e `enemy:killed`; emite `drop:spawned` com `{ col, row, value }` (valor 1, 5 ou 10)
  - No update, detecta player na mesma célula que um drop, soma valor a `player.gold`, remove drop, emite `drop:collected`
  - Game mantém lista `goldDrops`; renderização em EntityRenderer.drawGoldDrop()

### Player Stats

O Player agora tem:
- `hp`, `maxHp` - Sistema de HP
- `level`, `xp` - Sistema RPG
- `speed`, `maxBombs`, `bombRange` - Stats que aumentam com level
- `defense` - Redução de dano recebido (%)
- `attackPower` - Multiplicador de dano causado
- `critChance` - Chance de crítico (%)

### EventBus Events

Eventos principais:
- `enemy:killed` - Inimigo morto (dá XP)
- `player:levelup` - Player subiu de nível
- `xp:gained` - XP ganho (para feedback visual)
- `player:hit` - Player tomou dano (com dano real após defense, triggera save automático)
- `player:died` - Player morreu (deleta save permanentemente)
- `player:crit` - Crítico ocorreu (dano 2x)
- `level:complete` - Dungeon completada (volta ao HUB)
- `level:started` - Dungeon iniciada
- `bomb:detonated` - Bomba explodiu (cria atração para zumbis e trigger de rage)
- `rage:triggered` - Rage ativada (com posição da explosão e células afetadas)
- `zombie:rage_start` - Zumbi entrou em rage
- `zombie:rage_arrived` - Zumbi chegou ao local da explosão
- `brick:destroyed` - Brick destruído (col, row)
- `drop:spawned` - Drop de ouro spawnado (col, row, value: 1|5|10)
- `drop:collected` - Drop coletado pelo player (type: 'gold', value)

### Renderização com Sprites (Fase 12)

- **SpriteLoader** (`js/rendering/SpriteLoader.js`)
  - Carrega 36 frames do player (9 frames × 4 direções)
  - Caminho: `/bomberman/assets/sprites/char/standard/walk/`
  - Fallback procedural se sprites falhem

- **ZombieLoader** (`js/rendering/ZombieLoader.js`)
  - Carrega 36 frames dos zombies (9 frames × 4 direções)
  - Caminho: `/bomberman/assets/sprites/zombie/standard/walk/`
  - Animação mais lenta (8 fps vs 12 fps do player)
  - Fallback procedural se sprites falhem

- **EntityRenderer** Modificado
  - `_drawPlayerSprite()` / `_drawPlayerProcedural()` para player
  - `_drawZombieSprite()` / `_drawZombieProcedural()` para inimigos
  - Cálculo de frame baseado em `animTimer` e `moving`

### HUB explorável (Fase 23)

- **HubLevelGenerator** (`js/world/HubLevelGenerator.js`)
  - Gera o mapa do HUB (grid estático: bordas de parede, interior vazio)
  - Retorna lista de POIs: Inventário, Loja, Entrada da dungeon, High Scores
  - Spawn do jogador em (1, 1)

- **Game.js – estado STATE_HUB**
  - `_loadHubLevel()`: carrega grid e POIs, posiciona o player, tema `hub` no BackgroundLayer
  - `_updateHubMovement(dt)`: movimento WASD com colisão só no grid (sem bombas/inimigos)
  - Após o movimento, atualiza `player.animTimer` para a animação de sprites funcionar (direção e frames de caminhada)
  - Sub-estados: inventory, shop, dungeon_confirm, high_scores (tecla E nos POIs; H para High Scores em qualquer lugar)

- **Renderer.js**
  - No HUB: desenha background, `_drawHubPOIMarkers()` (placas com ícone e etiqueta em cada POI), entidades (player), depois HUD/overlays

- **Player:** campo `gold` (persistido no SaveSystem) para a loja no HUB (comprar cura por ouro).

---

## Documentação

- **Status das fases e próximos passos:** `docs/specs/README.md` (fonte da verdade)
- **Specs por fase:** `docs/specs/NN-fase-NN-nome.md`
- **Regras do Cursor:** `.cursor/rules/` (convenções e formato de specs)

---

## Como Continuar o Desenvolvimento

1. **Arquitetura e padrões:** ler este arquivo (`CONTEXT.md`).
2. **O que fazer em seguida:** ler `docs/specs/README.md` (fases planejadas e status).
3. **Implementar:** seguir o formato das specs em `docs/specs/` e as regras em `.cursor/rules/`.

---

## Estrutura do Projeto

```
bomberman/
├── js/
│   ├── systems/
│   │   ├── ExperienceSystem.js ✅
│   │   ├── SaveSystem.js ✅
│   │   ├── CollisionSystem.js ✅
│   │   ├── AttractionSystem.js ✅ (atração de zumbis a explosões)
│   │   ├── RageSystem.js ✅ (rage dos zumbis com fases e feedback visual)
│   │   └── ...
│   ├── entities/
│   │   ├── Player.js ✅ (tem hp, level, xp, defense, attackPower, critChance)
│   │   ├── Enemy.js ✅ (tem hp)
│   │   └── ...
│   ├── rendering/
│   │   ├── UIRenderer.js ✅ (HP bar, XP bar, stats display, seed display)
│   │   ├── EntityRenderer.js ✅ (health powerup)
│   │   └── ...
│   ├── utils/
│   │   ├── PRNG.js ✅ (gerador pseudo-aleatório baseado em seed)
│   │   └── ...
│   ├── world/
│   │   ├── DungeonGenerator.js ✅ (geração procedural)
│   │   ├── HubLevelGenerator.js ✅ (Fase 23 – mapa e POIs do HUB)
│   │   ├── MazeGenerator.js ✅ (legado, mantido para compatibilidade)
│   │   └── ...
│   └── ...
├── docs/
│   └── specs/ ✅ (toda documentação)
└── CONTEXT.md   # Arquitetura e padrões (este arquivo)
```

---

## Padrões de Código

### EventBus Pattern
- Usar EventBus para comunicação entre sistemas
- Eventos: `enemy:killed`, `player:levelup`, `xp:gained`, etc.

### Sistema Pattern
- Sistemas em `js/systems/` seguem padrão:
  - Constructor com `_setupEvents()`
  - Método `update(context)` chamado no Game loop
  - Eventos via EventBus

### Save/Load Pattern
- SaveSystem salva automaticamente em momentos chave
- Dados versionados (campo `version` no save, atual: versão 3)
- Validação de dados ao carregar
- Seeds são salvas e carregadas para reproduzibilidade

### Geração Procedural Pattern
- DungeonGenerator usa PRNG para geração determinística
- Seed pode ser número ou string (convertida para número)
- Mesma seed sempre gera mesmo layout
- Seed customizada pode ser configurada via menu
- Seed exibida na HUD para compartilhamento

---

## Testes Recomendados

Após implementar qualquer fase:
1. Testar funcionalidade básica
2. Verificar integração com sistemas existentes
3. Testar edge cases (null, undefined, valores extremos)
4. Verificar se não quebrou funcionalidades anteriores

---

## Dúvidas?

- **Status e próximas fases:** `docs/specs/README.md`
- **Detalhes de cada fase:** specs em `docs/specs/`
- **Padrões de spec:** `.cursor/rules/spec-format.mdc`
