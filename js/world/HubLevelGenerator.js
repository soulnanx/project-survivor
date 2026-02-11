/**
 * Gera o level do HUB (Fase 23 + Fase 26): grid estático com regiões separadas e decorações.
 * Layout fixo: quatro cantos para Inventário, Loja, Dungeon e Recordes; spawn em (1,1).
 */
import { COLS, ROWS, CELL_EMPTY, CELL_WALL } from '../constants.js';
import {
    POI_TYPE_INVENTORY,
    POI_TYPE_SHOP,
    POI_TYPE_DUNGEON,
    POI_TYPE_HIGH_SCORES,
} from '../constants.js';

export default class HubLevelGenerator {
    /**
     * Preenche o grid com o mapa do HUB e retorna POIs e decorações (camada visual).
     * @param {Grid} grid - Grid a ser preenchido (apenas CELL_EMPTY / CELL_WALL)
     * @returns {{ pois: Array<{ col: number, row: number, type: string }>, decorations: Array<{ col: number, row: number, type: string }> }}
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

        // Interior vazio; POIs em quatro regiões distintas (não uma única fila)
        const pois = [
            { col: 3, row: 2, type: POI_TYPE_INVENTORY },
            { col: 11, row: 2, type: POI_TYPE_SHOP },
            { col: 3, row: 10, type: POI_TYPE_DUNGEON },
            { col: 11, row: 10, type: POI_TYPE_HIGH_SCORES },
        ];

        // Decorações: mesma posição (ou célula da estrutura) para desenho de escada, balcão, etc.
        const decorations = [
            { col: 3, row: 2, type: POI_TYPE_INVENTORY },
            { col: 11, row: 2, type: POI_TYPE_SHOP },
            { col: 3, row: 10, type: POI_TYPE_DUNGEON },
            { col: 11, row: 10, type: POI_TYPE_HIGH_SCORES },
        ];

        return { pois, decorations };
    }
}
