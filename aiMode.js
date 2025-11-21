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

// -------- Smooth Scroll Helpers --------
function forceUserScroll() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      responseBox.scrollTo({
        top: responseBox.scrollHeight,
        behavior: "smooth"
      });
    });
  });
}

function forceBotScroll() {
  // first scroll
  responseBox.scrollTo({
    top: responseBox.scrollHeight,
    behavior: "smooth"
  });

  // scroll again after images/video load
  setTimeout(() => {
    responseBox.scrollTo({
      top: responseBox.scrollHeight,
      behavior: "smooth"
    });
  }, 180);
}

// -------- Typing Effect --------
function typeWriter(element, text, baseSpeed = 40, callback = null) {
  element.textContent = "";
  const words = text.split(/(\s+|<br>)/); // split spaces or <br>
  let i = 0;

  function typing() {
    if (i < words.length) {
      element.innerHTML = element.innerHTML + (i === 0 ? "" : " ") + words[i];
      i++;
      // speed scales with word length
      const speed = baseSpeed + words[i - 1].length * 10;
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

  const label = document.createElement("h6");
  label.textContent = sender === "user" ? "You:" : "Alex's essence:";
  wrapper.appendChild(label);

  const content = document.createElement("div");
  content.classList.add("msgContent");
  wrapper.appendChild(content);

  const p = document.createElement("p");
  content.appendChild(p);

  if (sender === "user") {
    p.textContent = msg;
    if (callback) callback();
  } else {
    if (animated) {
      typeWriter(p, msg, wordSpeed, () => {
        appendExtraContent(content, extra);
        if (callback) callback();
      });
    } else {
      p.innerHTML = msg; // <-- changed here
      appendExtraContent(content, extra);
      if (callback) callback();
    }
  }


  wrapper.style.marginBottom = "16px";
  responseBox.appendChild(wrapper);

  // 🔥 NEW — scroll for AI messages
  if (sender === "ai") {
    forceBotScroll();
  } else {
    forceUserScroll();
  }

  nudgeChat(32);
}


// -------- Soft Nudge Scroll Helper --------
function nudgeChat(amount = 32) {
  responseBox.scrollTo({
    top: responseBox.scrollTop + amount,
    behavior: "smooth"
  });
}

// --- DET Time -------
function getDetroitTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "America/Detroit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}


// -------- Append Extra Content (links, media) --------
function appendExtraContent(wrapper, extra = {}) {
  if (!extra) return;

  // Add link
  if (extra.link && extra.link.href) {
    const a = document.createElement("a");
    a.href = extra.link.href;
    a.target = "_blank";
    a.textContent = extra.link.text || "Link";

    if (extra.inlineLink) {
      a.style.textDecoration = "underline";
      a.style.color = "inherit";  // match surrounding text
      a.style.display = "inline"; // keep inline
      a.style.margin = "0";       // no margin
    } else {
      a.style.textDecoration = "underline";
      a.style.display = "block";
      a.style.marginTop = "8px";
    }

    wrapper.appendChild(a);
  }

  // Media
  const media = [];
  if (extra.videos) {
    extra.videos.forEach(src => {
      const video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.loop = true;
      video.style.width = "100%"; // each video fills its wrapper
      media.push(video);
    });
  }

  if (extra.images) {
    const videoSet = new Set(extra.videos || []);
    extra.images.forEach(src => {
      if (!videoSet.has(src)) {
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "100%"; // each image fills its wrapper
        media.push(img);
      }
    });
  }

  if (media.length > 0) {
    const mediaWrapper = document.createElement("div");
    mediaWrapper.classList.add("mediaWrapper");

    media.forEach(item => {
      const itemWrapper = document.createElement("div");
      itemWrapper.style.flex = media.length === 1 ? "1 1 100%" : "1 1 calc(50% - 4px)";
      mediaWrapper.appendChild(itemWrapper);
      itemWrapper.appendChild(item);

      // Animation styling
      item.style.opacity = "0";
      item.style.transform = "translateY(10px)";
      item.style.transition = "opacity 0.4s ease, transform 0.4s ease";

      // Reveal on load
      const reveal = () => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";

        // *soft chat movement as items stack*
        nudgeChat(24);
      };

      if (item.tagName === "IMG") {
        item.onload = reveal;
      } else if (item.tagName === "VIDEO") {
        item.onloadeddata = reveal;
      }
    });


    wrapper.appendChild(mediaWrapper); // append below text
  }
}

// -------- Build Personal Paragraph --------
function buildParagraph(matchedKeys) {
  const sentences = [];
  matchedKeys.forEach(key => {
    if (knowledge.personal[key]) {
      let text = knowledge.personal[key];
      if (text.includes("{{time}}")) {
        text = text.replace("{{time}}", getDetroitTime());
      }
      sentences.push(text);
    }
  });
  return sentences.join(" ");
}

// -------- Synonyms Mapping --------
const personalSynonyms = {
  name: ["name", "who is alex", "full name"],
  role: ["role", "job", "position"],
  "dream job": ["dream job", "goal", "dream", "job idea"],
  linkedin: ["linkedin"],
  time: ["time", "what time is it", "current time"],
  education: ["education", "school"],
  philosophy: ["philosophy", "motto", "design thinking"],
  background: ["background", "who is alex", "perosnal background", "story"]
};


// -------- Find Response --------
async function findResponse(userInput) {
  const normalizedInput = normalizeText(userInput);

  // --- TIME FIRST ---
  const timeQueries = ["time", "current time", "currenttime", "what time is it"];
  if (timeQueries.some(q => normalizedInput.includes(q))) {
    const detroitTime = new Date().toLocaleTimeString("en-US", {
      timeZone: "America/Detroit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    return { text: `The current time in Detroit is ${detroitTime}.` };
  }

  // --- PERSONAL INFO ---
  const matchedKeys = [];
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

  // --- PROJECTS ---
  if (normalizedInput.includes("project")) {
    const projectNames = Object.keys(knowledge.projects);
    return { text: `${getFriendlyOpener()} here are some of my projects: ${projectNames.join(", ")}. Ask about any for details!` };
  }

  for (const key in knowledge.projects) {
    const project = knowledge.projects[key];
    const normalizedKey = key.toLowerCase();
    if (normalizedInput.includes(normalizedKey) ||
      (project.buzzwords && project.buzzwords.some(b => normalizedInput.includes(b.toLowerCase())))) {
      return {
        text: `${getFriendlyOpener()} here is my ${project.title}: ${project.description}`,
        images: project.images,
        videos: project.videos,
        link: project.link
      };
    }
  }

  return { text: "Hmm… I don’t have an answer for that yet." };
}

// ----- Detroit time helper -----
function getDetroitTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "America/Detroit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

// -------- Friendly Openers --------
function getFriendlyOpener() {
  const openers = [
    "Absolutely,",
    "Sure,",
    "Of course,",
    "I'm glad to help,",
    "Definitely,",
    "Happy to share,"
  ];
  return openers[Math.floor(Math.random() * openers.length)];
}



// -------- Send Message --------
async function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage("user", userText);
  forceUserScroll(); // 🔥 added

  questionCount++;

  if (questionCount > maxQuestions) {
    appendMessage(
      "ai",
      "Looks like you're curious 👀 You’ve reached your 8-question limit. Check out more about Alex on his LinkedIn: ",
      true,
      {
        link: { href: "https://www.linkedin.com/in/alex-kauffman/", text: "alex-kauffman" },
        inlineLink: true
      }
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
  // Create a fake "aiMsg" so it uses the same grid layout
  const wrapper = document.createElement("div");
  wrapper.classList.add("aiMsg");

  const label = document.createElement("h6");
  label.textContent = "Bot:"; // keeps consistency
  wrapper.appendChild(label);

  const content = document.createElement("div");
  content.classList.add("msgContent");
  wrapper.appendChild(content);

  // Put introScreen *inside* the 70% column
  content.appendChild(introScreen);

  responseBox.appendChild(wrapper);


  // ✅ Load prompts from JSON
  const prompts = knowledge.prompts; // make sure your JSON has { box1: [], box2: [] }

  boxes.forEach((box, i) => {
    const key = `box${i + 1}`;
    if (prompts[key]) {
      prompts[key].forEach((item, index) => {
        const p = document.createElement("p");
        p.classList.add("promptBtn");
        p.style.display = "flex";
        p.style.flexDirection = "column";
        p.style.gap = "4px"; // spacing between text, CTA, image

        // Add main text
        const textNode = document.createElement("span");
        textNode.textContent = item.text;
        p.appendChild(textNode);

        // Add CTA text (just visual)
        if (item.cta) {
          const ctaNode = document.createElement("span");
          ctaNode.textContent = item.cta;
          ctaNode.style.color = "#007BFF"; // blue hex
          ctaNode.style.fontSize = "0.9rem";
          p.appendChild(ctaNode);
        }

        // Add image at the bottom
        if (item.image) {
          const img = document.createElement("img");
          img.src = item.image; // make sure path is correct
          img.style.width = "100%"; // full width
          img.style.display = "block";
          p.appendChild(img);
        }

        // Click triggers the whole prompt
        p.addEventListener("click", () => {
          input.value = item.text.replace("Learn about Alex ", "");
          sendMessage();
        });

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
    "Hello! Let’s learn more about Alex. I’ve generated 4 suggested prompts to help you get started. You have 8 questions before you’re automatically redirected to his LinkedIn page.",
    true,
    {},
    renderPrompts // <-- this will now run after typing finishes
  );
};