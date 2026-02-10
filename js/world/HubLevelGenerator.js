/**
 * Gera o level do HUB (Fase 23): grid estático e lista de POIs.
 * O HUB é uma sala segura onde o jogador anda e interage com inventário, loja e entrada da dungeon.
 */
import { COLS, ROWS, CELL_EMPTY, CELL_WALL } from '../constants.js';
import {
    POI_TYPE_INVENTORY,
    POI_TYPE_SHOP,
    POI_TYPE_DUNGEON,
    POI_TYPE_HIGH_SCORES,
    HUB_SPAWN_COL,
    HUB_SPAWN_ROW,
} from '../constants.js';

export default class HubLevelGenerator {
    /**
     * Preenche o grid com o mapa do HUB e retorna a lista de POIs.
     * @param {Grid} grid - Grid a ser preenchido
     * @returns {{ pois: Array<{ col: number, row: number, type: string }> }}
     */
    static generate(grid) {
        grid.clear();

        // Bordas como paredes
        for (let c = 0; c < COLS; c++) {
            grid.setCell(c, 0, CELL_WALL);
            grid.setCell(c, ROWS - 1, CELL_WALL);
        }
        for (let r = 0; r < ROWS; r++) {
            grid.setCell(0, r, CELL_WALL);
            grid.setCell(COLS - 1, r, CELL_WALL);
        }

        // Interior vazio (já é CELL_EMPTY após clear)
        // POIs em células acessíveis: uma "corredor" central com estações
        const pois = [
            { col: 3, row: 2, type: POI_TYPE_INVENTORY },
            { col: 5, row: 2, type: POI_TYPE_SHOP },
            { col: 7, row: 2, type: POI_TYPE_DUNGEON },
            { col: 11, row: 2, type: POI_TYPE_HIGH_SCORES },
        ];

        return { pois };
    }
}
