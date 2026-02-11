// Grid
export const COLS = 15;
export const ROWS = 13;
export const TILE_SIZE = 48;
export const CANVAS_WIDTH = COLS * TILE_SIZE;
export const CANVAS_HEIGHT = ROWS * TILE_SIZE + 48 + 32; // +48 for HUD + 32 for Inventory (Fase 16)

// Cell types
export const CELL_EMPTY = 0;
export const CELL_WALL = 1;
export const CELL_BRICK = 2;
export const CELL_WOOD = 3;
export const CELL_IRON_BARS = 4;
export const CELL_HARD_BRICK = 5;

// Saída do level (Fase 19 - tile de escada)
export const EXIT_COL = 1;
export const EXIT_ROW = 1;

// HUB explorável (Fase 23)
export const HUB_INTERACT_KEY = 'KeyE';
export const HUB_SPAWN_COL = 1;
export const HUB_SPAWN_ROW = 1;
export const POI_TYPE_INVENTORY = 'inventory';
export const POI_TYPE_SHOP = 'shop';
export const POI_TYPE_DUNGEON = 'dungeon';
export const POI_TYPE_HIGH_SCORES = 'high_scores';
export const SHOP_HEAL_COST = 10;      // Ouro por cura (placeholder)
export const SHOP_HEAL_AMOUNT = 5;     // HP recuperados por compra
export const PLAYER_START_GOLD = 1000; // Testando: 1000 ouro inicial

// Equipment System (Fase 28-29)
export const EQUIPMENT_AXE = 'axe';
export const EQUIPMENT_PICKAXE = 'pickaxe';
export const EQUIPMENT_BOLT_CUTTERS = 'boltCutters';

export const EQUIPMENT_DURABILITY = {
    [EQUIPMENT_AXE]: 10,
    [EQUIPMENT_PICKAXE]: 8,
    [EQUIPMENT_BOLT_CUTTERS]: 6
};

export const BLOCK_EQUIPMENT_MAP = {
    [CELL_WOOD]: EQUIPMENT_AXE,
    [CELL_HARD_BRICK]: EQUIPMENT_PICKAXE,
    [CELL_IRON_BARS]: EQUIPMENT_BOLT_CUTTERS
};

export const SHOP_AXE_COST = 50;
export const SHOP_PICKAXE_COST = 75;
export const SHOP_BOLT_CUTTERS_COST = 100;

// Game states
export const STATE_INTRO = 'INTRO';
export const STATE_MENU = 'MENU';
export const STATE_HUB = 'HUB';
export const STATE_PLAYING = 'PLAYING';
export const STATE_PAUSED = 'PAUSED';
export const STATE_GAME_OVER = 'GAME_OVER';
export const STATE_LEVEL_COMPLETE = 'LEVEL_COMPLETE';
// STATE_VICTORY removido - não há mais vitória (survival infinito)
export const STATE_SEED_INPUT = 'SEED_INPUT';

// Player defaults
export const PLAYER_SPEED = 120; // pixels per second
export const PLAYER_MAX_HP = 20;
export const PLAYER_START_HP = 20;
export const PLAYER_MAX_BOMBS = 1;
export const PLAYER_BOMB_RANGE = 1;

// Damage system
export const DAMAGE_EXPLOSION = 15;
export const DAMAGE_ENEMY_TOUCH = 5;
export const INVINCIBILITY_TIME_DAMAGE = 1.0; // 1 second after taking damage
export const INVINCIBILITY_TIME_RESPAWN = 2.0; // (kept for reference)

// Enemy HP System - Todos os zumbis têm 10 HP
export const ENEMY_HP_WANDERER = 10;
export const ENEMY_HP_CHASER = 10;
export const ENEMY_HP_SMART = 10;
export const ENEMY_HIT_FLASH_DURATION = 0.15; // seconds

// Knockback System
export const KNOCKBACK_FORCE = 120; // pixels por segundo de velocidade inicial
export const KNOCKBACK_DURATION = 0.3; // segundos de knockback
export const KNOCKBACK_FRICTION = 300; // desaceleração (pixels/s²)

// Physical Attack System
export const DAMAGE_PHYSICAL_ATTACK = 1; // HP de dano do soco
export const PHYSICAL_ATTACK_RANGE = TILE_SIZE * 0.8; // Alcance do ataque
export const PHYSICAL_ATTACK_COOLDOWN = 0.5; // Segundos entre ataques

// Slash animation (Fase 18 - visual do ataque físico)
export const SLASH_FRAME_COUNT = 6;           // 6 frames por direção na pasta slash/
export const SLASH_ANIMATION_DURATION = 0.4;  // Duração em segundos da animação na tela

// Bomb
export const BOMB_TIMER = 2.5; // seconds
export const EXPLOSION_DURATION = 0.5; // seconds

// Power-up types
export const POWERUP_BOMB = 'bomb';       // +1 max bombs
export const POWERUP_FLAME = 'flame';     // +1 range
export const POWERUP_SPEED = 'speed';     // +30 speed
export const POWERUP_HEALTH = 'health';   // +10 HP
export const POWERUP_TYPES = [POWERUP_BOMB, POWERUP_FLAME, POWERUP_SPEED, POWERUP_HEALTH];

// Health powerup
export const HEALTH_POWERUP_HEAL = 10;

// Colors
export const COLOR_FLOOR = '#5a8a3c';
export const COLOR_FLOOR_ALT = '#4e7a34';
export const COLOR_WALL = '#555';
export const COLOR_WALL_LIGHT = '#777';
export const COLOR_WALL_DARK = '#333';
export const COLOR_BRICK = '#b07040';
export const COLOR_BRICK_LIGHT = '#c88858';
export const COLOR_BRICK_DARK = '#8a5530';
export const COLOR_WOOD = '#8B6F47';
export const COLOR_WOOD_LIGHT = '#A0845C';
export const COLOR_WOOD_DARK = '#6B5537';
export const COLOR_IRON_BARS = '#707070';
export const COLOR_IRON_BARS_LIGHT = '#909090';
export const COLOR_HARD_BRICK = '#6B4423';
export const COLOR_HARD_BRICK_LIGHT = '#805533';
export const COLOR_HARD_BRICK_DARK = '#4B3013';
export const COLOR_PLAYER = '#3388ff';
export const COLOR_ENEMY_WANDERER = '#e04040';
export const COLOR_ENEMY_CHASER = '#e08020';
export const COLOR_ENEMY_SMART = '#cc20cc';
export const COLOR_BOMB = '#222';
export const COLOR_EXPLOSION = '#ff8800';
export const COLOR_POWERUP_BOMB = '#ff4444';
export const COLOR_POWERUP_FLAME = '#ff8844';
export const COLOR_POWERUP_SPEED = '#44aaff';
export const COLOR_POWERUP_HEALTH = '#ff4488';

// Intro screen
export const INTRO_DURATION = 3.0; // seconds

// Level config
// MAX_LEVEL removido - não há mais limite de níveis (survival infinito)
export const LEVEL_TRANSITION_TIME = 2.0;

export const LEVEL_CONFIG = [
    null, // index 0 unused
    { enemies: 3, types: ['wanderer'], speed: 60,  density: 0.70 },
    { enemies: 4, types: ['wanderer'], speed: 68,  density: 0.72 },
    { enemies: 5, types: ['wanderer'], speed: 76,  density: 0.74 },
    { enemies: 6, types: ['wanderer', 'chaser'], speed: 84,  density: 0.76 },
    { enemies: 7, types: ['wanderer', 'chaser'], speed: 92,  density: 0.78 },
    { enemies: 8, types: ['wanderer', 'chaser'], speed: 100, density: 0.80 },
    { enemies: 9, types: ['wanderer', 'chaser'], speed: 108, density: 0.82 },
    { enemies: 10, types: ['wanderer', 'chaser', 'smart'], speed: 116, density: 0.84 },
    { enemies: 11, types: ['wanderer', 'chaser', 'smart'], speed: 124, density: 0.86 },
    { enemies: 12, types: ['wanderer', 'chaser', 'smart'], speed: 132, density: 0.88 },
];

// Scoring
export const SCORE_ENEMY_BASE = 100;
export const SCORE_BRICK = 10;
export const SCORE_POWERUP = 50;
export const SCORE_LEVEL_BONUS_BASE = 1000;
export const SCORE_TIME_BONUS_BASE = 3000;

// HUD
export const HUD_HEIGHT = 48;

// Inventory System (Fase 16)
export const INVENTORY_HEIGHT = 32; // Altura da barra de inventário na parte inferior
export const PLAYER_START_BOMB_INVENTORY = 7; // Quantidade inicial de bombas no inventário
export const PLAYER_MAX_BOMB_INVENTORY = 7; // Capacidade máxima do inventário de bombas

// Dungeon Generation
export const DUNGEON_SEED_BASE = 7919; // Número primo para seeds
export const DUNGEON_SEED_OFFSET = 12345;
export const DUNGEON_POWERUP_RATIO_MIN = 0.15;
export const DUNGEON_POWERUP_RATIO_MAX = 0.25;
export const DUNGEON_BRICK_DENSITY_VARIATION = 0.1; // ±10% variação

// Player RPG Stats (iniciais)
export const PLAYER_DEFENSE_START = 0;        // Redução de dano (%)
export const PLAYER_ATTACK_POWER_START = 1.0; // Multiplicador de dano
export const PLAYER_CRIT_CHANCE_START = 0;   // Chance de crítico (%)

// Limites máximos
export const PLAYER_DEFENSE_MAX = 80;        // Máximo 80% de redução
export const PLAYER_CRIT_CHANCE_MAX = 50;    // Máximo 50% de chance

// Sprite Configuration (Phase 12 - Player)
export const SPRITE_SIZE = 64;              // Source sprite size (64x64px PNG)
export const SPRITE_ANIMATION_FPS = 12;     // Animation frame rate
export const SPRITE_IDLE_FRAME = 5;         // Middle frame for idle (1-indexed)
export const SPRITE_FRAME_COUNT = 9;        // Frames per direction

// Zombie Sprite Configuration (Phase 12 - Enemies)
export const ZOMBIE_SPRITE_SIZE = 64;       // Source sprite size (64x64px PNG)
export const ZOMBIE_ANIMATION_FPS = 8;      // Animation frame rate (slower than player)
export const ZOMBIE_IDLE_FRAME = 5;         // Middle frame for idle (1-indexed)
export const ZOMBIE_FRAME_COUNT = 9;        // Frames per direction

// Escala visual do jogador e do zumbi (Fase 24 - tamanho na tela)
// 1.0 = tamanho da tile (48px), 1.50 ≈ 50% maior
export const PLAYER_SPRITE_SCALE = 1.50;
export const ZOMBIE_SPRITE_SCALE = 1.50;
// Offset vertical (px): negativo = desenha mais para cima, evita pés invadirem bloco abaixo
export const PLAYER_SPRITE_OFFSET_Y = -15;
export const ZOMBIE_SPRITE_OFFSET_Y = -15;

// Rage System (Phase 17)
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

// Perseguição por proximidade (Fase 25)
export const CHASE_PROXIMITY_ENTER = 3;   // entra em perseguição quando distância ≤ 3
export const CHASE_PROXIMITY_LEAVE = 4;   // sai quando distância > 4 (histerese)
export const CHASE_SPEED_MULTIPLIER = 1.15; // bônus de velocidade (15%)

// Special blocks drop rates (Fase 27)
export const WOOD_DROP_CHANCE = 10;
export const IRON_BARS_DROP_CHANCE = 15;
export const HARD_BRICK_DROP_CHANCE = 12;
