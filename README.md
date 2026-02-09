# Project Survivor

Jogo de survival estilo RPG/Roguelike desenvolvido em JavaScript vanilla com sprites LPC e sistema procedural.

## Status do Projeto

✅ **Fases 1-11 Implementadas** - Sistema RPG completo com Save/Load, Dungeons procedurais
✅ **Fase 12 Implementada** - Sprites LPC para Player e Enemies (Zombies)
✅ **Fase 14 Parcialmente Implementada** - Tema apocalíptico com efeitos visuais
✅ **Sistema de Atração de Zumbis** - Zumbis são atraídos por explosões de bombas (tática gameplay)

Ver `CONTEXT.md` para arquitetura e padrões; `docs/specs/README.md` para status das fases e próximos passos.

## Documentação

Toda a documentação técnica está em `docs/specs/`:

- `README.md` - Índice das especificações
- `01-fase-1-player-hp-system.md` - Sistema de HP do Player
- `02-fase-2-enemy-hp-system.md` - Sistema de HP dos Inimigos
- `03-fase-3-7-completar-sistema-rpg.md` - Sistema de XP/Level
- `08-fase-8-save-load-system.md` - Sistema de Save/Load

## Como Jogar

1. Abra `index.html` no navegador
2. Use setas/WASD para mover
3. Espaço para colocar bombas
4. Mate inimigos para ganhar XP e subir de nível
5. Complete levels para progredir

## Como Continuar o Desenvolvimento

**Para uma nova sessão do Cursor:**

1. Leia `CONTEXT.md` para arquitetura e padrões do código
2. Leia `docs/specs/README.md` para status e próximas fases
3. Siga o formato das specs em `docs/specs/` e as regras em `.cursor/rules/`

## Estrutura

```
project-survivor/
├── js/
│   ├── systems/      # Sistemas do jogo
│   ├── entities/     # Entidades (Player, Enemy, etc)
│   ├── rendering/    # Renderização
│   └── ...
├── docs/
│   └── specs/        # Documentação técnica
├── CONTEXT.md        # Arquitetura e padrões
└── README.md         # Este arquivo
```

## Tecnologias

- JavaScript ES6+
- Canvas API
- Web Audio API (sons procedurais)
- localStorage (save system)
