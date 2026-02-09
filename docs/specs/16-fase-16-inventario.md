# Project Survivor - Fase 16: Sistema de Inventário

## Contexto

O jogo Project Survivor atualmente permite que o jogador coloque bombas sem limitação de quantidade total, apenas limitando o número de bombas simultâneas ativas (`maxBombs`). A **Fase 16** implementa um **sistema de inventário** que limita o número total de bombas disponíveis, criando tensão estratégica e forçando o jogador a gerenciar recursos com cuidado.

O jogador começa com **7 bombas** no inventário e deve usá-las estrategicamente. O inventário é exibido na parte inferior do canvas, sempre visível durante o jogo, mostrando a quantidade disponível e a tecla de atalho para uso.

## Objetivos desta Fase

1. **Implementar sistema de inventário** com bombas limitadas (7 iniciais)
2. **Exibir inventário visual** na parte inferior do canvas
3. **Adicionar suporte para tecla "B"** além de Espaço para colocar bombas
4. **Implementar feedback visual** quando tentar usar sem bombas disponíveis
5. **Criar estrutura extensível** para futuros itens no inventário

---

## Implementação da Fase 16

### Arquitetura

O sistema seguirá o padrão existente:
- Nova propriedade `bombInventory` no `Player.js` para rastrear bombas disponíveis
- Modificação em `PlayerControlBehavior.js` para verificar inventário antes de colocar bomba
- Nova entrada no `Input.js` para detectar a tecla "B"
- Novo método `drawInventory()` no `UIRenderer.js` para renderizar o inventário
- Feedback visual e sonoro quando tentar usar sem recursos

### Arquivos Críticos

**5 arquivos que precisam ser modificados:**

1. **`js/constants.js`** - Adicionar constantes do inventário
2. **`js/entities/Player.js`** - Adicionar propriedades de inventário
3. **`js/core/Input.js`** - Adicionar detecção da tecla "B"
4. **`js/behaviors/PlayerControlBehavior.js`** - Verificar inventário antes de colocar bomba
5. **`js/rendering/UIRenderer.js`** - Adicionar renderização do inventário

---

## Mudanças Detalhadas

### 1. `js/constants.js`

**Adicionar após linha 112 (após HUD_HEIGHT):**
```javascript
// Inventory System
export const INVENTORY_HEIGHT = 32;
export const PLAYER_START_BOMB_INVENTORY = 7;
export const PLAYER_MAX_BOMB_INVENTORY = 7;
```

### 2. `js/entities/Player.js`

**Adicionar propriedades no constructor (após linha 13):**
```javascript
// Inventory System
this.bombInventory = PLAYER_START_BOMB_INVENTORY;
this.maxBombInventory = PLAYER_MAX_BOMB_INVENTORY;
```

**Importar constantes no topo do arquivo:**
```javascript
import { PLAYER_SPEED, PLAYER_MAX_BOMBS, PLAYER_BOMB_RANGE, PLAYER_MAX_HP, PLAYER_START_HP, INVINCIBILITY_TIME_DAMAGE, PLAYER_DEFENSE_START, PLAYER_ATTACK_POWER_START, PLAYER_CRIT_CHANCE_START, PLAYER_START_BOMB_INVENTORY, PLAYER_MAX_BOMB_INVENTORY } from '../constants.js';
```

### 3. `js/core/Input.js`

**Adicionar 'KeyB' na lista de gameKeys (linha ~16):**
```javascript
const gameKeys = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF', 'KeyB',
    'KeyP', 'Escape', 'Enter', 'Backspace'
];
```

**Adicionar getter para tecla B (após linha 61):**
```javascript
get bombKey() { return this.wasPressed('KeyB'); }
```

### 4. `js/behaviors/PlayerControlBehavior.js`

**Modificar a lógica de colocar bomba (substituir linhas 44-63):**
```javascript
// Place bomb
if ((input.bomb || input.bombKey)) {
    // Verificar se tem bombas no inventário
    if (entity.bombInventory <= 0) {
        // Feedback: sem bombas disponíveis
        EventBus.emit('inventory:empty', { item: 'bomb' });
        // Tocar som de erro se disponível (pode ser implementado depois)
        return;
    }
    
    // Verificar limite de bombas simultâneas
    if (entity.activeBombs < entity.maxBombs) {
        const col = pixelToGridCol(entity.x);
        const row = pixelToGridRow(entity.y);
        const existing = entityManager.getByType('bomb').find(b => {
            return pixelToGridCol(b.x) === col && pixelToGridRow(b.y) === row;
        });
        if (!existing) {
            const bomb = new Bomb(
                gridToPixelX(col),
                gridToPixelY(row),
                entity.bombRange,
                entity
            );
            entityManager.add(bomb, 'bombs');
            entity.activeBombs++;
            entity.bombInventory--; // Decrementar inventário
            EventBus.emit('bomb:placed', { bomb });
            context.soundEngine.play('placeBomb');
        }
    }
}
```

### 5. `js/rendering/UIRenderer.js`

**Importar constantes no topo do arquivo:**
```javascript
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, HUD_HEIGHT, INVENTORY_HEIGHT,
    STATE_MENU, STATE_PLAYING, STATE_PAUSED, STATE_GAME_OVER,
    STATE_LEVEL_COMPLETE, STATE_HUB
} from '../constants.js';
```

**Adicionar novo método após `drawHUD()` (após linha 143):**
```javascript
drawInventory(ctx, { player }) {
    if (!player) return;
    
    const inventoryY = CANVAS_HEIGHT - INVENTORY_HEIGHT;
    
    // Background (painel apocalíptico)
    ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
    ctx.fillRect(0, inventoryY, CANVAS_WIDTH, INVENTORY_HEIGHT);
    
    // Borda desgastada
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, inventoryY, CANVAS_WIDTH, INVENTORY_HEIGHT);
    
    // Linha separadora superior
    ctx.fillStyle = '#444';
    ctx.fillRect(0, inventoryY, CANVAS_WIDTH, 2);
    
    // Rachaduras no painel (detalhe visual apocalíptico)
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, inventoryY + 5);
    ctx.lineTo(20, inventoryY + 8);
    ctx.moveTo(CANVAS_WIDTH - 20, inventoryY + 10);
    ctx.lineTo(CANVAS_WIDTH - 15, inventoryY + 15);
    ctx.stroke();
    
    const centerY = inventoryY + INVENTORY_HEIGHT / 2;
    
    // Ícone de bomba (círculo preto)
    const bombIconX = 10;
    const bombIconY = centerY;
    const bombIconSize = 16;
    const hasBombs = player.bombInventory > 0;
    
    // Círculo da bomba
    ctx.fillStyle = hasBombs ? '#222' : 'rgba(34, 34, 34, 0.5)';
    ctx.beginPath();
    ctx.arc(bombIconX + bombIconSize / 2, bombIconY, bombIconSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Borda do ícone
    ctx.strokeStyle = hasBombs ? '#666' : '#444';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Pavio da bomba (pequeno retângulo no topo)
    if (hasBombs) {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(bombIconX + bombIconSize / 2 - 2, bombIconY - bombIconSize / 2 - 2, 4, 4);
    }
    
    // Texto "Bombas:"
    ctx.fillStyle = '#d0d0a0';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Bombas:', 35, centerY);
    
    // Quantidade (com cor condicional)
    ctx.fillStyle = hasBombs ? '#d0d0a0' : '#ff4444';
    ctx.fillText(`${player.bombInventory} / ${player.maxBombInventory}`, 95, centerY);
    
    // Tecla de atalho
    ctx.fillStyle = '#8a8a6a';
    ctx.font = '12px monospace';
    ctx.fillText('[B]', 150, centerY);
}
```

**Modificar método `drawHUD()` para chamar o inventário (adicionar no final, antes do fechamento):**
```javascript
drawHUD(ctx, { level, player, score, seedString, canEscape }) {
    // ... código existente do HUD ...
    
    // Desenhar inventário após o HUD
    this.drawInventory(ctx, { player });
}
```

---

## Detalhes de Implementação

### Sistema de Inventário

O inventário rastreia bombas disponíveis separadamente de `activeBombs`:
- **`bombInventory`**: Quantidade de bombas disponíveis no inventário (decrementa ao usar)
- **`maxBombInventory`**: Capacidade máxima do inventário (7 inicialmente)
- **`activeBombs`**: Bombas simultâneas ativas no campo (limite de `maxBombs`)

### Validação de Uso

Antes de colocar uma bomba, o sistema verifica:
1. Se `bombInventory > 0` (tem bombas disponíveis)
2. Se `activeBombs < maxBombs` (não excedeu limite simultâneo)
3. Se não existe bomba na mesma posição

Se alguma condição falhar, a bomba não é colocada e um evento é emitido para feedback.

### Visual do Inventário

O inventário segue o estilo apocalíptico do jogo:
- **Background**: Preto semi-transparente com bordas enferrujadas
- **Ícone**: Círculo preto representando bomba, com pavio vermelho quando disponível
- **Texto**: Fonte monospace apocalíptica (`#d0d0a0`)
- **Feedback Visual**: Texto vermelho quando `bombInventory === 0`
- **Tecla de Atalho**: Exibição `[B]` para indicar tecla alternativa

### Posicionamento

O inventário é renderizado na parte inferior do canvas:
- **Altura**: 32px (`INVENTORY_HEIGHT`)
- **Posição Y**: `CANVAS_HEIGHT - INVENTORY_HEIGHT`
- **Largura**: `CANVAS_WIDTH` (largura total do canvas)

### Teclas Suportadas

- **Espaço**: Mantido para compatibilidade (tecla padrão existente)
- **B**: Nova tecla alternativa para colocar bomba

Ambas as teclas funcionam de forma idêntica e respeitam as mesmas validações.

### Eventos

**Novo evento emitido:**
- `inventory:empty`: Quando tenta usar item sem ter disponível
  - Payload: `{ item: 'bomb' }`
  - Pode ser usado para feedback visual futuro (animação, mensagem)

### Expansibilidade Futura

A estrutura está preparada para adicionar outros itens no futuro:
- Propriedades podem ser expandidas para um objeto `inventory` com múltiplos itens
- Método `drawInventory()` pode ser expandido para renderizar múltiplos slots
- Sistema de teclas pode ser configurável por item

**Nota**: Por enquanto, mantemos `bombInventory` como propriedade direta do Player para simplicidade. A estrutura modular pode ser implementada em fases futuras quando outros itens forem adicionados.

### Recuperação de Bombas

**Não implementado nesta fase**: A recuperação de bombas (ao completar dungeons, coletar drops, etc.) será definida em fases futuras. Esta fase implementa apenas o sistema base de inventário limitado.

---

## Status: ⏳ PENDENTE

Esta fase está especificada e pronta para implementação.
