# Contexto do Projeto - Project Survivor

## Status Atual

**Última atualização:** Fase 12 - Sprite Integration (Player + Enemies) - 2026-02-09

### Fases Implementadas ✅

- ✅ **Fase 1**: Sistema de HP do Player (20 HP, dano gradual, morte permanente)
- ✅ **Fase 2**: Sistema de HP dos Inimigos (Wanderer: 1, Chaser: 2, Smart: 3)
- ✅ **Fase 3**: Sistema de XP e Levels (ExperienceSystem completo)
- ✅ **Fase 4**: Power-up de Cura (visual e funcional)
- ✅ **Fase 5**: UI de RPG (HP bar, XP bar, level display)
- ✅ **Fase 6**: Novos Sons (levelUp, playerHit, enemyHit, enemyKilled)
- ✅ **Fase 7**: Novos Efeitos de Partículas (levelUp, XPGain)
- ✅ **Fase 8**: Sistema de Save/Load (localStorage, Continue Game)
- ✅ **Fase 9**: Mais Stats RPG (defense, attackPower, critChance)
- ✅ **Fase 10**: Geração Procedural de Dungeons (seed-based generation)
- ✅ **Fase 11**: Reestruturação Survivor (HUB, escape, permadeath, remoção de power-ups)
- ✅ **Fase 12**: Integração de Sprites LPC (Player + Enemies com fallback procedural)
- ✅ **Fase 14**: Tema Apocalíptico (backgrounds, explosions, UI redesign)

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

---

## Documentação

Toda a documentação está em `docs/specs/`:

- `README.md` - Índice geral
- `01-fase-1-player-hp-system.md` - Fase 1
- `02-fase-2-enemy-hp-system.md` - Fase 2
- `03-fase-3-7-completar-sistema-rpg.md` - Fases 3-7
- `08-fase-8-save-load-system.md` - Fase 8

---

## Nova Fase: Bomberman Survivor (Permadeath)

O jogo está evoluindo para um **survival game com permadeath** inspirado em Project Zomboid.
Spec completa: `docs/specs/11-nova-fase-survivor-system.md`

### Mudanças Fundamentais
- **Sem vitória:** Sobrevivência infinita, não existe "zerar"
- **Permadeath:** Morte = perde tudo, personagem deletado
- **HUB entre dungeons:** Zona segura para preparação
- **Escape:** Jogador pode fugir da dungeon voltando à entrada
- **Save agressivo:** Salva ao tomar dano e ao completar dungeon (anti-save-scum)
- **Cura por recurso:** HP só recupera com itens (drops ou loja)
- **Sem power-ups clássicos:** Drops são ouro, equipamentos e poções
- **Inventário limitado:** Slots finitos, trade-off entre itens

### Fases Planejadas
- ✅ **Fase 11**: Reestruturação do Fluxo (HUB, escape, permadeath) - COMPLETA
- ✅ **Fase 12**: Integração de Sprites LPC (Player humano, Inimigos zumbis) - COMPLETA
- ✅ **Fase 13**: Renomeação do Jogo para Project Survivor - COMPLETA
- ✅ **Fase 14**: Transformação do Cenário Apocalíptico (backgrounds, explosions, UI) - 80% COMPLETA
- ⬜ **Fase 15**: Save System v4 (save no dano, delete na morte) - PRIORIDADE ALTA
- ⬜ **Fase 16**: Sistema de Knockback e Drops - PRIORIDADE ALTA
- ⬜ **Fase 17**: Inventário e Sistema de Equipamentos - PRIORIDADE MÉDIA
- ⬜ **Fase 18**: Variedade de Dungeons (tipos, tiers, modificadores) - PRIORIDADE MÉDIA
- ⬜ **Fase 19**: Loja no HUB - PRIORIDADE BAIXA
- ⬜ **Fase 20+**: Polish e Expansão

---

## Como Continuar o Desenvolvimento

### Para uma nova sessão do Cursor:

1. **Ler este arquivo** (`CONTEXT.md`) para entender o estado atual

2. **Revisar a documentação:**
   ```bash
   cat docs/specs/README.md
   ```

3. **Verificar o último commit:**
   ```bash
   git log --oneline -1
   ```

4. **Escolher uma fase** das sugeridas acima

5. **Criar um plano detalhado** usando:
   - A estrutura dos planos anteriores em `docs/specs/`
   - O padrão de implementação já estabelecido

6. **Implementar seguindo o padrão:**
   - Criar/modificar arquivos conforme necessário
   - Manter consistência com código existente
   - Adicionar documentação em `docs/specs/`
   - Fazer commit descritivo

### Exemplo de prompt para nova sessão:

```
Olá! Estou continuando o desenvolvimento do Bomberman RPG.

Contexto:
- Já implementamos as Fases 1-10 (HP system, XP/Level, Save/Load, Stats RPG, Geração Procedural)
- Toda documentação está em docs/specs/
- Último commit: cb4acea

Quero implementar a [FASE X] conforme descrito em CONTEXT.md.

Por favor:
1. Leia CONTEXT.md e docs/specs/README.md
2. Crie um plano detalhado para a Fase X
3. Implemente seguindo o padrão das fases anteriores
4. Atualize a documentação
```

---

## Estrutura do Projeto

```
bomberman/
├── js/
│   ├── systems/
│   │   ├── ExperienceSystem.js ✅
│   │   ├── SaveSystem.js ✅
│   │   ├── CollisionSystem.js ✅
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
│   │   ├── MazeGenerator.js ✅ (legado, mantido para compatibilidade)
│   │   └── ...
│   └── ...
├── docs/
│   └── specs/ ✅ (toda documentação)
└── CONTEXT.md ✅ (este arquivo)
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

- Consulte `docs/specs/` para detalhes de cada fase
- Veja código das fases anteriores como referência
- Mantenha consistência com padrões estabelecidos
