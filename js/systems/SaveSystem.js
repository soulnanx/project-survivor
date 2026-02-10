export default class SaveSystem {
    constructor() {
        this.SAVE_KEY = 'project_survivor_save';
    }

    /**
     * Salva o estado atual do jogo
     * @param {Object} gameState - Estado do jogo a ser salvo
     * @param {Player} player - Instância do player
     * @param {number} level - Nível atual do dungeon
     * @param {number} score - Score atual
     */
    save(gameState) {
        const { player, level, score, levelSeed, dungeonsCompleted, survivalTime } = gameState;
        
        if (!player) return false;

        const saveData = {
            version: 3, // Mantido v3 por compatibilidade (v4 será na Fase 12)
            timestamp: Date.now(),
            player: {
                level: player.level,
                xp: player.xp,
                maxHp: player.maxHp,
                hp: player.hp,
                speed: player.speed,
                maxBombs: player.maxBombs,
                bombRange: player.bombRange,
                defense: player.defense,
                attackPower: player.attackPower,
                critChance: player.critChance,
                gold: player.gold != null ? player.gold : 0,
            },
            game: {
                dungeonLevel: level,
                score: score || 0,
                levelSeed: levelSeed || null, // Seed do nível atual
            },
            // Novos campos para Fase 11 (preparação para v4)
            run: {
                dungeonsCompleted: dungeonsCompleted || 0,
                survivalTime: survivalTime || 0,
            }
        };

        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.warn('Failed to save game:', e);
            return false;
        }
    }

    /**
     * Carrega o estado salvo do jogo
     * @returns {Object|null} Dados salvos ou null se não houver save
     */
    load() {
        try {
            const saveData = localStorage.getItem(this.SAVE_KEY);
            if (!saveData) return null;

            const data = JSON.parse(saveData);
            
            // Validar estrutura básica
            if (!data.player || !data.game) {
                return null;
            }

            return data;
        } catch (e) {
            console.warn('Failed to load game:', e);
            return null;
        }
    }

    /**
     * Verifica se existe um save válido
     * @returns {boolean}
     */
    hasSave() {
        return this.load() !== null;
    }

    /**
     * Deleta o save atual
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.SAVE_KEY);
        } catch (e) {
            console.warn('Failed to delete save:', e);
        }
    }

    /**
     * Aplica os dados salvos ao player
     * @param {Player} player - Instância do player
     * @param {Object} saveData - Dados salvos
     */
    applyToPlayer(player, saveData) {
        if (!player || !saveData || !saveData.player) return;

        const saved = saveData.player;

        // Aplicar stats do player
        player.level = saved.level || 1;
        player.xp = saved.xp || 0;
        player.maxHp = saved.maxHp || 20;
        player.hp = saved.hp || player.maxHp; // Usar HP salvo ou maxHp
        player.speed = saved.speed || 120;
        player.maxBombs = saved.maxBombs || 1;
        player.bombRange = saved.bombRange || 1;
        
        // Novos stats RPG (compatibilidade com saves antigos)
        player.defense = saved.defense || 0;
        player.attackPower = saved.attackPower || 1.0;
        player.critChance = saved.critChance || 0;
        player.gold = saved.gold != null ? saved.gold : 0;

        // Garantir que HP não ultrapasse maxHp
        player.hp = Math.min(player.hp, player.maxHp);
    }
}
