# Project Survivor - Redesign de Sprites dos Personagens

## Contexto
O jogo atualmente usa sprites procedurais simples desenhados via Canvas:
- **Player**: Retângulo arredondado azul com olhos e pés animados
- **Inimigos**: Formato de "fantasma" com cúpula superior e parte inferior ondulada

O objetivo é melhorar a identidade visual dos personagens para alinhar com o tema de **survival/zombie** do jogo:
- **Player**: Aparência mais humana e reconhecível
- **Inimigos**: Visual mais parecido com zumbis, mantendo a distinção entre tipos

## ATUALIZAÇÃO: Sprites de Imagem Disponíveis

Após investigação, foi descoberto que o projeto **já possui assets sprite prontos** em `/assets/sprites/char/standard/`:

### Estrutura de Assets Disponíveis
```
bomberman/assets/sprites/char/
├── standard/
│   ├── walk/
│   │   ├── down/        (9 frames de caminhada)
│   │   ├── left/        (9 frames de caminhada)
│   │   ├── right/       (9 frames de caminhada)
│   │   └── up/          (9 frames de caminhada)
│   ├── idle/            (idle animation em todas as direções)
│   ├── run/             (run animation em todas as direções)
│   ├── slash/           (ataque com arma)
│   ├── 1h_slash/        (ataque corpo-a-corpo)
│   └── ... outros
├── character.json       (metadados das animações)
└── credits/             (créditos dos assets)
```

### Características dos Sprites
- **Personagem**: Personagem humano LPC (Liberated Pixel Cup) padrão
  - Corpo e roupas customizáveis
  - Cabeça humana realista
  - Pele, cabelo, barba, roupas detalhados
  - Animações suaves e detalhadas
- **Animações**: 18+ conjuntos de animações prontas
- **Direções**: 4 direções (up, down, left, right) para cada animação
- **Frames**: 9 frames por animação (bom para smoothness)
- **Licença**: Open Game Art (OGA-BY 3.0), CC-BY-SA 3.0, GPL 3.0
- **Créditos**: Attributions disponíveis em character.json

### Nova Abordagem
Em vez de desenhar sprites procedurais, a Fase 12 agora será sobre:
1. **Integração de Imagens PNG**: Carregar os sprites prontos em vez de desenhar Canvas
2. **Sistema de Animação**: Implementar loop de frames baseado na direção e movimento
3. **Compatibilidade**: Manter a mesma interface das entidades (direction, animTimer, moving)
4. **Zumbis**: Considerar customização de colors/filtros ou criar novos assets customizados

---

## Arquitetura - Componentes Afetados

### 1. Renderização de Personagens
**Arquivo principal:**
- `js/rendering/EntityRenderer.js` - métodos `drawPlayer()` e `drawEnemy()`

**Arquivos relacionados:**
- `js/constants.js` - possíveis ajustes de cores para melhor contraste
- `js/entities/Player.js` - propriedades de animação (já existem)
- `js/entities/Enemy.js` - propriedades de animação (já existem)

---

## Implementação Detalhada

### Fase 12: Integração de Sprites de Imagem

#### 12.1 Sistema de Carregamento de Sprites (Player)

**Objetivo:** Carregar e renderizar sprites de imagem PNG do player em vez de desenho procedural.

**Assets a usar:**
- `assets/sprites/char/standard/walk/down/1-9.png` (caminhada para baixo)
- `assets/sprites/char/standard/walk/up/1-9.png` (caminhada para cima)
- `assets/sprites/char/standard/walk/left/1-9.png` (caminhada para esquerda)
- `assets/sprites/char/standard/walk/right/1-9.png` (caminhada para direita)
- Opcionalmente: `idle/`, `run/` para estados adicionais

**Estrutura de implementação:**

1. **Sistema de Carregamento de Imagens**
   - Pré-carregar todos os frames durante inicialização
   - Armazenar em cache para evitar recarregar a cada frame
   - Implementar fallback para sprites procedurais caso images falhem

2. **Sistema de Animação por Direção**
   ```javascript
   // Estrutura esperada
   const spriteFrames = {
     'down': [img1, img2, img3, ...],  // 9 frames
     'up': [img1, img2, img3, ...],
     'left': [img1, img2, img3, ...],
     'right': [img1, img2, img3, ...]
   };
   ```

3. **Modificações em EntityRenderer.js - método `drawPlayer`:**
   - Remover lógica de desenho procedural
   - Adicionar seleção de direção para escolher array de frames correto
   - Calcular frame atual baseado em `animTimer` e número total de frames
   - Renderizar imagem no canvas no lugar correto

**Pseudocódigo:**
```javascript
drawPlayer(ctx, player) {
    if (!player || !player.alive) return;

    const { x, y, direction, animTimer, invincible, moving } = player;

    // Blink when invincible
    if (invincible && Math.floor(invincibleTimer * 10) % 2 === 0) return;

    // Selecionar array de frames baseado na direção
    const frames = this.spriteFrames[direction] || this.spriteFrames['down'];

    // Calcular frame baseado em animTimer
    const totalFrames = frames.length;
    const frameIndex = moving
        ? Math.floor((animTimer * 10) % totalFrames)  // Mais rápido quando movendo
        : 0;  // Frame 0 quando parado (idle)

    const currentFrame = frames[frameIndex];

    if (currentFrame) {
        // Renderizar imagem do sprite
        const spriteSize = TILE_SIZE * 0.9;
        ctx.drawImage(
            currentFrame,
            x - spriteSize/2,
            y - spriteSize/2,
            spriteSize,
            spriteSize
        );
    }
}
```

**Integração com Game.js:**
- Método de inicialização: `loadPlayerSprites()`
- Carregamento assíncrono das imagens
- Fallback para sprites procedurais se falhar

**Melhorias visuais:**
- Sprite realista de personagem humano
- Animações suaves com 9 frames por direção
- Muito melhor alinhamento com tema survival
- Consistência com asset style LPC padrão

---

#### 12.2 Sprites dos Inimigos (Zumbis) - Duas Opções

**Objetivo:** Transformar os inimigos em zumbis reconhecíveis, mantendo distinção visual entre tipos.

**⚠️ NOTA:** O projeto atual não possui assets de sprites de zumbis. As opções abaixo podem ser consideradas:

##### Opção A: Manter Sprites Procedurais para Zumbis (Recomendado para Fase 12)

Continuar usando desenho procedural para zumbis, mas com melhorias visuais:

**Estrutura visual comum:**
- **Cabeça**: Oval alongado, pele esverdeada/cinza
- **Corpo**: Torso desgastado, roupas rasgadas
- **Braços**: Estendidos para frente (postura de zumbi)
- **Pernas**: Movimento arrastado, animação mais lenta
- **Detalhes**: Feridas visíveis, olhos vermelhos/amarelados

**Variações por tipo:**
- **Wanderer**: Zumbi básico, mais lento, cor esverdeada
- **Chaser**: Zumbi mais agressivo, cor avermelhada, braços mais estendidos
- **Smart**: Zumbi mais inteligente, cor roxa/escura, postura mais ereta

**Implementação em EntityRenderer.js - método `drawEnemy`:**

O código procedural descrito no spec anterior permanece válido, pois já foi implementado na Fase 14 (Redesign de Zumbis). Essa implementação já fornece:
- ✅ Cores diferenciadas por tipo
- ✅ Postura característica (braços estendidos)
- ✅ Detalhes de deterioração (feridas, roupas rasgadas)
- ✅ Olhos brilhantes e ameaçadores
- ✅ Animação lenta e arrastada
- ✅ Flash branco ao ser atingido

**Status**: Zumbis já estão redesenhados proceduralmente desde Fase 14.

##### Opção B: Criar Sprites Customizados de Zumbis (Futuro)

Para fases futuras, considerar:
1. Modificar o gerador LPC para criar variações de zumbis
2. Aplicar filtros de cor e efeitos ao sprite base
3. Criar custom spritesheets de zumbis
4. Usar um gerador de sprites similar ao LPC para zumbis

**Impacto**: Requer criação de novos assets, recomendado para Fase 20+ (Polish)

##### Opção C: Usar Filtros de Imagem (Alternativo)

Carregar sprites humanos e aplicar efeitos CSS/Canvas:
- Hue shift para cores zumbi
- Desaturação ou saturação específica
- Overlay de feridas/sangue
- Distorção de transparência

**Impacto**: Rápido de implementar mas menos imersivo

---

**Recomendação para Fase 12:**
Focar na integração dos sprites do player (Opção A - 12.1). Os zumbis já estão visualmente adequados desde Fase 14.

---

#### 12.3 Configurações de Tamanho e Escala

**Arquivo:** `js/constants.js`

Pode ser necessário ajustar a escala dos sprites para melhor integração:

```javascript
// Sprite scaling
export const PLAYER_SPRITE_SCALE = 0.9;  // Ajustar conforme necessário
export const PLAYER_SPRITE_OFFSET_X = 0;  // Offset horizontal
export const PLAYER_SPRITE_OFFSET_Y = 0;  // Offset vertical

// Animation speeds
export const PLAYER_WALK_FRAME_RATE = 10;  // Frames por segundo
export const PLAYER_IDLE_FRAME = 0;        // Frame usado quando parado
```

---

## Considerações de Implementação

### Performance
- **Carregamento**: Pré-carregar todas as imagens durante inicialização
- **Cache**: Armazenar imagens em memória para evitar recarregar
- **Fallback**: Implementar fallback para sprites procedurais se carregamento falhar
- **Impacto**: Mínimo - imagens são cachadas, sem overhead significativo

### Compatibilidade
- **Propriedades**: Mantém todas as propriedades existentes (`direction`, `animTimer`, `moving`, etc.)
- **Entidades**: Nenhuma mudança necessária em `Player.js`, `Enemy.js`
- **Sistemas**: Sistema de invencibilidade, hit flash, HP bar permanecem funcionais
- **Licenças**: Assets estão sob múltiplas licenças open source - documentar créditos

### Testes
- Verificar carregamento de imagens (sucesso e fallback)
- Testar animações em todas as 4 direções
- Validar transição entre frames suave (9 frames de walk)
- Testar em diferentes backgrounds (ruínas, metrô, etc.)
- Verificar scaling correto do sprite
- Testar invencibilidade/blink com imagens
- Validar HP bar sobre o sprite

### Arquivos de Asset
- **Localização**: `bomberman/assets/sprites/char/standard/walk/`
- **Estrutura**: 4 pastas (up, down, left, right), cada uma com 9 frames (1.png - 9.png)
- **Tamanho**: Verificar dimensões dos PNGs (provavelmente 64x64 ou similar)
- **Créditos**: Documento `character.json` contém atribuições completas

---

## Arquivos Afetados

### Arquivos a Modificar
- `js/rendering/EntityRenderer.js` - Método `drawPlayer()`, novo sistema de animação
- `js/core/Game.js` - Método `loadPlayerSprites()` para carregamento assíncrono
- Possível: `js/constants.js` - Configurações de escala/offset

### Arquivos Que NÃO Precisam Mudar
- `js/entities/Player.js` - Nenhuma mudança
- `js/entities/Enemy.js` - Nenhuma mudança
- Sistema de colisão, movimento, HP - Nenhuma mudança

---

## Status: ⬜ PENDENTE

Esta fase agora fará a integração dos sprites LPC prontos do projeto, substituindo o desenho procedural do player por imagens PNG. Os zumbis permanecerão procedurais (já redesenhados na Fase 14) ou podem ser atualizados em fases futuras.

### Checklist de Implementação
- [ ] Criar sistema de carregamento de imagens em Game.js
- [ ] Implementar novo método drawPlayer() em EntityRenderer.js
- [ ] Testar carregamento de sprites em todas as direções
- [ ] Validar animações de walk em gameplay
- [ ] Verificar fallback para sprite procedural se imagens falharem
- [ ] Testar em diferentes layouts de dungeon
- [ ] Documentar créditos dos assets
- [ ] Validar performance (FPS estável)
