import {
    CANVAS_WIDTH, CANVAS_HEIGHT, HUD_HEIGHT,
    STATE_MENU, STATE_PLAYING, STATE_PAUSED, STATE_GAME_OVER,
    STATE_LEVEL_COMPLETE, STATE_HUB
} from '../constants.js';
import { XP_TABLE_EXPORT as XP_TABLE } from '../systems/ExperienceSystem.js';

export default class UIRenderer {
    drawHUD(ctx, { level, player, score, seedString, canEscape }) {
        // HUD background (painel improvisado apocalíptico)
        ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

        // Borda desgastada
        ctx.strokeStyle = '#5a4a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

        // Rachaduras no painel (detalhe visual)
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(15, 15);
        ctx.lineTo(20, 18);
        ctx.moveTo(CANVAS_WIDTH - 20, 20);
        ctx.lineTo(CANVAS_WIDTH - 15, 25);
        ctx.stroke();

        ctx.fillStyle = '#444';
        ctx.fillRect(0, HUD_HEIGHT - 2, CANVAS_WIDTH, 2);

        ctx.textBaseline = 'middle';
        const cy = HUD_HEIGHT / 2;
        
        // Level do dungeon (esquerda) - texto apocalíptico
        ctx.fillStyle = '#d0d0a0';
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`Dungeon ${level}`, 10, cy - 8);

        // Seed do nível (esquerda, abaixo do dungeon)
        if (seedString) {
            ctx.fillStyle = '#8a8a6a';
            ctx.font = '10px monospace';
            ctx.fillText(`SEED: ${seedString}`, 10, cy + 2);
        }

        // Level do player (esquerda, abaixo do seed)
        ctx.fillStyle = '#4a8aaf';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`LV ${player ? player.level : 1}`, 10, cy + (seedString ? 14 : 8));

        // HP Bar (barra rústica apocalíptica)
        const hpBarX = 80;
        const hpBarY = cy - 6;
        const hpBarWidth = 150;
        const hpBarHeight = 12;

        // Background da barra (metal enferrujado)
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

        // HP current (color based on health - tons apocalípticos)
        if (player) {
            const hpPercent = player.hp / player.maxHp;
            if (hpPercent > 0.5) {
                ctx.fillStyle = '#8a1a1a'; // Vermelho sangue escuro
            } else if (hpPercent > 0.25) {
                ctx.fillStyle = '#ff3300'; // Vermelho sangue
            } else {
                ctx.fillStyle = '#ff6600'; // Laranja de emergência
            }
            ctx.fillRect(hpBarX + 2, hpBarY + 2, (hpBarWidth - 4) * hpPercent, hpBarHeight - 4);

            // Borda de metal
            ctx.strokeStyle = '#5a4a3a';
            ctx.lineWidth = 1;
            ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

            // HP text (fonte improvisada)
            ctx.fillStyle = '#d0d0a0';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${player.hp} / ${player.maxHp}`, hpBarX + hpBarWidth / 2, cy);

            // XP Bar (barra fina abaixo do HP)
            let statsYOffset = 0;
            if (player.level < 10) {
                const xpBarY = hpBarY + hpBarHeight + 2;
                const xpBarHeight = 4;

                const xpNeeded = XP_TABLE[player.level] || 9999;
                const xpPrevLevel = XP_TABLE[player.level - 1] || 0;
                const xpProgress = Math.max(0, Math.min(1, 
                    (player.xp - xpPrevLevel) / (xpNeeded - xpPrevLevel)
                ));

                // Background (metal enferrujado)
                ctx.fillStyle = '#2a2a1a';
                ctx.fillRect(hpBarX, xpBarY, hpBarWidth, xpBarHeight);

                // XP progress (azul apocalíptico)
                ctx.fillStyle = '#4a6a8a';
                ctx.fillRect(hpBarX + 1, xpBarY + 1, (hpBarWidth - 2) * xpProgress, xpBarHeight - 2);
                
                statsYOffset = xpBarHeight + 2;
            }

            // Stats display (abaixo da XP bar ou HP bar) - texto apocalíptico
            if (player.level > 1) {
                const statsY = hpBarY + hpBarHeight + 2 + statsYOffset + 2;
                ctx.fillStyle = '#8a8a6a';
                ctx.font = '10px monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                
                // Defense
                ctx.fillText(`DEF: ${player.defense}%`, hpBarX, statsY);
                
                // Attack Power
                ctx.fillText(`ATK: ${player.attackPower.toFixed(1)}x`, hpBarX + 60, statsY);
                
                // Crit Chance
                ctx.fillText(`CRIT: ${player.critChance}%`, hpBarX + 120, statsY);
            }
        }

        // Score (dourado apocalíptico)
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${score}`, CANVAS_WIDTH - 10, cy);
        
        // Indicador de escape (canto direito superior)
        if (canEscape) {
            ctx.fillStyle = '#4f8a4f';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText('Press E to Escape', CANVAS_WIDTH - 10, 5);
        }
    }

    drawMenu(ctx, { menuSelection, highScores, hasSaveGame }) {
        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title
        ctx.fillStyle = '#ff8800';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PROJECT SURVIVOR', CANVAS_WIDTH / 2, 100);

        // Subtitle
        ctx.fillStyle = '#888';
        ctx.font = '16px sans-serif';
        ctx.fillText('Survival Edition', CANVAS_WIDTH / 2, 140);

        // Menu items
        const items = hasSaveGame 
            ? ['Continue', 'New Game', 'High Scores']
            : ['New Game', 'High Scores'];
        const startY = 220;
        for (let i = 0; i < items.length; i++) {
            const y = startY + i * 50;
            const selected = i === menuSelection;

            ctx.fillStyle = selected ? '#ff8800' : '#888';
            ctx.font = selected ? 'bold 24px sans-serif' : '22px sans-serif';
            ctx.fillText(items[i], CANVAS_WIDTH / 2, y);

            if (selected) {
                ctx.fillText('>', CANVAS_WIDTH / 2 - 100, y);
            }
        }

        // Show high scores if selected
        const highScoresIndex = hasSaveGame ? 2 : 1;
        if (menuSelection === highScoresIndex && highScores.length > 0) {
            ctx.fillStyle = '#aaa';
            ctx.font = '16px sans-serif';
            const hsY = 390;
            ctx.fillText('-- Top Scores --', CANVAS_WIDTH / 2, hsY);
            for (let i = 0; i < Math.min(5, highScores.length); i++) {
                ctx.fillText(
                    `${i + 1}. ${highScores[i].score} (${highScores[i].date})`,
                    CANVAS_WIDTH / 2,
                    hsY + 25 + i * 22
                );
            }
        }

        // Bottom hint
        ctx.fillStyle = '#555';
        ctx.font = '14px sans-serif';
        ctx.fillText('Press Enter to select', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }

    drawPause(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        ctx.fillStyle = '#aaa';
        ctx.font = '18px sans-serif';
        ctx.fillText('Press P or Escape to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    drawGameOver(ctx, { score, highScores, player, dungeonsCompleted, survivalTime }) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#f44';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 80);

        // Métricas da run
        ctx.fillStyle = '#fff';
        ctx.font = '18px sans-serif';
        let y = 140;
        
        if (player) {
            ctx.fillText(`Level Reached: ${player.level}`, CANVAS_WIDTH / 2, y);
            y += 30;
        }
        
        if (dungeonsCompleted !== undefined) {
            ctx.fillText(`Dungeons Completed: ${dungeonsCompleted}`, CANVAS_WIDTH / 2, y);
            y += 30;
        }
        
        if (survivalTime !== undefined) {
            const minutes = Math.floor(survivalTime / 60);
            const seconds = Math.floor(survivalTime % 60);
            ctx.fillText(`Survival Time: ${minutes}m ${seconds}s`, CANVAS_WIDTH / 2, y);
            y += 30;
        }

        ctx.fillStyle = '#ff0';
        ctx.font = '24px sans-serif';
        ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, y + 10);

        if (highScores && highScores.length > 0) {
            ctx.fillStyle = '#aaa';
            ctx.font = '16px sans-serif';
            ctx.fillText(`High Score: ${highScores[0].score}`, CANVAS_WIDTH / 2, y + 45);
        }

        ctx.fillStyle = '#888';
        ctx.font = '18px sans-serif';
        ctx.fillText('Press Enter to return to menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    }

    // drawVictory removido - não há mais vitória (survival infinito)

    drawSeedInput(ctx, { seedInput, customSeed }) {
        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title
        ctx.fillStyle = '#ff8800';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CUSTOM SEED', CANVAS_WIDTH / 2, 150);

        // Instructions
        ctx.fillStyle = '#aaa';
        ctx.font = '16px sans-serif';
        ctx.fillText('Enter a seed (letters and numbers, max 20 chars)', CANVAS_WIDTH / 2, 200);
        ctx.fillText('Leave empty to use random seed', CANVAS_WIDTH / 2, 225);

        // Current seed display
        if (customSeed) {
            ctx.fillStyle = '#4af';
            ctx.font = '14px sans-serif';
            ctx.fillText(`Current: ${customSeed}`, CANVAS_WIDTH / 2, 260);
        }

        // Input box background
        const inputY = 320;
        const inputWidth = 400;
        const inputHeight = 40;
        ctx.fillStyle = '#222';
        ctx.fillRect((CANVAS_WIDTH - inputWidth) / 2, inputY, inputWidth, inputHeight);
        
        // Input box border
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.strokeRect((CANVAS_WIDTH - inputWidth) / 2, inputY, inputWidth, inputHeight);

        // Input text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const displayText = seedInput || '';
        const textX = (CANVAS_WIDTH - inputWidth) / 2 + 10;
        ctx.fillText(displayText, textX, inputY + inputHeight / 2);

        // Cursor (piscando)
        const cursorX = textX + ctx.measureText(displayText).width;
        const cursorVisible = Math.floor(Date.now() / 500) % 2 === 0;
        if (cursorVisible) {
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(cursorX, inputY + 8, 2, inputHeight - 16);
        }

        // Instructions
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Enter - Confirm | Escape - Cancel | Backspace - Delete', CANVAS_WIDTH / 2, inputY + inputHeight + 30);
    }

    drawLevelComplete(ctx, { level, transitionTimer }) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Dungeon Complete!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    drawHub(ctx, { player, dungeonsCompleted, hubSelection }) {
        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title
        ctx.fillStyle = '#ff8800';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('HUB', CANVAS_WIDTH / 2, 50);

        // Player stats section
        const statsY = 120;
        ctx.fillStyle = '#aaa';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('Character Stats', CANVAS_WIDTH / 2, statsY);

        if (player) {
            // Level
            ctx.fillStyle = '#4af';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(`Level ${player.level}`, CANVAS_WIDTH / 2, statsY + 35);

            // HP
            ctx.fillStyle = '#fff';
            ctx.font = '18px sans-serif';
            const hpPercent = player.hp / player.maxHp;
            let hpColor = '#4f4';
            if (hpPercent <= 0.25) hpColor = '#f44';
            else if (hpPercent <= 0.5) hpColor = '#fa0';
            ctx.fillStyle = hpColor;
            ctx.fillText(`HP: ${player.hp} / ${player.maxHp}`, CANVAS_WIDTH / 2, statsY + 60);

            // XP Bar
            if (player.level < 20) { // Mostrar XP até level 20
                const xpBarY = statsY + 90;
                const xpBarWidth = 300;
                const xpBarHeight = 12;
                const xpBarX = (CANVAS_WIDTH - xpBarWidth) / 2;

                const xpNeeded = XP_TABLE[player.level] || 9999;
                const xpPrevLevel = XP_TABLE[player.level - 1] || 0;
                const xpProgress = Math.max(0, Math.min(1, 
                    (player.xp - xpPrevLevel) / (xpNeeded - xpPrevLevel)
                ));

                // Background
                ctx.fillStyle = '#333';
                ctx.fillRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);

                // XP progress
                ctx.fillStyle = '#4af';
                ctx.fillRect(xpBarX, xpBarY, xpBarWidth * xpProgress, xpBarHeight);

                // Border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);

                // XP text
                ctx.fillStyle = '#fff';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${player.xp - xpPrevLevel} / ${xpNeeded - xpPrevLevel} XP`, CANVAS_WIDTH / 2, xpBarY + xpBarHeight + 18);
            }

            // RPG Stats
            if (player.level > 1 || player.defense > 0 || player.attackPower > 1.0 || player.critChance > 0) {
                ctx.fillStyle = '#888';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                const statsTextY = statsY + (player.level < 20 ? 140 : 100);
                ctx.fillText(`DEF: ${player.defense}% | ATK: ${player.attackPower.toFixed(1)}x | CRIT: ${player.critChance}%`, CANVAS_WIDTH / 2, statsTextY);
            }
        }

        // Dungeons completed
        ctx.fillStyle = '#888';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Dungeons Completed: ${dungeonsCompleted || 0}`, CANVAS_WIDTH / 2, statsY + (player && player.level < 20 ? 180 : 140));

        // Gold (preparação para Fase 13)
        ctx.fillStyle = '#ff0';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Gold: ${0}`, CANVAS_WIDTH / 2, statsY + (player && player.level < 20 ? 210 : 170));

        // Menu options
        const menuY = 380;
        const options = ['Enter Dungeon', 'High Scores'];
        const selectedIndex = hubSelection || 0;

        for (let i = 0; i < options.length; i++) {
            const y = menuY + i * 50;
            const selected = i === selectedIndex;

            ctx.fillStyle = selected ? '#ff8800' : '#666';
            ctx.font = selected ? 'bold 24px sans-serif' : '22px sans-serif';
            ctx.fillText(options[i], CANVAS_WIDTH / 2, y);

            if (selected) {
                ctx.fillText('>', CANVAS_WIDTH / 2 - 120, y);
            }
        }

        // Instructions
        ctx.fillStyle = '#555';
        ctx.font = '14px sans-serif';
        ctx.fillText('Arrow Keys / WASD - Navigate | Enter - Select', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }
}
