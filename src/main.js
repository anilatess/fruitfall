import './ui/styles.css';
import { GameController } from './game/GameController.js';

const game = new GameController(document.querySelector('#app'));
await game.init();

if (import.meta.hot) import.meta.hot.dispose(() => game.destroy());
