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

  // ← HERE is the appendExtras function
  function appendExtras() {
    appendExtraContent(content, extra);         // existing images/videos
    if (extra.skills) appendSkillsGrid(extra.skills, content);   // skills
    if (extra.projects) appendProjectsGrid(extra.projects, content); // ← paste it here
    if (callback) callback();
  }

  if (sender === "user") {
    p.textContent = msg;
    appendExtras();
  } else {
    if (animated) {
      typeWriter(p, msg, wordSpeed, appendExtras);
    } else {
      p.innerHTML = msg;
      appendExtras();
    }
  }

  wrapper.style.marginBottom = "16px";
  responseBox.appendChild(wrapper);

  if (sender === "ai") forceBotScroll();
  else forceUserScroll();

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

  const media = [];

  // Collect videos
  if (extra.videos) {
    extra.videos.forEach(src => {
      const video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.loop = true;
      video.style.width = "100%";
      media.push({ el: video, type: "video" });
    });
  }

  // Collect images
  if (extra.images) {
    extra.images.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.style.width = "100%";
      media.push({ el: img, type: "image" });
    });
  }

  if (media.length === 0) return;

  const mediaWrapper = document.createElement("div");
  mediaWrapper.classList.add("mediaWrapper");

  // Decide wrapper style based on media type
  const hasVideo = media.some(m => m.type === "video");
  if (hasVideo && media.every(m => m.type === "video")) {
    // Only videos: full width
    mediaWrapper.style.width = "100%";
    mediaWrapper.style.display = "flex";
    mediaWrapper.style.flexDirection = "column";
    mediaWrapper.style.alignItems = "center";
    mediaWrapper.style.gap = "16px";
  } else {
    // Images (or mixed): 2-column flex grid
    mediaWrapper.style.width = "80%";
    mediaWrapper.style.display = "flex";
    mediaWrapper.style.flexWrap = "wrap";
    mediaWrapper.style.gap = "8px";
    mediaWrapper.style.margin = "0 auto";
    mediaWrapper.style.justifyContent = "center";
  }

  media.forEach(m => {
    const itemWrapper = document.createElement("div");

    if (m.type === "video") {
      itemWrapper.style.flex = "1 1 100%";
      itemWrapper.style.maxWidth = "100%";
    } else {
      itemWrapper.style.flex = media.length === 1 ? "1 1 100%" : "1 1 calc(50% - 4px)";
      itemWrapper.style.maxWidth = media.length === 1 ? "100%" : "calc(50% - 4px)";
    }

    itemWrapper.appendChild(m.el);
    mediaWrapper.appendChild(itemWrapper);

    // animation
    m.el.style.opacity = "0";
    m.el.style.transform = "translateY(10px)";
    m.el.style.transition = "opacity 0.4s ease, transform 0.4s ease";

    const reveal = () => {
      m.el.style.opacity = "1";
      m.el.style.transform = "translateY(0)";
      nudgeChat(24);
    };

    if (m.type === "video") m.el.onloadeddata = reveal;
    else m.el.onload = reveal;
  });

  wrapper.appendChild(mediaWrapper);
}



// -------- Append Skills Grid --------
function appendSkillsGrid(skillsObj, container) {
  const gridContainer = document.createElement("div");
  gridContainer.style.display = "flex";
  gridContainer.style.gap = "32px";
  gridContainer.style.width = "80%";
  gridContainer.style.margin = "32px auto";

  Object.keys(skillsObj).forEach(colKey => {
    const col = document.createElement("div");
    col.style.display = "flex";
    col.style.flexDirection = "column";
    col.style.gap = "8px";
    col.style.flex = "1";

    const skills = Object.values(skillsObj[colKey]);
    skills.forEach(skill => {
      const p = document.createElement("h4");
      p.textContent = skill;
      p.style.margin = "4px 0";
      col.appendChild(p);
    });

    gridContainer.appendChild(col);
  });

  container.appendChild(gridContainer);
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
    return {
      text: "Here are some of my projects:",
      extra: { projects: knowledge.projects } // this is important
    };
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

  // --- SKILLS GRID ---
  if (normalizedInput.includes("skills")) {
    return {
      text: "Here are my skills:",
      skills: knowledge.skills
    };
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
    skills: answerObj.skills,
    images: answerObj.images,
    videos: answerObj.videos,
    link: answerObj.link,
    projects: answerObj.extra ? answerObj.extra.projects : undefined
  });


  input.value = "";
}

// -------- Render Prompts --------
// function renderPrompts() {
//   const responseBox = document.querySelector(".responseBox");

//   // Container for prompts
//   const introScreen = document.createElement("div");
//   introScreen.id = "introScreen";

//   const promptContainer = document.createElement("div");
//   promptContainer.classList.add("promptContainer");

//   const boxes = [document.createElement("div"), document.createElement("div")];
//   boxes.forEach((box, i) => {
//     box.classList.add("promptBox");
//     promptContainer.appendChild(box);
//   });

//   introScreen.appendChild(promptContainer);
//   // Create a fake "aiMsg" so it uses the same grid layout
//   const wrapper = document.createElement("div");
//   wrapper.classList.add("aiMsg");

//   const label = document.createElement("h6");
//   label.textContent = "Bot:"; // keeps consistency
//   wrapper.appendChild(label);

//   const content = document.createElement("div");
//   content.classList.add("msgContent");
//   wrapper.appendChild(content);

//   // Put introScreen *inside* the 70% column
//   content.appendChild(introScreen);

//   responseBox.appendChild(wrapper);

//   // ✅ Load prompts from JSON
//   const prompts = knowledge.prompts; // make sure your JSON has { box1: [], box2: [] }

//   boxes.forEach((box, i) => {
//     const key = `box${i + 1}`;
//     if (prompts[key]) {
//       prompts[key].forEach((item, index) => {
//         const p = document.createElement("p");
//         p.classList.add("promptBtn");
//         p.style.display = "flex";
//         p.style.flexDirection = "column";
//         p.style.gap = "4px"; // spacing between text, CTA, image

//         // Add main text
//         const textNode = document.createElement("span");
//         textNode.textContent = item.text;
//         p.appendChild(textNode);

//         // Add CTA text (just visual)
//         if (item.cta) {
//           const ctaNode = document.createElement("span");
//           ctaNode.textContent = item.cta;
//           ctaNode.style.color = "#007BFF"; // blue hex
//           ctaNode.style.fontSize = "0.9rem";
//           p.appendChild(ctaNode);
//         }

//         // Add image at the bottom
//         if (item.image) {
//           const img = document.createElement("img");
//           img.src = item.image; // make sure path is correct
//           img.style.width = "100%"; // full width
//           img.style.display = "block";
//           p.appendChild(img);
//         }

//         // Click triggers the whole prompt
//         p.addEventListener("click", () => {
//           input.value = item.text.replace("Learn about Alex ", "");
//           sendMessage();
//         });

//         box.appendChild(p);
//       });
//     }

//     // fade-in the box itself
//     box.style.opacity = 0;
//     box.style.transform = "translateY(20px)";
//     box.style.transition = "opacity 0.6s ease, transform 0.6s ease";
//     setTimeout(() => {
//       box.style.opacity = 1;
//       box.style.transform = "translateY(0)";
//     }, 100 * (i + 1));
//   });
// }

// ------- Project Grid Sections -------
function appendProjectsGrid(projects, container) {
  const gridWrapper = document.createElement("div");
  gridWrapper.classList.add("projectsGrid");
  gridWrapper.style.display = "flex";
  gridWrapper.style.flexDirection = "column";
  gridWrapper.style.width = "100%"; // full container width
  gridWrapper.style.margin = "32px auto";
  gridWrapper.style.gap = "48px"; // vertical spacing between rows

  let i = 0;
  while (i < projects.length) {
    const project = projects[i];
    const nextProject = projects[i + 1];

    // FULL-WIDTH PROJECT (70%)
    if (project.layout === "full") {
      const itemWrapper = createProjectItem(project);
      itemWrapper.style.width = "80%";
      itemWrapper.style.margin = "0 auto"; // center
      gridWrapper.appendChild(itemWrapper);
      i++;
    }
    // HALF-WIDTH PROJECTS (50/50) in 90% container
    else if (project.layout === "half" && nextProject && nextProject.layout === "half") {
      const rowWrapper = document.createElement("div");
      rowWrapper.style.display = "flex";
      rowWrapper.style.gap = "96px"; // space between items
      rowWrapper.style.width = "90%";
      rowWrapper.style.margin = "0 auto"; // center the row

      const firstItem = createProjectItem(project);
      const secondItem = createProjectItem(nextProject);

      firstItem.style.flex = "0 0 calc(50% - 48px)";
      secondItem.style.flex = "0 0 calc(50% - 48px)";

      rowWrapper.appendChild(firstItem);
      rowWrapper.appendChild(secondItem);

      gridWrapper.appendChild(rowWrapper);
      i += 2;
    }
    // FALLBACK if only one half-layout project left
    else {
      const itemWrapper = createProjectItem(project);
      itemWrapper.style.width = "80%";
      itemWrapper.style.margin = "0 auto"; // center
      gridWrapper.appendChild(itemWrapper);
      i++;
    }
  }

  container.appendChild(gridWrapper);
}


// -------- Create individual project item --------
function createProjectItem(project) {
  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "16px"; // space between media and text

  // MEDIA first
  const mediaArray = Array.isArray(project.media) ? project.media : [project.media];
  mediaArray.forEach(src => {
    const isVideo = src.endsWith(".mp4");
    const mediaEl = isVideo ? document.createElement("video") : document.createElement("img");
    mediaEl.src = src;
    if (isVideo) {
      mediaEl.autoplay = true;
      mediaEl.loop = true;
      mediaEl.muted = true;
      mediaEl.playsInline = true;
    }
    mediaEl.style.width = "100%";
    mediaEl.style.borderRadius = "8px";
    wrapper.appendChild(mediaEl);
  });

  // TITLE
  const title = document.createElement("h4");
  title.textContent = project.title;
  title.style.textAlign = "center";
  title.style.paddingBottom = "48px";
   title.style.paddingTop = "32px";
  wrapper.appendChild(title);

  // DESCRIPTION
  if (project.description) {
    const desc = document.createElement("p");
    desc.textContent = project.description;
    wrapper.appendChild(desc);
  }

  return wrapper;
}


// -------- Event Listeners --------
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

// -------- Initialize --------
window.onload = async () => {
  await loadKnowledge();
  appendMessage(
    "ai",
    "Hey! You’re chatting the essence of Alex.<br><br>Ask about his work, his story, or anything in between. You’ve got 8 questions before we whisk you to LinkedIn.",
    true,
    {},
    // renderPrompts // <-- this will now run after typing finishes
  );
};
