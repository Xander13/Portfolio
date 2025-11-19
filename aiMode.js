// aiMode.js
let tokenCount = 0; // Tracks number of user questions
const MAX_TOKENS = 4;

// Helper function to call backend API
async function sendPrompt(prompt) {
  const res = await fetch('/api/chat', {
    method: 'POST',             // MUST be POST
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, tokenCount })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  return res.json();
}

document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.querySelector("#llmTxt");
  const sendBtn = document.querySelector(".send");
  const responseBox = document.querySelector(".responseBox");

  // Initial AI greeting
  const greeting = document.createElement("p");
  greeting.textContent = "Hello! Ask me about Alex. You have 4 questions before you get auto-promoted to his LinkedIn page.";
  responseBox.appendChild(greeting);

  // Handle Send button click
  sendBtn.addEventListener("click", async () => {
    const userInput = inputField.value.trim();
    if (!userInput) return;

    if (tokenCount >= MAX_TOKENS) {
      alert("You’ve reached the 4-question limit! Check Alex's portfolio for more.");
      return;
    }

    tokenCount++;

    // Show user's question
    const userP = document.createElement("p");
    userP.textContent = `You: ${userInput}`;
    responseBox.appendChild(userP);

    // Show AI typing placeholder
    const aiP = document.createElement("p");
    aiP.textContent = "AlexBot: …typing";
    responseBox.appendChild(aiP);

    // Scroll responseBox to bottom
    responseBox.scrollTop = responseBox.scrollHeight;

    inputField.value = ""; // clear input

    try {
      // Fetch AI response using helper
      const data = await sendPrompt(userInput);

      aiP.textContent = "AlexBot: "; // clear typing

      // Typing animation
      let i = 0;
      const text = data.response || "No response from AI.";
      const interval = setInterval(() => {
        if (i < text.length) {
          aiP.textContent += text[i];
          i++;
        } else {
          clearInterval(interval);
          responseBox.scrollTop = responseBox.scrollHeight;
        }
      }, 25);

    } catch (err) {
      console.error(err);
      aiP.textContent = "Error fetching AI response.";
    }
  });

  // Optional: allow pressing Enter to send
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });
});