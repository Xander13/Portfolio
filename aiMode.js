// -------- Globals --------
let knowledge = {};
const input = document.getElementById("llmTxt");
const sendBtn = document.querySelector(".send");
const responseBox = document.querySelector(".responseBox");
let questionCount = 0;
const wordSpeed = 14;
const maxQuestions = 8;

// -------- Normalize Input --------
function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w\s]/gi, '').trim();
}

// -------- Load Knowledge JSON --------
async function loadKnowledge() {
  try {
    const res = await fetch("knowledge.json");
    knowledge = await res.json();
    console.log("Knowledge loaded:", knowledge);
  } catch (err) {
    console.error("Failed to load knowledge.json", err);
  }
}

// -------- Typing Effect --------
function typeWriter(element, text, speed = wordSpeed, callback = null) {
  element.textContent = "";
  let i = 0;
  function typing() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    } else if (callback) {
      callback();
    }
  }
  typing();
}

// -------- Append Message --------
function appendMessage(sender, msg, animated = false, extra = {}, callback = null) {
  const wrapper = document.createElement("div");
  wrapper.classList.add(sender === "user" ? "userMsg" : "aiMsg");

  const p = document.createElement("p");
  wrapper.appendChild(p);
  responseBox.appendChild(wrapper);

  if (sender === "user") {
    p.textContent = `You: ${msg}`;
    if (callback) callback();
  } else {
    p.textContent = `Alex Bot: `;
    if (animated) {
      typeWriter(p, msg, wordSpeed, () => {
        appendExtraContent(wrapper, extra);
        if (callback) callback();
      });
    } else {
      p.textContent += msg;
      appendExtraContent(wrapper, extra);
      if (callback) callback();
    }
  }

  wrapper.style.marginBottom = "16px";
  responseBox.scrollTop = responseBox.scrollHeight;
}


// -------- Append Extra Content (links, media) --------
function appendExtraContent(wrapper, extra = {}) {
  if (!extra) return;

  // Add link safely
  if (extra.link && extra.link.href) {
    const a = document.createElement("a");
    a.href = extra.link.href;
    a.target = "_blank";
    a.textContent = extra.link.text || "Link";
    a.style.textDecoration = "underline";
    wrapper.appendChild(a);
  }

  const media = [];

  if (extra.videos) {
    extra.videos.forEach(src => {
      const video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.loop = true;
      video.style.width = "100%";
      media.push(video);
    });
  }

  if (extra.images) {
    const videoSet = new Set(extra.videos || []);
    extra.images.forEach(src => {
      if (!videoSet.has(src)) {
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "100%";
        media.push(img);
      }
    });
  }

  if (media.length > 0) {
    const mediaWrapper = document.createElement("div");
    mediaWrapper.style.display = "flex";
    mediaWrapper.style.flexWrap = "wrap";
    mediaWrapper.style.gap = "8px";

    media.forEach(item => {
      const itemWrapper = document.createElement("div");
      itemWrapper.style.flex = media.length === 1 ? "1 1 100%" : "1 1 calc(50% - 4px)";
      itemWrapper.appendChild(item);
      mediaWrapper.appendChild(itemWrapper);
    });

    wrapper.appendChild(mediaWrapper);
  }
}

// -------- Build Personal Paragraph --------
function buildParagraph(matchedKeys) {
  const sentences = [];
  matchedKeys.forEach(key => {
    if (knowledge.personal[key]) sentences.push(knowledge.personal[key]);
  });
  return sentences.join(" ");
}

// -------- Synonyms Mapping --------
const personalSynonyms = {
  name: ["name", "who is alex", "full name"],
  role: ["role", "job", "position"],
  "dream job": ["dream job", "goal", "dream"],
  linkedin: ["linkedin"]
};

// -------- Find Response --------
async function findResponse(userInput) {
  const normalizedInput = normalizeText(userInput);
  const matchedKeys = [];

  // Personal info
  for (const key in personalSynonyms) {
    if (personalSynonyms[key].some(s => normalizedInput.includes(s))) {
      matchedKeys.push(key);
    }
  }

  if (matchedKeys.includes("linkedin")) {
    return {
      text: knowledge.personal.linkedin,
      link: { href: "https://www.linkedin.com/in/alex-kauffman/", text: "alex-kauffman" }
    };
  }

  if (matchedKeys.length > 0) {
    return { text: buildParagraph(matchedKeys) };
  }

  // Catch-all for "projects"
  if (normalizedInput.includes("project")) {
    const projectNames = Object.keys(knowledge.projects);
    return {
      text: `Sure! Here are some of my projects: ${projectNames.join(", ")}. Ask about any for details!`
    };
  }

  // Project matching
  for (const key in knowledge.projects) {
    const project = knowledge.projects[key];
    const normalizedKey = key.toLowerCase();

    if (normalizedInput.includes(normalizedKey) || (project.buzzwords && project.buzzwords.some(b => normalizedInput.includes(b.toLowerCase())))) {
      return {
        text: `Sure! Here is my ${project.title}: ${project.description}`,
        images: project.images,
        videos: project.videos,
        link: project.link
      };
    }
  }

  return { text: "Hmm… I don’t have an answer for that yet." };
}

// -------- Send Message --------
async function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage("user", userText);
  questionCount++;

  if (questionCount > maxQuestions) {
    appendMessage(
      "ai",
      "Looks like you're curious 👀 You’ve reached your 8-question limit. Check out more about Alex on his LinkedIn: ",
      true,
      { href: "https://www.linkedin.com/in/alex-kauffman/", text: "alex-kauffman" }
    );
    input.disabled = true;
    return;
  }

  const answerObj = await findResponse(userText);
  appendMessage("ai", answerObj.text, true, {
    images: answerObj.images,
    videos: answerObj.videos,
    link: answerObj.link
  });

  input.value = "";
}

// -------- Render Prompts --------
function renderPrompts() {
  const responseBox = document.querySelector(".responseBox");

  // Container for prompts
  const introScreen = document.createElement("div");
  introScreen.id = "introScreen";

  const promptContainer = document.createElement("div");
  promptContainer.classList.add("promptContainer");

  const boxes = [document.createElement("div"), document.createElement("div")];
  boxes.forEach((box, i) => {
    box.classList.add("promptBox");
    promptContainer.appendChild(box);
  });

  introScreen.appendChild(promptContainer);
  responseBox.appendChild(introScreen);

  // ✅ Load prompts from JSON
  const prompts = knowledge.prompts; // make sure your JSON has { box1: [], box2: [] }

  boxes.forEach((box, i) => {
    const key = `box${i + 1}`;
    if (prompts[key]) {
      prompts[key].forEach((text, index) => {
        const p = document.createElement("p");
        p.classList.add("promptBtn");
        p.textContent = text;
        p.addEventListener("click", () => {
          input.value = text.replace("Ask Alex about ", "");
          sendMessage();
          introScreen.remove(); // hide prompts after selection
        });

        // fade-in each button
        p.style.opacity = 0;
        p.style.transform = "translateY(10px)";
        p.style.transition = "opacity 0.5s ease, transform 0.5s ease";

        setTimeout(() => {
          p.style.opacity = 1;
          p.style.transform = "translateY(0)";
        }, 100 * index);

        box.appendChild(p);
      });
    }

    // fade-in the box itself
    box.style.opacity = 0;
    box.style.transform = "translateY(20px)";
    box.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    setTimeout(() => {
      box.style.opacity = 1;
      box.style.transform = "translateY(0)";
    }, 100 * (i + 1));
  });
}


// -------- Event Listeners --------
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

// -------- Initialize --------
window.onload = async () => {
  await loadKnowledge();
  appendMessage(
    "ai",
    "Hello! Ask me about Alex. You have 8 questions before you get auto-promoted to his LinkedIn page.",
    true,
    {},
    renderPrompts // <-- this will now run after typing finishes
  );
};