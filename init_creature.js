import { initCreature } from './creature.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.particle-creature');
    initCreature(container);
});
