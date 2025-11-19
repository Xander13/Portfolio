// aiMode.js

let tokenCount = 0; // Tracks number of user questions
const MAX_TOKENS = 4;

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
      // Fetch AI response
      const response = await fetch(
        'https://alex-llm-git-main-alex-kauffmans-projects.vercel.app/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userInput, tokenCount })
        });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

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
