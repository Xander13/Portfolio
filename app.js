//copy text to clipboard
let text = 'xanderkau13@gmail.com';

const changeText = document.querySelector("#change-text");

// Initial message
changeText.textContent = "Click to copy email to clipboard";

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Content copied to clipboard');
    changeText.textContent = "Copied!";
    // Timeout to change the message
    setTimeout(() => {
      changeText.textContent = "Click to copy email to clipboard";
    }, 2000);
  } catch (err) {
    console.error('Failed to copy: ', err);
    changeText.textContent = "Failed to copy. Please try manually.";
  }
};

changeText.addEventListener("click", copyContent);

// Get the button:
var mybutton = $("#toTop");

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

//toogle light and dark mode
const toggleButton = document.getElementById('toggle-button');
toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('lightMode');
});