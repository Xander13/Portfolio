let tokenCount = 0;

async function handleSend() {
  const inputField = document.querySelector("#llmTxt");
  const userInput = inputField.value.trim();

  if (!userInput) return;

  if (tokenCount >= 4) {
    alert("You’ve reached the 4-question limit!");
    return;
  }

  tokenCount++;

  const responseBox = document.querySelector(".responseBox");
  const p = document.createElement("p");
  p.textContent = "…typing"; // placeholder while fetching
  responseBox.appendChild(p);

  try {
    const res = await fetch("https://alex-q3tf6mry7-alex-kauffmans-projects.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userInput, tokenCount })
    });

    const data = await res.json();
    p.textContent = ""; // clear typing placeholder

    // Simple typing animation
    let i = 0;
    const text = data.response;
    const interval = setInterval(() => {
      if (i < text.length) {
        p.textContent += text[i];
        i++;
      } else {
        clearInterval(interval);
      }
    }, 25);
  } catch (err) {
    console.error(err);
    p.textContent = "Error fetching AI response.";
  }

  inputField.value = ""; // clear input
}
