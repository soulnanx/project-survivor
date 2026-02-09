# Project Survivor - Fase 17: Sprite Direcional do Player

## Contexto

Atualmente, o sprite do jogador possui apenas **olhos direcionais** que mudam de posição baseado na direção (`direction`), mas o sprite em si não reflete visualmente a direção que o jogador está olhando. O objetivo desta fase é fazer o sprite do jogador mudar visualmente de acordo com a direção, tornando mais claro para o jogador qual direção ele está enfrentando.

## Objetivos desta Fase

1. **Rotacionar o sprite completo** baseado na direção do jogador
2. **Ajustar posicionamento dos braços e pernas** para cada direção
3. **Manter animações de caminhada** funcionando corretamente em todas as direções
4. **Garantir que olhos direcionais** continuem funcionando após a rotação

---

## Arquitetura - Componentes Afetados

### 1. Renderização do Player
**Arquivo principal:**
- `js/rendering/EntityRenderer.js` - método `drawPlayer()`

**Arquivos relacionados:**
- `js/entities/Player.js` - propriedade `direction` (já existe)
- `js/behaviors/PlayerControlBehavior.js` - atualização de `direction` (já existe)

---

## Implementação Detalhada

### Fase 17: Sprite Direcional do Player

#### 17.1 Rotação do Sprite Baseada na Direção

**Objetivo:** Rotacionar todo o sprite do jogador para que ele "olhe" na direção correta.

**Estratégia:**
- Usar `ctx.rotate()` para rotacionar o contexto antes de desenhar o sprite
- Rotacionar em incrementos de 90 graus (π/2 radianos) para cada direção:
  - `'up'`: -90° (-π/2)
  - `'down'`: +90° (π/2)
  - `'left'`: 180° (π)
  - `'right'`: 0° (padrão)

**Detalhes de implementação (`js/rendering/EntityRenderer.js` - método `drawPlayer`):**

```javascript
drawPlayer(ctx, player) {
    if (!player || !player.alive) return;

    const { x, y, direction, animTimer, invincible, invincibleTimer, moving } = player;

    // Blink when invincible
    if (invincible && Math.floor(invincibleTimer * 10) % 2 === 0) return;

    const size = TILE_SIZE * 0.7;
    const half = size / 2;
    const headRadius = size * 0.25;
    const bodyHeight = size * 0.5;
    const bodyWidth = size * 0.4;

    ctx.save();
    ctx.translate(x, y);

    // Rotação baseada na direção
    let rotation = 0;
    switch (direction) {
        case 'up': rotation = -Math.PI / 2; break;
        case 'down': rotation = Math.PI / 2; break;
        case 'left': rotation = Math.PI; break;
        case 'right': rotation = 0; break;
    }
    ctx.rotate(rotation);

    // Animação de caminhada
    const walkOffset = moving ? Math.sin(animTimer * 12) * 2 : 0;
    const armSwing = moving ? Math.sin(animTimer * 12) * 8 : 0;
    const legOffset = moving ? Math.sin(animTimer * 12) * 4 : 0;

    // CORPO (torso) - Camisa azul
    ctx.fillStyle = '#2a5a8a';
    this._roundRect(ctx, -bodyWidth/2, -bodyHeight/2 + headRadius, bodyWidth, bodyHeight, 4);

    // CABEÇA - Pele
    ctx.fillStyle = '#fdbcb4';
    ctx.beginPath();
    ctx.arc(0, -half + headRadius, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo
    ctx.fillStyle = '#4a2a1a';
    ctx.beginPath();
    ctx.arc(0, -half + headRadius - 2, headRadius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Olhos (direcionais) - Agora sempre olhando "para frente" após rotação
    const eyeSize = 3;
    // Após rotação, os olhos sempre olham para "cima" no sistema de coordenadas local
    // (que corresponde à direção do movimento após a rotação)
    let eyeDx = 0, eyeDy = -1; // Sempre olhando para frente após rotação

    // Branco dos olhos
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4 + eyeDx, -half + headRadius - 2 + eyeDy, eyeSize, 0, Math.PI * 2);
    ctx.arc(4 + eyeDx, -half + headRadius - 2 + eyeDy, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Pupilas
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-4 + eyeDx * 1.5, -half + headRadius - 2 + eyeDy, eyeSize - 1, 0, Math.PI * 2);
    ctx.arc(4 + eyeDx * 1.5, -half + headRadius - 2 + eyeDy, eyeSize - 1, 0, Math.PI * 2);
    ctx.fill();

    // BRAÇOS (animados) - Pele
    ctx.fillStyle = '#fdbcb4';
    const armY = -bodyHeight/2 + headRadius + 8;
    // Braço esquerdo
    ctx.fillRect(-bodyWidth/2 - 4, armY + armSwing, 4, 12);
    // Braço direito
    ctx.fillRect(bodyWidth/2, armY - armSwing, 4, 12);

    // PERNAS (animadas alternadamente) - Calça azul escura
    ctx.fillStyle = '#1a3a5a';
    const legY = bodyHeight/2 + headRadius;
    // Perna esquerda
    ctx.fillRect(-bodyWidth/2 + 2, legY, 6, 10 + legOffset);
    // Perna direita
    ctx.fillRect(bodyWidth/2 - 8, legY, 6, 10 - legOffset);

    // PÉS - Sapatos pretos
    ctx.fillStyle = '#333';
    ctx.fillRect(-bodyWidth/2 + 1, legY + 10 + legOffset, 8, 3);
    ctx.fillRect(bodyWidth/2 - 9, legY + 10 - legOffset, 8, 3);

    ctx.restore();
}
```

**Mudanças principais:**
1. Adicionar `ctx.rotate(rotation)` após `ctx.translate(x, y)`
2. Calcular `rotation` baseado na `direction` do player
3. Simplificar lógica dos olhos direcionais (após rotação, sempre olham "para frente")

---

#### 17.2 Ajustes de Animação por Direção

**Objetivo:** Garantir que as animações de braços e pernas funcionem corretamente em todas as direções.

**Considerações:**
- A rotação do contexto já resolve a maioria dos problemas de direção
- As animações de `armSwing` e `legOffset` continuam funcionando normalmente
- O `walkOffset` pode ser removido se não for necessário após a rotação

**Nota:** Com a rotação do contexto, as animações existentes devem funcionar automaticamente em todas as direções, pois o sistema de coordenadas local é rotacionado junto com o sprite.

---

#### 17.3 Testes e Validação

**Checklist de testes:**
- [ ] Sprite rotaciona corretamente quando o jogador muda de direção
- [ ] Animação de caminhada funciona em todas as direções (up, down, left, right)
- [ ] Olhos sempre olham na direção do movimento após rotação
- [ ] Braços e pernas animam corretamente em todas as direções
- [ ] Sprite não fica distorcido ou mal posicionado após rotação
- [ ] Sistema de invencibilidade (blink) continua funcionando
- [ ] Performance não é afetada pela rotação

---

## Considerações de Implementação

### Performance
- A rotação do contexto é uma operação simples e eficiente
- Não há impacto significativo na performance
- As animações continuam sendo calculadas da mesma forma

### Compatibilidade
- Mantém todas as propriedades existentes (`direction`, `animTimer`, `moving`, etc.)
- Não requer mudanças nas entidades (`Player.js`)
- Não requer mudanças no comportamento (`PlayerControlBehavior.js`)
- Sistema de invencibilidade e outras funcionalidades permanecem funcionais

### Visual
- O sprite agora reflete claramente a direção do jogador
- Melhora a experiência do jogador ao tornar mais fácil identificar a direção
- Mantém consistência visual com o tema do jogo

---

## Alternativas Consideradas

### Alternativa 1: Sprites Separados por Direção
- **Vantagem:** Controle total sobre cada direção
- **Desvantagem:** Mais código, mais manutenção, menos eficiente
- **Decisão:** Não usar - rotação é mais simples e eficiente

### Alternativa 2: Espelhamento Horizontal/Vertical
- **Vantagem:** Mais simples que rotação completa
- **Desvantagem:** Não funciona bem para todas as direções (up/down)
- **Decisão:** Não usar - rotação completa é mais consistente

### Alternativa 3: Rotação do Contexto (Escolhida)
- **Vantagem:** Simples, eficiente, funciona para todas as direções
- **Desvantagem:** Requer ajuste na lógica dos olhos direcionais
- **Decisão:** Usar - melhor solução para o caso de uso

---

## Status: ⬜ PENDENTE

Esta fase está pronta para implementação. A mudança é relativamente simples e melhora significativamente a clareza visual do jogo, tornando mais fácil para o jogador identificar a direção que seu personagem está enfrentando.

**Nota:** A implementação inicial com rotação simples não funcionou como esperado. É necessário revisar a abordagem para fazer o sprite mudar visualmente de forma mais adequada.
