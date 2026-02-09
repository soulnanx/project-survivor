/**
 * SpriteLoader - Asynchronous sprite asset management
 * Loads LPC sprite assets (36 frames × 4 directions) for player animation
 */
export default class SpriteLoader {
    constructor() {
        this.sprites = {};  // Map: 'player_down_1' → Image object
        this.loaded = false;
        this.failed = false;
        this.loadPromise = null;
    }

    async loadPlayerSprites() {
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = this._loadAllSprites();
        return this.loadPromise;
    }

    async _loadAllSprites() {
        const directions = ['down', 'up', 'left', 'right'];
        const frameCount = 9;

        // Try absolute path first, then relative as fallback
        const basePaths = [
            '/bomberman/assets/sprites/char/standard/walk',
            'assets/sprites/char/standard/walk'
        ];

        let success = false;
        for (const basePath of basePaths) {
            const loadPromises = [];

            for (const dir of directions) {
                for (let i = 1; i <= frameCount; i++) {
                    const path = `${basePath}/${dir}/${i}.png`;
                    const key = `player_${dir}_${i}`;
                    loadPromises.push(this._loadImage(path, key));
                }
            }

            try {
                await Promise.all(loadPromises);
                this.loaded = true;
                success = true;
                console.log(`✓ Player sprites loaded (36 frames) from: ${basePath}`);
                console.log('Loaded sprites keys:', Object.keys(this.sprites).slice(0, 5), '...');
                break;
            } catch (error) {
                console.warn(`⚠ Failed to load sprites from ${basePath}, trying next path...`);
                // Clear sprites and try next path
                this.sprites = {};
            }
        }

        if (!success) {
            this.failed = true;
            console.warn('⚠ All sprite paths failed, using procedural fallback');
        }
    }

    _loadImage(path, key) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                reject(new Error(`Timeout: ${path}`));
            }, 5000);

            img.onload = () => {
                clearTimeout(timeout);
                this.sprites[key] = img;
                resolve();
            };

            img.onerror = () => {
                clearTimeout(timeout);
                console.warn(`Failed to load sprite: ${path} (${img.src})`);
                reject(new Error(`Failed: ${path}`));
            };

            img.src = path;
        });
    }

    getSprite(direction, frameIndex) {
        const frame = Math.max(1, Math.min(9, frameIndex));
        const key = `player_${direction}_${frame}`;
        return this.sprites[key] || null;
    }

    isReady() {
        return this.loaded && !this.failed;
    }
}
