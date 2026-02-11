import EventBus from '../core/EventBus.js';
import {
    CELL_WOOD, CELL_HARD_BRICK, CELL_IRON_BARS,
    EQUIPMENT_AXE, EQUIPMENT_PICKAXE, EQUIPMENT_BOLT_CUTTERS,
    BLOCK_EQUIPMENT_MAP,
    EQUIPMENT_DURABILITY
} from '../constants.js';
import { pixelToGridCol, pixelToGridRow, gridToPixelX, gridToPixelY } from '../utils.js';

export default class EquipmentSystem {
    constructor() {
        this._setupEvents();
    }

    _setupEvents() {
        EventBus.on('equipment:use', (data) => {
            this._handleEquipmentUse(data);
        });
    }

    _handleEquipmentUse({ player, col, row, grid, soundEngine }) {
        if (!this._tryBreakBlock(player, col, row, grid, soundEngine)) {
            // Equipamento não encontrado ou bloco não é especial
            EventBus.emit('equipment:missing', { col, row });
        } else {
            // Sucesso - disparar animação de punch na direção do bloco
            const playerCol = pixelToGridCol(player.x);
            const playerRow = pixelToGridRow(player.y);

            // Determinar direção baseado na posição relativa
            let direction = player.direction || 'down';
            if (col < playerCol) direction = 'left';
            else if (col > playerCol) direction = 'right';
            else if (row < playerRow) direction = 'up';
            else if (row > playerRow) direction = 'down';

            // Atualizar direção do jogador
            player.direction = direction;
            player.slashAnimTimer = 0.3; // Duração da animação

            // Emitir evento de ataque físico para efeito visual
            EventBus.emit('player:physicalAttack', {
                x: gridToPixelX(col),
                y: gridToPixelY(row),
                direction: direction,
                hit: true
            });
        }
    }

    _tryBreakBlock(player, col, row, grid, soundEngine) {
        const cell = grid.getCell(col, row);

        // Verificar se é um bloco especial
        if (!this._isSpecialBlock(cell)) {
            return false;
        }

        // Determinar qual equipamento é necessário
        const requiredEquipment = BLOCK_EQUIPMENT_MAP[cell];
        if (!requiredEquipment) {
            return false;
        }

        // Verificar se o player tem o equipamento necessário
        if (!this.canBreakBlock(player, col, row, grid)) {
            return false;
        }

        // Quebrar o bloco
        grid.setCell(col, row, 0); // CELL_EMPTY

        // Decrementar durabilidade do equipamento
        const equipmentField = this._getEquipmentField(requiredEquipment);
        if (equipmentField) {
            player.equipment[equipmentField]--;

            // Emitir evento de bloco quebrado (para drops)
            EventBus.emit('block:broken', { col, row, type: cell });

            // Som de quebra de bloco com equipamento
            if (soundEngine) soundEngine.play('brickBreak');

            // Se durabilidade chegou a 0, equipamento se quebrou
            if (player.equipment[equipmentField] <= 0) {
                EventBus.emit('equipment:broken', { equipment: requiredEquipment });
            }
        }

        return true;
    }

    canBreakBlock(player, col, row, grid) {
        const cell = grid.getCell(col, row);
        const requiredEquipment = BLOCK_EQUIPMENT_MAP[cell];

        if (!requiredEquipment) {
            return false;
        }

        const equipmentField = this._getEquipmentField(requiredEquipment);
        return equipmentField && player.equipment[equipmentField] > 0;
    }

    _isSpecialBlock(cell) {
        return cell === CELL_WOOD || cell === CELL_HARD_BRICK || cell === CELL_IRON_BARS;
    }

    _getEquipmentField(equipment) {
        switch (equipment) {
            case EQUIPMENT_AXE:
                return 'axe';
            case EQUIPMENT_PICKAXE:
                return 'pickaxe';
            case EQUIPMENT_BOLT_CUTTERS:
                return 'boltCutters';
            default:
                return null;
        }
    }
}
