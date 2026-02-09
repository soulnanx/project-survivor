# Fase 17: Sistema de Rage dos Zumbis

## Crítica da Feature Proposta Original

### Problemas Identificados

1. **Tempo fixo de 10 segundos para chegar**
   - ❌ Zumbis podem estar muito longe ou muito perto da explosão
   - ❌ Zumbis que já estão no local não têm comportamento definido
   - ❌ Não considera diferentes tipos de zumbis (wanderer, chaser, smart) com diferentes capacidades de pathfinding
   
   **💡 Sugestões:**
   - **Tempo dinâmico baseado em distância**: Calcular tempo máximo baseado na distância Manhattan até a explosão. Ex: `tempoMax = min(10s, distância * 0.5s)`. Zumbis próximos têm menos tempo, zumbis distantes têm até 10s.
   - **Tempo mínimo garantido**: Mesmo zumbis muito próximos têm pelo menos 2-3 segundos de movimento para criar impacto visual.
   - **Diferentes tempos por tipo**: `smart` zumbis podem ter +2s (são mais eficientes), `wanderer` podem ter -1s (são mais lentos).
   - **Zumbi já no local**: Se distância < 0.5 tiles, entra direto na fase de pausa (3s) sem movimento.

2. **"Ficar parados por 3 segundos quando chegar"**
   - ❌ O que significa "chegar"? Dentro de 1 tile? Exatamente no centro?
   - ❌ Se múltiplas bombas explodem, zumbis podem ficar presos em loops de "chegar → parar → nova bomba → chegar"
   - ❌ Não há feedback visual para o jogador entender que o zumbi está em "rage"
   
   **💡 Sugestões:**
   - **Definição clara de "chegar"**: Dentro de 1 tile (48px) do centro da explosão OU dentro de qualquer célula afetada pela explosão (mais permissivo e visualmente melhor).
   - **Cooldown de nova rage**: Adicionar um "cooldown" de 1-2 segundos após sair da pausa antes de poder entrar em nova rage. Isso evita loops.
   - **Prioridade de explosões**: Se nova bomba explode durante pausa, só reage se estiver mais próxima que a atual (evita zumbis pulando entre explosões distantes).
   - **Feedback visual imediato**: Quando zumbi chega, emitir partículas especiais ou mudança de cor mais intensa para indicar "chegou e está em pausa".

3. **Aumento de velocidade de 30%**
   - ⚠️ Pode ser muito ou pouco dependendo do nível
   - ⚠️ Não há transição suave (mudança instantânea pode parecer bug)
   - ⚠️ Não considera se o zumbi já está em rage (stacking?)
   
   **💡 Sugestões:**
   - **Multiplicador escalonado por nível**: Em vez de fixo 30%, usar `1.2 + (level * 0.02)` (nível 1 = 22%, nível 10 = 40%). Ou usar tabela: níveis baixos = 20%, médios = 30%, altos = 40%.
   - **Transição suave com lerp**: Em vez de mudança instantânea, usar `speed = lerp(originalSpeed, rageSpeed, 0.1)` a cada frame durante 0.5-1s. Velocidade aumenta gradualmente.
   - **Sem stacking**: Se já está em rage, nova explosão apenas reseta o timer, não aumenta velocidade novamente. Usar flag `isRaging` para prevenir múltiplas aplicações.
   - **Velocidade máxima**: Adicionar cap máximo (ex: nunca mais que 2x a velocidade original) para evitar zumbis impossíveis de evitar em níveis altos.

4. **"Voltar ao normal após o tempo de rage"**
   - ❌ Não especifica quando o tempo de rage começa (quando a bomba explode? quando chega no local?)
   - ❌ Não considera múltiplas explosões simultâneas ou sequenciais
   
   **💡 Sugestões:**
   - **Timer único e claro**: Timer começa imediatamente quando bomba explode (não quando chega). Duração total = 13s (10s movimento + 3s pausa). Se chegar antes de 10s, usa o tempo restante para pausa.
   - **Sistema de "rage slots"**: Cada zumbi pode ter até 1 rage ativa. Nova explosão durante rage:
     - Se está em movimento (< 10s): Cancela rage atual, inicia nova rage (reset timer para 13s).
     - Se está em pausa (> 10s): Ignora nova explosão até terminar pausa atual (evita interrupção).
   - **Explosões simultâneas**: Se múltiplas bombas explodem no mesmo frame, zumbi escolhe a mais próxima (Manhattan distance). Timer começa uma vez só.
   - **Explosões sequenciais**: Se nova bomba explode durante movimento, reset timer. Se durante pausa, ignora até pausa terminar.

5. **Falta de feedback visual/audio**
   - ❌ Jogador não sabe que zumbis estão em rage
   - ❌ Não há indicação de quando o efeito termina
   
   **💡 Sugestões:**
   - **Feedback visual em camadas**:
     - **Camada 1 (básico)**: Tint vermelho no sprite (`ctx.globalCompositeOperation = 'multiply'` com cor vermelha).
     - **Camada 2 (intermediário)**: Aura/brilho pulsante ao redor do zumbi (círculo vermelho que pulsa com `sin(time * 5)`).
     - **Camada 3 (avançado)**: Partículas vermelhas seguindo o zumbi durante movimento (usar ParticleSystem existente).
   - **Intensidade baseada em fase**: 
     - Movimento: Efeito intenso (tint forte + aura pulsante).
     - Pausa: Efeito máximo (tint muito forte + partículas estáticas + aura maior).
     - Transição de saída: Efeito fade out gradual (0.5s).
   - **Feedback de áudio**:
     - **Entrada em rage**: Som curto de "grito" ou "rugido" (volume baixo, não sobrepor explosão).
     - **Chegada no local**: Som sutil de "grunhido satisfeito" ou "respiração pesada".
     - **Saindo de rage**: Sem som (transição silenciosa).
   - **Indicador no HUD (opcional)**: Contador pequeno mostrando "Zumbis em rage: X" no canto da tela durante rage ativa.

### Pontos Positivos

✅ A ideia de zumbis reagindo agressivamente a explosões é interessante
✅ Aumento de velocidade cria tensão
✅ Sistema de atração já existe e pode ser aproveitado

---

## Nova Especificação: Sistema de Rage dos Zumbis

### Objetivo
Criar um sistema onde zumbis entram em um estado de "rage" quando uma bomba explode, tornando-os mais agressivos, rápidos e focados no local da explosão, criando momentos de alta tensão para o jogador.

### Comportamento Detalhado

#### 1. Trigger de Rage
- **Quando**: Imediatamente quando uma bomba explode (evento `bomb:detonated`)
- **Quem**: Todos os zumbis vivos no mapa (exceto se em cooldown)
- **Duração**: Variável baseada em distância (mínimo 2s, máximo 10s movimento) + 3s de pausa
- **Tempo Dinâmico**: 
  ```javascript
  // Calcular distância Manhattan até explosão
  const distance = Math.abs(zombieCol - explosionCol) + Math.abs(zombieRow - explosionRow);
  
  // Tempo máximo baseado na distância (mínimo 2s, máximo 10s)
  const baseTime = Math.min(10.0, Math.max(2.0, distance * 0.5));
  
  // Ajustar por tipo de zumbi
  const RAGE_TIME_MULTIPLIERS = {
      'wanderer': 0.9,  // 10% menos tempo
      'chaser': 1.0,    // Tempo padrão
      'smart': 1.1      // 10% mais tempo
  };
  const adjustedTime = baseTime * RAGE_TIME_MULTIPLIERS[zombieType];
  ```
- **Zumbi Já no Local**: Se distância < 0.5 tiles, entra direto na fase de pausa (3s) sem movimento

#### 2. Estados do Rage

##### Estado 1: Movimento Acelerado (0-10 segundos ou até chegar)
- **Velocidade**: Aumenta gradualmente com transição suave
  ```javascript
  // Multiplicador escalonado por nível (opcional)
  const speedMultiplier = 1.2 + (level * 0.02); // Nível 1: 22%, Nível 10: 40%
  // OU usar tabela por faixa:
  const RAGE_SPEED_MULTIPLIERS = {
      low: 1.2,      // Níveis 1-5: 20%
      medium: 1.3,   // Níveis 6-10: 30%
      high: 1.4,     // Níveis 11-15: 40%
      extreme: 1.5    // Níveis 16+: 50%
  };
  
  // Transição suave com lerp (0.5-1s)
  const RAGE_TRANSITION_TIME = 0.8;
  if (rageTransitionTimer < RAGE_TRANSITION_TIME) {
      const t = rageTransitionTimer / RAGE_TRANSITION_TIME;
      speed = lerp(originalSpeed, rageSpeed, t);
  }
  
  // Cap máximo: nunca mais que 2x a velocidade original
  const MAX_RAGE_SPEED_MULTIPLIER = 2.0;
  ```
- **Comportamento**: Move-se em direção ao centro da explosão
- **Pathfinding**: 
  - Zumbis `smart`: Usam pathfinding completo até o local
  - Zumbis `chaser`: Movem-se diretamente (como fazem com o player)
  - Zumbis `wanderer`: Movem-se diretamente (ignoram wander normal)
- **Prioridade**: Rage tem prioridade sobre comportamento normal e sobre perseguir o player
- **Sem Stacking**: Se já está em rage, nova explosão apenas reseta timer, não aumenta velocidade novamente

##### Estado 2: Pausa no Local (quando chegar OU após tempo máximo)
- **Condição de chegada**: 
  ```javascript
  // Opção 1: Dentro de 1 tile do centro
  const ARRIVAL_DISTANCE = TILE_SIZE; // 48px
  
  // Opção 2: Dentro de qualquer célula afetada pela explosão (mais permissivo)
  const hasReached = explosionCells.some(cell => 
      cell.col === zombieCol && cell.row === zombieRow
  );
  ```
- **Duração**: 3 segundos parado
- **Comportamento**: 
  - Zumbi para completamente (`moving = false`)
  - Mantém direção olhando para o centro da explosão
  - **Prioridade de explosões**: Se nova bomba explode durante pausa, só reage se estiver 20% mais próxima que a atual
  ```javascript
  if (ragePhase === 'paused') {
      const currentDist = dist(zombieCol, zombieRow, currentRageTarget.col, currentRageTarget.row);
      const newDist = dist(zombieCol, zombieRow, newExplosion.col, newExplosion.row);
      
      if (newDist < currentDist * 0.8) {
          // Cancela pausa e vai para nova explosão
          ragePhase = 'moving';
          rageTimer = RAGE_DURATION_TOTAL;
      }
      // Senão, ignora nova explosão
  }
  ```
- **Timeout**: Se não chegar no tempo máximo, entra em pausa mesmo assim (no local atual)
- **Feedback Visual ao Chegar**: Emitir partículas especiais ou mudança de cor mais intensa

##### Estado 3: Retorno ao Normal (após tempo total)
- **Velocidade**: Retorna ao valor original com fade out gradual (0.5s)
  ```javascript
  if (rageTimer <= 0) {
      const fadeTime = 0.5;
      if (rageTransitionTimer > RAGE_TRANSITION_TIME - fadeTime) {
          const t = (rageTransitionTimer - (RAGE_TRANSITION_TIME - fadeTime)) / fadeTime;
          speed = lerp(rageSpeed, originalSpeed, t);
      } else {
          // Termina rage
          speed = originalSpeed;
      }
  }
  ```
- **Comportamento**: Volta ao comportamento normal (wander/chase/smart)
- **Cooldown**: Após sair da pausa, adicionar cooldown de 1-2s antes de poder entrar em nova rage
  ```javascript
  const RAGE_COOLDOWN = 1.5; // segundos
  
  if (ragePhase === 'none' && rageCooldownTimer > 0) {
      rageCooldownTimer -= dt;
      return; // Não pode entrar em nova rage ainda
  }
  ```
- **Transição**: Suave (não instantânea)

#### 3. Múltiplas Explosões

- **Sistema de "Rage Slots"**: Cada zumbi pode ter até 1 rage ativa
  ```javascript
  startRage(target) {
      // Verifica cooldown
      if (rageCooldownTimer > 0) return false;
      
      if (ragePhase === 'moving') {
          // Cancela rage atual, inicia nova
          rageTimer = RAGE_DURATION_TOTAL;
          rageTarget = target;
          hasReachedTarget = false;
          return true;
      } else if (ragePhase === 'paused') {
          // Ignora nova explosão até terminar pausa atual
          return false;
      } else {
          // Inicia nova rage
          // ... código de inicialização ...
      }
  }
  ```

- **Explosões Simultâneas**: Se múltiplas bombas explodem no mesmo frame
  ```javascript
  // Escolhe a mais próxima (Manhattan distance)
  let nearestExplosion = explosions[0];
  let minDist = dist(zombieCol, zombieRow, nearestExplosion.col, nearestExplosion.row);
  
  for (const exp of explosions) {
      const d = dist(zombieCol, zombieRow, exp.col, exp.row);
      if (d < minDist) {
          minDist = d;
          nearestExplosion = exp;
      }
  }
  // Timer começa uma vez só para a explosão mais próxima
  ```

- **Explosões Sequenciais**: 
  - Durante movimento (< tempo máximo): Cancela movimento atual, vai para nova explosão (reset timer)
  - Durante pausa: Ignora até terminar pausa atual (exceto se nova explosão estiver 20% mais próxima)

- **Reset de timer**: Timer de rage reinicia para nova explosão (se aplicável)
- **Stacking**: Não acumula velocidade (sempre multiplicador acima da base, nunca stack)

#### 4. Feedback Visual

- **Feedback Visual em Camadas**:

  **Camada 1 - Tint Vermelho (Básico)**
  ```javascript
  // No EntityRenderer.js
  if (enemy.isRaging) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(255, 0, 0, ${rageIntensity})`;
      ctx.fillRect(enemy.x - 24, enemy.y - 24, 48, 48);
      ctx.restore();
  }
  ```

  **Camada 2 - Aura Pulsante (Intermediário)**
  ```javascript
  // Aura ao redor do zumbi
  const pulse = Math.sin(time * 5) * 0.5 + 0.5; // 0 a 1
  const auraRadius = 30 + pulse * 10; // Pulsa entre 30-40px
  
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, auraRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 * pulse})`;
  ctx.lineWidth = 3;
  ctx.stroke();
  ```

  **Camada 3 - Partículas (Avançado)**
  ```javascript
  // Partículas vermelhas seguindo o zumbi durante movimento
  if (enemy.isRaging && enemy.ragePhase === 'moving') {
      particleSystem.emitRageTrail(enemy.x, enemy.y);
  }
  
  // Partículas estáticas durante pausa
  if (enemy.ragePhase === 'paused') {
      particleSystem.emitRageStatic(enemy.x, enemy.y);
  }
  
  // Partículas especiais ao chegar
  if (justArrived) {
      particleSystem.emitRageArrival(enemy.x, enemy.y);
  }
  ```

- **Intensidade Baseada em Fase**:
  ```javascript
  let visualIntensity = 0;
  
  if (ragePhase === 'moving') {
      visualIntensity = 0.7; // Intenso
  } else if (ragePhase === 'paused') {
      visualIntensity = 1.0; // Máximo
  } else if (rageTransitionTimer < 0.5) {
      // Fade out ao sair
      visualIntensity = lerp(1.0, 0.0, rageTransitionTimer / 0.5);
  }
  ```

- **Animação**: Animação de movimento mais rápida/agressiva durante rage
- **Transição**: Efeito visual aparece gradualmente e desaparece gradualmente (fade out 0.5s)

#### 5. Feedback de Áudio

- **Entrada em Rage**: Som curto de "grito" ou "rugido" (volume baixo, não sobrepor explosão)
  ```javascript
  EventBus.on('zombie:rage_start', ({ zombie }) => {
      soundEngine.play('zombieRage', { volume: 0.3 });
  });
  ```

- **Chegada no Local**: Som sutil de "grunhido satisfeito" ou "respiração pesada"
  ```javascript
  EventBus.on('zombie:rage_arrived', ({ zombie }) => {
      soundEngine.play('zombieRageArrival', { volume: 0.2 });
  });
  ```

- **Saindo de Rage**: Sem som (transição silenciosa)

- **Indicador no HUD (Opcional)**:
  ```javascript
  // No HUD renderer
  const ragingZombies = enemies.filter(e => e.isRaging).length;
  
  if (ragingZombies > 0) {
      ctx.fillStyle = '#ff0000';
      ctx.font = '16px Arial';
      ctx.fillText(`⚠️ Zumbis em Rage: ${ragingZombies}`, 10, CANVAS_HEIGHT - 20);
  }
  ```

### Implementação Técnica

#### Arquitetura

1. **RageState Component** (novo)
   - Adicionado a cada `Enemy`
   - Propriedades:
     - `isRaging: boolean`
     - `rageTimer: number` (0-tempo máximo dinâmico)
     - `rageTarget: {col, row}` (local da explosão)
     - `ragePhase: 'moving' | 'paused' | 'none'`
     - `originalSpeed: number` (backup da velocidade original)
     - `rageSpeed: number` (velocidade calculada durante rage)
     - `hasReachedTarget: boolean`
     - `rageTransitionTimer: number` (para transição suave de velocidade)
     - `rageCooldownTimer: number` (cooldown após sair de rage)
     - `rageVisualIntensity: number` (0-1, para feedback visual)

2. **Modificações no AttractionSystem**
   - Adicionar informação de rage aos attractions
   - Ou criar sistema separado de rage (melhor separação de responsabilidades)

3. **Modificações nos Behaviors**
   - Verificar estado de rage antes de comportamento normal
   - Durante rage: ignorar player e seguir rageTarget
   - Verificar se chegou no target (distância < 1 tile)

4. **Modificações no Enemy**
   - Aplicar multiplicador de velocidade durante rage
   - Gerenciar estado de rage
   - Resetar velocidade ao sair de rage

#### Fluxo de Eventos

```
bomb:detonated
  ↓
RageSystem processa explosão:
  - Calcula distância de cada zumbi até explosão
  - Calcula tempo dinâmico baseado em distância
  - Ajusta tempo por tipo de zumbi
  ↓
Enemy.startRage(target):
  - Verifica cooldown (se > 0, ignora)
  - Se já está em rage:
    - Se fase == 'moving': Cancela e vai para nova explosão
    - Se fase == 'paused': Ignora (exceto se nova explosão 20% mais próxima)
  - Se não está em rage:
    - Salva velocidade original
    - Calcula velocidade de rage (com multiplicador escalonado)
    - Define rageTarget
    - Define ragePhase = 'moving'
    - rageTimer = tempo dinâmico calculado
    - rageTransitionTimer = 0
    - Emite evento 'zombie:rage_start'
  ↓
[LOOP] Enemy.update():
  - Se isRaging:
    - rageTimer -= dt
    - rageTransitionTimer += dt
    
    - Transição suave de velocidade (lerp)
    
    - Se ragePhase == 'moving':
      - Move em direção ao rageTarget (via behavior)
      - Verifica se chegou (dist <= 1 tile OU dentro de célula afetada)
      - Se chegou:
        - ragePhase = 'paused'
        - moving = false
        - rageVisualIntensity = 1.0
        - Emite evento 'zombie:rage_arrived'
      - Se rageTimer <= RAGE_DURATION_PAUSE:
        - ragePhase = 'paused'
        - moving = false
    
    - Se ragePhase == 'paused':
      - Fica parado
      - Olha para rageTarget
      - rageVisualIntensity = 1.0
    
    - Se rageTimer <= 0:
      - Fade out de velocidade (lerp)
      - Fade out visual
      - Após fade:
        - ragePhase = 'none'
        - isRaging = false
        - Restaura velocidade original
        - rageCooldownTimer = RAGE_COOLDOWN
        - Volta ao comportamento normal
    
    - Atualiza rageCooldownTimer (se > 0)
```

### Valores Configuráveis

```javascript
// constants.js

// Durações
export const RAGE_DURATION_MOVEMENT_MIN = 2.0; // segundos (mínimo)
export const RAGE_DURATION_MOVEMENT_MAX = 10.0; // segundos (máximo)
export const RAGE_DURATION_PAUSE = 3.0; // segundos
export const RAGE_DURATION_DISTANCE_FACTOR = 0.5; // segundos por tile

// Multiplicadores de tempo por tipo
export const RAGE_TIME_MULTIPLIERS = {
    'wanderer': 0.9,  // 10% menos tempo
    'chaser': 1.0,    // Tempo padrão
    'smart': 1.1      // 10% mais tempo
};

// Velocidade
export const RAGE_SPEED_MULTIPLIER_BASE = 1.3; // 30% mais rápido (base)
export const RAGE_SPEED_MULTIPLIER_PER_LEVEL = 0.02; // +2% por nível
export const MAX_RAGE_SPEED_MULTIPLIER = 2.0; // Nunca mais que 2x
export const RAGE_TRANSITION_TIME = 0.8; // segundos para transição suave

// Distância e chegada
export const RAGE_ARRIVAL_DISTANCE = TILE_SIZE; // 48px (1 tile)
export const RAGE_IMMEDIATE_PAUSE_DISTANCE = 0.5; // tiles (entra direto em pausa)

// Cooldown
export const RAGE_COOLDOWN = 1.5; // segundos após sair de rage

// Visual
export const RAGE_VISUAL_FADE_TIME = 0.5; // segundos para fade out
```

### Casos de Borda

1. **Zumbi morre durante rage**: Rage é cancelada automaticamente
2. **Zumbi está em knockback**: Rage continua, mas movimento é afetado pelo knockback primeiro
3. **Zumbi não consegue chegar**: Após 10s, entra em pausa no local atual
4. **Múltiplas explosões simultâneas**: Zumbi vai para a mais próxima
5. **Zumbi já está no local**: Entra direto em pausa (3s)

### Testes

1. ✅ Zumbi entra em rage quando bomba explode
2. ✅ Velocidade aumenta em 30%
3. ✅ Zumbi move-se em direção à explosão
4. ✅ Zumbi para quando chega (dentro de 1 tile)
5. ✅ Zumbi para após 10s mesmo sem chegar
6. ✅ Zumbi fica parado por 3s após chegar
7. ✅ Velocidade retorna ao normal após rage
8. ✅ Comportamento normal retorna após rage
9. ✅ Múltiplas explosões resetam o timer
10. ✅ Efeito visual aparece/desaparece corretamente

### Exemplo de Código Completo

Ver seção detalhada em `17-fase-17-sugestoes-melhorias.md` para implementação completa com código.

### Próximos Passos (Futuro)

- [x] ~~Adicionar som de rage~~ (Especificado)
- [x] ~~Adicionar partículas durante rage~~ (Especificado)
- [ ] Considerar diferentes intensidades de rage (bombas maiores = rage mais forte?)
- [x] ~~Adicionar indicador visual no HUD~~ (Especificado como opcional)
- [ ] Adicionar animações específicas de rage nos sprites
- [ ] Balanceamento fino dos valores baseado em playtesting

---

## Resumo das Mudanças

### Arquivos a Modificar

1. `js/entities/Enemy.js`
   - Adicionar propriedades de rage
   - Gerenciar estado de rage no `update()`
   - Aplicar multiplicador de velocidade

2. `js/systems/AttractionSystem.js` OU criar `js/systems/RageSystem.js`
   - Gerenciar estado de rage dos zumbis
   - Escutar evento `bomb:detonated`
   - Atualizar timers de rage

3. `js/behaviors/*.js` (WandererBehavior, ChaserBehavior, SmartBehavior)
   - Verificar estado de rage antes de comportamento normal
   - Implementar movimento em direção ao rageTarget durante rage

4. `js/constants.js`
   - Adicionar constantes de rage

5. `js/rendering/EntityRenderer.js` (futuro)
   - Adicionar efeito visual para zumbis em rage

### Decisões de Design

- ✅ Usar sistema separado de rage (não apenas AttractionSystem) para melhor controle
- ✅ Fase de pausa cria momento de tensão ("o que vai acontecer?")
- ✅ Velocidade aumenta gradualmente (não instantânea)
- ✅ Feedback visual claro para o jogador
- ✅ Tempo dinâmico baseado em distância para melhor gameplay
- ✅ Sistema de cooldown previne loops de rage
- ✅ Multiplicador escalonado por nível para balanceamento progressivo

---

## 🎯 Implementação Recomendada (Prioridades)

### Fase 1 - Essencial (MVP)
1. ✅ Timer dinâmico baseado em distância
2. ✅ Definição clara de "chegar" (1 tile)
3. ✅ Sistema de rage slots (sem stacking)
4. ✅ Tint vermelho básico
5. ✅ Estados básicos (moving, paused, none)
6. ✅ Transição básica de velocidade

### Fase 2 - Importante (Melhorias de UX)
7. ✅ Transição suave de velocidade (lerp)
8. ✅ Cooldown após pausa
9. ✅ Aura pulsante
10. ✅ Som de entrada em rage
11. ✅ Prioridade de explosões durante pausa
12. ✅ Feedback visual ao chegar

### Fase 3 - Polimento (Refinamento)
13. ✅ Tempos diferentes por tipo
14. ✅ Partículas avançadas (trail + static + arrival)
15. ✅ Indicador no HUD
16. ✅ Velocidade escalonada por nível
17. ✅ Fade out suave ao sair de rage
18. ✅ Intensidade visual baseada em fase

### Ordem Sugerida de Implementação

1. **Sistema Base**: Criar RageSystem, adicionar propriedades em Enemy
2. **Lógica de Estados**: Implementar estados moving/paused/none
3. **Movimento**: Integrar com behaviors para seguir rageTarget
4. **Velocidade**: Implementar multiplicador e transição suave
5. **Timer Dinâmico**: Calcular tempo baseado em distância
6. **Feedback Visual**: Adicionar tint vermelho básico
7. **Múltiplas Explosões**: Implementar sistema de slots e prioridades
8. **Cooldown**: Adicionar proteção contra loops
9. **Feedback Avançado**: Aura, partículas, som
10. **Balanceamento**: Ajustar valores baseado em playtesting
