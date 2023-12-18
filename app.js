/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
// var prevScrollpos = window.pageYOffset;
// window.onscroll = function () {
//   var currentScrollPos = window.pageYOffset;
//   if (prevScrollpos > currentScrollPos) {
//     document.getElementById("navbar").style.top = "24px";
//   } else {
//     document.getElementById("navbar").style.top = "-96px";
//   }
//   prevScrollpos = currentScrollPos;
// }

// Get the button:
var mybutton = $("#toTop");

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}