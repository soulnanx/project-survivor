export default class Input {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.lastKey = null;
        this._downHandler = (e) => this._onKeyDown(e);
        this._upHandler = (e) => this._onKeyUp(e);
        window.addEventListener('keydown', this._downHandler);
        window.addEventListener('keyup', this._upHandler);
    }

    _onKeyDown(e) {
        // Prevent default for game keys
        const gameKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF', 'KeyB', 'KeyH',
            'KeyP', 'Escape', 'Enter', 'Backspace'
        ];
        if (gameKeys.includes(e.code)) {
            e.preventDefault();
        }
        
        // Capturar tecla para input de texto
        if (e.code === 'Backspace') {
            this.lastKey = 'Backspace';
        } else if (e.code === 'Enter') {
            this.lastKey = 'Enter';
        } else if (e.code === 'Escape') {
            this.lastKey = 'Escape';
        } else if (e.key && e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
            this.lastKey = e.key;
        }
        
        if (!this.keys[e.code]) {
            this.justPressed[e.code] = true;
        }
        this.keys[e.code] = true;
    }

    _onKeyUp(e) {
        this.keys[e.code] = false;
    }

    isDown(code) {
        return !!this.keys[code];
    }

    wasPressed(code) {
        return !!this.justPressed[code];
    }

    // Movement helpers
    get up() { return this.isDown('ArrowUp') || this.isDown('KeyW'); }
    get down() { return this.isDown('ArrowDown') || this.isDown('KeyS'); }
    get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); }
    get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
    get bomb() { return this.wasPressed('Space'); }
    get pause() { return this.wasPressed('KeyP') || this.wasPressed('Escape'); }
    get confirm() { return this.wasPressed('Enter') || this.wasPressed('Space'); }
    get escape() { return this.wasPressed('KeyE'); }
    get attack() { return this.wasPressed('KeyF'); }
    get bombKey() { return this.wasPressed('KeyB'); } // Tecla alternativa para colocar bomba (Fase 16)
    get useEquipment() { return this.wasPressed('KeyE'); } // Tecla E para usar equipamentos (Fase 28)

    /** Call at the end of each frame to clear justPressed */
    endFrame() {
        this.justPressed = {};
        // Não resetar lastKey aqui - será resetado manualmente após uso
    }

    /** Get last key pressed (for text input) */
    _getLastKey() {
        return this.lastKey;
    }

    destroy() {
        window.removeEventListener('keydown', this._downHandler);
        window.removeEventListener('keyup', this._upHandler);
    }
}
