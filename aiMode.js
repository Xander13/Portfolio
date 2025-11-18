const res = await fetch("https://alex-q3tf6mry7-alex-kauffmans-projects.vercel.app/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: userInput, tokenCount })
});
