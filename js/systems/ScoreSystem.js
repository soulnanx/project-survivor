import { SCORE_BRICK, SCORE_ENEMY_BASE, SCORE_POWERUP } from '../constants.js';
import EventBus from '../core/EventBus.js';

const HIGH_SCORE_KEY = 'project_survivor_highscores';
const MAX_HIGH_SCORES = 10;

export default class ScoreSystem {
    constructor() {
        this.score = 0;
        this._setupEvents();
    }

    _setupEvents() {
        EventBus.on('brick:destroyed', () => this.addScore(SCORE_BRICK));
        EventBus.on('enemy:killed', ({ level }) => this.addScore(SCORE_ENEMY_BASE * level));
        EventBus.on('powerup:collected', () => this.addScore(SCORE_POWERUP));
    }

    addScore(points) {
        this.score += points;
    }

    reset() {
        this.score = 0;
    }

    getHighScores() {
        try {
            const data = localStorage.getItem(HIGH_SCORE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    saveHighScore() {
        if (this.score <= 0) return;
        const scores = this.getHighScores();
        scores.push({ score: this.score, date: new Date().toLocaleDateString() });
        scores.sort((a, b) => b.score - a.score);
        const top = scores.slice(0, MAX_HIGH_SCORES);
        try {
            localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(top));
        } catch {
            // localStorage might be unavailable
        }
    }
}
