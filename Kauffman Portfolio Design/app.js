//https://github.com/conorbailey90/infinite-gallery
"use strict";




//Splash screen
const splash = document.querySelector('.splash');
document.addEventListener('DOMContentLoaded', (e) => {
    setTimeout(() => {
        splash.classList.add('display-none');
    }, 1800);
});