// -------- Globals --------
let knowledge = {};
const input = document.getElementById("llmTxt");
const sendBtn = document.querySelector(".send");
const responseBox = document.querySelector(".responseBox");
let questionCount = 0;
const maxQuestions = 8;

// -------- Normalize Input --------
function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w\s]/gi, '').trim();
}

// -------- Synonyms Mapping --------
const personalSynonyms = {
  name: ["name", "who is alex", "full name"],
  role: ["role", "job", "position"],
  "dream job": ["dream job", "goal", "dream"],
  linkedin: ["linkedin"]
};

// -------- Load Knowledge JSON --------
async function loadKnowledge() {
  try {
    const res = await fetch("knowledge.json"); // make sure path is correct
    knowledge = await res.json();
    console.log("Knowledge loaded:", knowledge);
  } catch (err) {
    console.error("Failed to load knowledge.json", err);
  }
}

// -------- Typing Effect --------
function typeWriter(element, text, speed = 65, callback = null) {
  element.textContent = "";
  let i = 0;
  function typing() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      requestAnimationFrame(typing);
    } else if (callback) {
      callback();
    }
  }
  typing();
}

// -------- Append Message to Chat --------
function appendMessage(sender, msg, animated = false, extra = {}) {
  const wrapper = document.createElement("div");
  wrapper.classList.add(sender === "user" ? "userMsg" : "aiMsg");

  const p = document.createElement("p");
  wrapper.appendChild(p);
  responseBox.appendChild(wrapper);

  if (sender === "user") {
    p.textContent = `You: ${msg}`;
  } else {
    p.textContent = `Alex Bot: `;
    if (animated) {
      typeWriter(p, msg, 65, () => appendExtraContent(wrapper, p, extra));
    } else {
      p.textContent += msg;
      appendExtraContent(wrapper, p, extra);
    }
  }

  wrapper.style.marginBottom = "16px";
  responseBox.scrollTop = responseBox.scrollHeight;
}

function appendExtraContent(wrapper, p, extra) {
  // Add link
  if (extra.link) {
    const a = document.createElement("a");
    a.href = extra.link.href || extra.link;
    a.target = "_blank";
    a.textContent = extra.link.text || "Link";
    a.style.textDecoration = "underline";
    p.appendChild(a);
  }

  // Collect all media
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

  // If there’s media, wrap in flex container
  if (media.length > 0) {
    const mediaWrapper = document.createElement("div");
    mediaWrapper.style.display = "flex";
    mediaWrapper.style.flexWrap = "wrap";
    mediaWrapper.style.gap = "8px"; // spacing between items

    media.forEach((item, index) => {
      const itemWrapper = document.createElement("div");
      itemWrapper.style.flex = media.length === 1 ? "1 1 100%" : "1 1 calc(50% - 4px)";
      itemWrapper.appendChild(item);
      mediaWrapper.appendChild(itemWrapper);
    });

    wrapper.appendChild(mediaWrapper);
  }
}


// -------- Build Paragraph from personal info --------
function buildParagraph(matchedKeys) {
  const sentences = [];
  matchedKeys.forEach(key => {
    if (knowledge.personal[key]) sentences.push(knowledge.personal[key]);
  });
  return sentences.join(" ");
}

// -------- Match User Input --------
async function findResponse(userInput) {
  const normalizedInput = normalizeText(userInput);
  const matchedKeys = [];

  // Personal info
  for (const key in personalSynonyms) {
    if (personalSynonyms[key].some(s => normalizedInput.includes(s))) {
      matchedKeys.push(key);
    }
  }

  // LinkedIn
  if (matchedKeys.includes("linkedin")) {
    return {
      text: knowledge.personal.linkedin,
      link: { href: "https://www.linkedin.com/in/alex-kauffman/", text: "alex-kauffman" }
    };
  }

  if (matchedKeys.length > 0) {
    return { text: buildParagraph(matchedKeys) };
  }

  // Catch-all for projects query
  if (normalizedInput.includes("project")) {
    const projectNames = Object.keys(knowledge.projects);
    return { text: `Sure! Here are some of my projects: ${projectNames.join(", ")}. You can ask about any of them for more details!` };
  }

  // Project matching with normalized keys & optional buzzwords
  for (const key in knowledge.projects) {
    const project = knowledge.projects[key];
    const normalizedKey = key.toLowerCase();

    // Match key name
    if (normalizedInput.includes(normalizedKey)) {
      return {
        text: `Sure! Here is my ${project.title}: ${project.description}`,
        images: project.images,
        videos: project.videos,
        link: project.link
      };
    }

    // Match buzzwords if any
    if (project.buzzwords) {
      const buzz = project.buzzwords.map(b => b.toLowerCase());
      if (buzz.some(word => normalizedInput.includes(word))) {
        return {
          text: `Sure! Here is my ${project.title}: ${project.description}`,
          images: project.images,
          videos: project.videos,
          link: project.link
        };
      }
    }
  }

  return { text: "Hmm… I don’t have an answer for that yet." };
}

// -------- Send Message Handler --------
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

// -------- Event Listeners --------
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// -------- Initialize --------
window.onload = async () => {
  await loadKnowledge();
  const intro =
    "Hello! Ask me about Alex. You have 8 questions before you get auto-promoted to his LinkedIn page.";
  appendMessage("ai", intro, true);
};
