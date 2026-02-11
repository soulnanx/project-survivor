# Project Survivor - Fase 25: Alteração no Comportamento dos Inimigos (distância e velocidade)

## Crítica da Definição Proposta

Definição original: *"O zumbi deve perseguir o jogador toda vez que ele chegar a 3 blocos de distância e aumentar a velocidade em 15%."*

### Problemas identificados

1. **Qual zumbi?**
   - Hoje existem três comportamentos: **wanderer** (só vagueia e reage a atração/rage), **chaser** (sempre persegue o jogador) e **smart** (sempre faz pathfinding até o jogador). A frase não diz se a regra vale para todos ou só para um tipo.
   - **Sugestão:** Aplicar a regra a **todos** os tipos: abaixo de 3 blocos o inimigo entra em “modo perseguição” e ganha +15% de velocidade. Para chaser/smart isso só afeta a velocidade (já perseguem); para wanderer, passa a perseguir o jogador quando dentro do alcance.

2. **“3 blocos” — como medir?**
   - Não está dito se é distância em **grid** (Manhattan em células) ou distância euclidiana em pixels. O projeto já usa distância Manhattan em grid em outros sistemas (ex.: RageSystem).
   - **Sugestão:** Usar **distância Manhattan em células**: `|colZumbi - colPlayer| + |rowZumbi - rowPlayer| ≤ 3`.

3. **“Aumentar a velocidade em 15%”**
   - Não fica claro: 15% sobre a velocidade **base** do inimigo ou sobre a velocidade **atual** (ex.: durante rage)?
   - **Sugestão:** Bônus de 15% sobre a **velocidade base** (`originalSpeed`). Enquanto estiver em rage, o bônus de “perseguição por proximidade” **não** se soma ao rage (evita stacking excessivo); ou seja, durante rage usa só a velocidade de rage; fora de rage, usa `originalSpeed * 1.15` quando em alcance.

4. **Quando deixa de perseguir / quando a velocidade volta ao normal?**
   - Se o jogador sair dos 3 blocos, o zumbi para de perseguir (wanderer volta a vaguear) e a velocidade volta ao normal? E se ficar entrando e saindo da faixa (flutuação)?
   - **Sugestão:** Usar **histerese**: persegue quando distância ≤ 3; só “desliga” quando distância > 4 (ou > 3 com um pequeno cooldown, ex.: 0.5 s). Assim evita ficar ligando/desligando no limite.

5. **Prioridade com outros sistemas**
   - **Rage:** Enquanto o zumbi está em rage (movimento ou pausa), a prioridade continua sendo o alvo de rage; o bônus de velocidade de “perseguição por proximidade” não se aplica (ou não soma) para não complicar o balanceamento.
   - **Atração (bomba):** Atração continua tendo prioridade sobre perseguir o jogador; dentro do alcance de 3 blocos do jogador, se houver atração ativa, o zumbi pode continuar indo à atração (comportamento atual), e o bônus de +15% pode ou não aplicar quando o alvo é o jogador — spec abaixo assume que o bônus só aplica quando o alvo efetivo é o jogador.

### Pontos positivos

- Aumentar a velocidade quando o jogador está perto torna o combate mais tenso e legível.
- Usar “blocos” mantém a linguagem do grid e é fácil de tunar (3, 4, 5…).

---

## Contexto

Atualmente o **chaser** sempre persegue o jogador; o **smart** sempre faz pathfinding até o jogador; o **wanderer** só vagueia e reage a atração/rage. Não há “alcance de detecção” nem bônus de velocidade por proximidade. Esta fase introduz: (1) perseguir o jogador apenas quando ele estiver dentro de um alcance de 3 blocos (com histerese) e (2) aumento de velocidade de 15% durante essa perseguição, integrado a rage e atração.

## Objetivos desta Fase

1. **Alcance de perseguição:** Zumbi passa a perseguir o jogador somente quando a distância em grid (Manhattan) for ≤ 3 células. Com histerese: deixa de perseguir quando distância > 4 (ou critério equivalente).
2. **Velocidade +15%:** Enquanto estiver perseguindo o jogador por proximidade (e não em rage), a velocidade do inimigo é `originalSpeed * 1.15`. Durante rage, não aplicar este bônus (evitar stacking).
3. **Tipos:** Regra aplicada a **wanderer**, **chaser** e **smart**: wanderer passa a perseguir quando jogador ≤ 3 blocos; chaser/smart só perseguem quando ≤ 3 blocos (e ganham +15% nesse caso). Fora do alcance, chaser/smart podem vaguear ou ter comportamento neutro (ver decisão abaixo).
4. **Prioridades:** Rage e atração mantêm prioridade sobre “perseguir jogador por proximidade”; quando o alvo é o jogador dentro do alcance, aplicar o bônus de velocidade.

---

## Implementação da Fase 25

### Arquitetura

- **Distância:** Células do grid; distância Manhattan: `|colEnemy - colPlayer| + |rowEnemy - rowPlayer|`.
- **Estado “perseguindo por proximidade”:** Cada inimigo pode ter um flag (ex.: `isChasingByProximity`) e uso de histerese (entra em chase ≤ 3, sai quando > 4).
- **Velocidade:** Em `Enemy.js` (ou onde a velocidade é aplicada no movimento), ao atualizar: se não está em rage e está “perseguindo por proximidade”, usar `originalSpeed * 1.15`; caso contrário, usar `originalSpeed` (ou velocidade de rage, se aplicável). Não somar 15% em cima da velocidade de rage.
- **Behaviors:** Em cada behavior (Wanderer, Chaser, Smart), antes de decidir alvo: calcular distância ao jogador; se ≤ 3 (ou dentro da histerese “ligado”), considerar jogador como alvo e setar flag; se > 4 (histerese “desligado”), limpar flag. Wanderer: se flag ativa, usar lógica de “ir em direção ao jogador” (similar ao que faz para atração). Chaser/Smart: se flag inativa, não perseguir jogador (vaguear ou parar — decisão em aberto).

### Arquivos a modificar / criar

- `js/entities/Enemy.js` — guardar `originalSpeed`; aplicar multiplicador 1.15 quando `isChasingByProximity` e não em rage.
- `js/behaviors/WandererBehavior.js` — checar distância ao jogador; se ≤ 3, setar flag e mover em direção ao jogador; histerese ao sair (> 4).
- `js/behaviors/ChaserBehavior.js` — checar distância; só perseguir jogador se ≤ 3 (histerese > 4); setar/limpar flag.
- `js/behaviors/SmartBehavior.js` — idem: só pathfind até jogador se ≤ 3 (histerese > 4); setar/limpar flag.
- Constantes: considerar `CHASE_PROXIMITY_ENTER = 3`, `CHASE_PROXIMITY_LEAVE = 4`, `CHASE_SPEED_MULTIPLIER = 1.15` em `constants.js` ou no próprio behavior/Enemy.

### Mudanças detalhadas

- **Enemy.js:**  
  - Garantir `originalSpeed` inicializado (já existe).  
  - No update (ou no getter de velocidade usado pelo movimento): se `entity.isChasingByProximity && !entity.isRaging`, velocidade efetiva = `originalSpeed * CHASE_SPEED_MULTIPLIER`; senão, velocidade base = `originalSpeed` (e rage continua aplicando seu multiplicador como hoje).

- **WandererBehavior:**  
  - Calcular distância Manhattan (grid) ao jogador.  
  - Se distância ≤ 3: `entity.isChasingByProximity = true`; escolher direção em direção ao jogador (como faz para atração).  
  - Se distância > 4: `entity.isChasingByProximity = false`; voltar à lógica de vaguear.  
  - Entre 3 e 4: manter estado atual (não alternar).

- **ChaserBehavior / SmartBehavior:**  
  - Calcular distância ao jogador.  
  - Se ≤ 3: `entity.isChasingByProximity = true`; comportamento atual (chase/pathfind ao jogador).  
  - Se > 4: `entity.isChasingByProximity = false`; **fora do alcance**: manter comportamento “neutro” (ex.: vaguear como wanderer ou continuar na última direção sem alvo — definir na implementação).  
  - Entre 3 e 4: manter estado atual.

- **Constantes:**  
  - `CHASE_PROXIMITY_ENTER = 3`, `CHASE_PROXIMITY_LEAVE = 4`, `CHASE_SPEED_MULTIPLIER = 1.15`.

### Decisões tomadas na implementação

- **Chaser/Smart fora do alcance:** Vaguear como wanderer (escolher direções aleatórias).
- **Feedback visual:** Sim — aura/brilho amarelo-esverdeado sutil quando em perseguição por proximidade (`_drawChaseProximityEffect` no EntityRenderer).

---

## Checklist de Aceitação

- [x] Distância jogador–zumbi calculada em grid (Manhattan); constantes 3 e 4 para entrada/saída.
- [x] Wanderer persegue o jogador quando jogador ≤ 3 blocos; deixa de perseguir quando > 4 (histerese).
- [x] Chaser e Smart só perseguem o jogador quando ≤ 3 blocos; fora do alcance vagueiam.
- [x] Enquanto perseguindo por proximidade (e não em rage), velocidade = originalSpeed × 1.15.
- [x] Durante rage, bônus de proximidade não aplica (sem stacking).
- [x] Atração (bomba) mantém prioridade; quando alvo é jogador dentro do alcance, bônus de velocidade aplica.
- [x] Feedback visual sutil quando `isChasingByProximity && !isRaging`.

## Status: ✅ IMPLEMENTADO
