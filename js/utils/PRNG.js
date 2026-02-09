/**
 * Pseudo-Random Number Generator baseado em seed
 * Usa algoritmo Mulberry32 para geração determinística
 */
export default class PRNG {
    constructor(seed) {
        this.seed = seed || Date.now();
        this.state = this.seed;
    }

    /**
     * Reset para seed original
     */
    reset() {
        this.state = this.seed;
    }

    /**
     * Gera número entre 0 (inclusive) e 1 (exclusive)
     * @returns {number} Número pseudo-aleatório entre 0 e 1
     */
    random() {
        // Mulberry32 algorithm
        this.state = (this.state + 0x6D2B79F5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), this.state | 1);
        t = t ^ (t + Math.imul(t ^ (t >>> 7), t | 61));
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Gera inteiro entre min (inclusive) e max (exclusive)
     * @param {number} min - Valor mínimo (inclusive)
     * @param {number} max - Valor máximo (exclusive)
     * @returns {number} Inteiro aleatório
     */
    int(min, max) {
        return Math.floor(this.random() * (max - min)) + min;
    }

    /**
     * Gera inteiro entre min (inclusive) e max (inclusive)
     * @param {number} min - Valor mínimo (inclusive)
     * @param {number} max - Valor máximo (inclusive)
     * @returns {number} Inteiro aleatório
     */
    intInclusive(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
     * Escolhe elemento aleatório do array
     * @param {Array} arr - Array de elementos
     * @returns {*} Elemento escolhido aleatoriamente
     */
    choice(arr) {
        if (arr.length === 0) return undefined;
        return arr[this.int(0, arr.length)];
    }

    /**
     * Shuffle array usando PRNG (não modifica array original)
     * @param {Array} arr - Array a ser embaralhado
     * @returns {Array} Nova array embaralhada
     */
    shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.int(0, i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}
