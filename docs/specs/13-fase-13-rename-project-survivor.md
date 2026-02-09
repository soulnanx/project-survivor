# Project Survivor - Renomeação do Jogo

## Contexto
O jogo atualmente se chama "Bomberman RPG" ou "Bomberman Survivor" em vários lugares do código e documentação. Com a evolução do projeto para um survival game com tema zombie/survivor, faz sentido renomear o jogo para **"Project Survivor"**, alinhando melhor com a identidade visual e temática atual.

Esta fase consiste em atualizar todas as referências ao nome antigo do jogo para o novo nome "Project Survivor" em:
- Títulos e cabeçalhos de arquivos
- Textos exibidos na UI do jogo
- Chaves de localStorage
- Documentação e comentários
- Referências em código

---

## Arquitetura - Arquivos Afetados

### 1. Arquivos de Interface e UI
**Arquivos:**
- `index.html` - Título da página HTML
- `js/rendering/UIRenderer.js` - Texto exibido no menu principal

### 2. Arquivos de Documentação
**Arquivos:**
- `README.md` - Título e descrição principal
- `CONTEXT.md` - Título e referências ao projeto
- `docs/specs/README.md` - Título e referências
- Todos os arquivos de spec em `docs/specs/` que mencionam "Bomberman"

### 3. Arquivos de Sistema (localStorage)
**Arquivos:**
- `js/systems/SaveSystem.js` - Chave de save (`bomberman_save`)
- `js/systems/ScoreSystem.js` - Chave de high scores (`bomberman_highscores`)

### 4. Comentários e Referências em Código
**Arquivos:**
- `js/world/DungeonGenerator.js` - Comentários sobre padrão Bomberman
- `js/world/MazeGenerator.js` - Comentários sobre padrão Bomberman
- `js/behaviors/PlayerControlBehavior.js` - Comentário sobre movimento Bomberman

---

## Implementação Detalhada

### Fase 13: Renomeação para Project Survivor

#### 13.1 Título da Página HTML (`index.html`)

**Linha 6:**
```html
<!-- ANTES -->
<title>Bomberman</title>

<!-- DEPOIS -->
<title>Project Survivor</title>
```

---

#### 13.2 UI do Menu Principal (`js/rendering/UIRenderer.js`)

**Linha 139:**
```javascript
// ANTES
ctx.fillText('BOMBERMAN', CANVAS_WIDTH / 2, 100);

// DEPOIS
ctx.fillText('PROJECT SURVIVOR', CANVAS_WIDTH / 2, 100);
```

**Linha 144 (opcional - pode manter ou atualizar):**
```javascript
// ANTES
ctx.fillText('Browser Edition', CANVAS_WIDTH / 2, 140);

// DEPOIS (opcional)
ctx.fillText('Survival Edition', CANVAS_WIDTH / 2, 140);
```

---

#### 13.3 Chaves de localStorage

**`js/systems/SaveSystem.js` - Linha 3:**
```javascript
// ANTES
this.SAVE_KEY = 'bomberman_save';

// DEPOIS
this.SAVE_KEY = 'project_survivor_save';
```

**`js/systems/ScoreSystem.js` - Linha 4:**
```javascript
// ANTES
const HIGH_SCORE_KEY = 'bomberman_highscores';

// DEPOIS
const HIGH_SCORE_KEY = 'project_survivor_highscores';
```

**Nota:** Mudar as chaves de localStorage fará com que saves antigos não sejam mais carregados. Isso é aceitável, mas pode ser documentado como breaking change.

---

#### 13.4 Documentação Principal

**`README.md` - Linha 1:**
```markdown
<!-- ANTES -->
# Bomberman RPG

<!-- DEPOIS -->
# Project Survivor
```

**`README.md` - Linha 3:**
```markdown
<!-- ANTES -->
Jogo Bomberman estilo RPG/Roguelike desenvolvido em JavaScript vanilla.

<!-- DEPOIS -->
Jogo de survival estilo RPG/Roguelike desenvolvido em JavaScript vanilla.
```

**`README.md` - Linha 40:**
```markdown
<!-- ANTES -->
Olá! Estou continuando o desenvolvimento do Bomberman RPG.

<!-- DEPOIS -->
Olá! Estou continuando o desenvolvimento do Project Survivor.
```

**`README.md` - Linha 49:**
```markdown
<!-- ANTES -->
bomberman/

<!-- DEPOIS -->
project-survivor/
```

---

**`CONTEXT.md` - Linha 1:**
```markdown
<!-- ANTES -->
# Contexto do Projeto - Bomberman RPG

<!-- DEPOIS -->
# Contexto do Projeto - Project Survivor
```

---

#### 13.5 Documentação de Specs

**`docs/specs/README.md` - Linha 1:**
```markdown
<!-- ANTES -->
# Especificações e Planos do Projeto Bomberman RPG

<!-- DEPOIS -->
# Especificações e Planos do Projeto Project Survivor
```

**`docs/specs/README.md` - Linha 25:**
```markdown
<!-- ANTES -->
## Nova Fase: Bomberman Survivor

<!-- DEPOIS -->
## Nova Fase: Project Survivor
```

**`docs/specs/README.md` - Linha 27:**
```markdown
<!-- ANTES -->
O jogo está evoluindo para um **survival game com permadeath** inspirado em Project Zomboid:

<!-- DEPOIS -->
O jogo é um **survival game com permadeath** inspirado em Project Zomboid:
```

---

#### 13.6 Arquivos de Spec Individuais

Atualizar títulos e referências nos seguintes arquivos:

**`docs/specs/01-fase-1-player-hp-system.md`:**
- Linha 1: `# Bomberman RPG - Sistema de HP, XP e Progressão` → `# Project Survivor - Sistema de HP, XP e Progressão`
- Linha 4: `O jogo Bomberman atual...` → `O jogo atual...`

**`docs/specs/02-fase-2-enemy-hp-system.md`:**
- Linha 1: `# Bomberman RPG - Fase 2: Enemy HP System` → `# Project Survivor - Fase 2: Enemy HP System`
- Linha 5: `O jogo Bomberman está sendo transformado...` → `O jogo está sendo transformado...`

**`docs/specs/03-fase-3-7-completar-sistema-rpg.md`:**
- Linha 1: `# Bomberman RPG - Fases 3-7: Completar Sistema RPG` → `# Project Survivor - Fases 3-7: Completar Sistema RPG`

**`docs/specs/08-fase-8-save-load-system.md`:**
- Linha 1: `# Bomberman RPG - Fase 8: Sistema de Save/Load` → `# Project Survivor - Fase 8: Sistema de Save/Load`

**`docs/specs/11-nova-fase-survivor-system.md`:**
- Linha 1: `# Fase 11+: Bomberman Survivor - Reestruturação para Permadeath` → `# Fase 11+: Project Survivor - Reestruturação para Permadeath`
- Linha 64: `│   DUNGEON    │  Gameplay bomberman (já existente)` → `│   DUNGEON    │  Gameplay survival (já existente)`
- Linha 306: `- Gameplay core (bomberman + inimigos + bombas)` → `- Gameplay core (survival + inimigos + bombas)`

**`docs/specs/12-fase-12-sprite-redesign.md`:**
- Linha 1: `# Bomberman RPG - Redesign de Sprites dos Personagens` → `# Project Survivor - Redesign de Sprites dos Personagens`

---

#### 13.7 Comentários em Código (Opcional)

**`js/world/DungeonGenerator.js` - Linha 37:**
```javascript
// ANTES
// 2. Pilares fixos (padrão Bomberman)

// DEPOIS
// 2. Pilares fixos (padrão clássico)
```

**`js/world/DungeonGenerator.js` - Linha 73:**
```javascript
// ANTES
// Fixed pillars at even positions (classic Bomberman pattern)

// DEPOIS
// Fixed pillars at even positions (classic survival pattern)
```

**`js/world/MazeGenerator.js` - Linha 19:**
```javascript
// ANTES
// 2. Fixed pillars at even positions (classic Bomberman pattern)

// DEPOIS
// 2. Fixed pillars at even positions (classic survival pattern)
```

**`js/behaviors/PlayerControlBehavior.js` - Linha 17:**
```javascript
// ANTES
// Only allow one axis at a time (classic Bomberman)

// DEPOIS
// Only allow one axis at a time (classic survival movement)
```

---

## Considerações Importantes

### Breaking Changes

1. **localStorage Keys:**
   - Mudar as chaves de `bomberman_save` e `bomberman_highscores` fará com que saves antigos não sejam mais carregados
   - Isso é intencional e alinhado com a nova identidade do jogo
   - Usuários precisarão começar uma nova run após a atualização

2. **Estrutura de Pastas:**
   - O nome da pasta `bomberman/` pode ser mantido ou renomeado para `project-survivor/`
   - Se renomear a pasta, atualizar referências em documentação

### Compatibilidade

- Não há impacto na funcionalidade do jogo
- Apenas mudanças cosméticas e de nomenclatura
- Código permanece funcionalmente idêntico

### Testes

Após a implementação, verificar:
- ✅ Título da página HTML aparece como "Project Survivor"
- ✅ Menu principal exibe "PROJECT SURVIVOR"
- ✅ Save system funciona com nova chave
- ✅ High scores funcionam com nova chave
- ✅ Documentação está consistente

---

## Status: ✅ IMPLEMENTADO

Esta fase foi completamente implementada. Todas as referências ao nome antigo foram atualizadas para "Project Survivor" em:
- ✅ Título HTML e UI do menu
- ✅ Chaves de localStorage (SaveSystem e ScoreSystem)
- ✅ Documentação principal (README.md e CONTEXT.md)
- ✅ Documentação de specs (README.md e todos os arquivos individuais)
- ✅ Comentários em código

**Nota:** As chaves de localStorage foram alteradas, então saves antigos não serão mais carregados. Isso é intencional e alinhado com a nova identidade do jogo.
