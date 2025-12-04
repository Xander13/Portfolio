// -------- Globals --------
let knowledge = {};
const input = document.getElementById("llmTxt");
const sendBtn = document.querySelector(".send");
const responseBox = document.querySelector(".responseBox");
const chatContainer = document.querySelector(".chat-container");
let questionCount = 0;
const wordSpeed = 4;
const maxQuestions = 25; // No limit on questions
let isExpanded = false;



// -------- Scroll Listener --------
// Removed smart scroll logic as we are now locking scroll during typing

// -------- Normalize Input --------
function normalizeText(text) {
    return text.toLowerCase().replace(/[^\w\s]/gi, '').trim();
}

// -------- Load Knowledge JSON --------
async function loadKnowledge() {
    try {
        const res = await fetch("knowledgeTree.json");
        knowledge = await res.json();
        console.log("Knowledge loaded:", knowledge);
    } catch (err) {
        console.error("Failed to load knowledgeTree.json", err);
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
    element.innerHTML = "";
    const words = text.split(/(\s+|<br>)/); // split spaces or <br>
    let i = 0;

    // Add typing class to responseBox when starting
    if (responseBox) {
        responseBox.classList.add('typing');
    }

    // Notify p5 sketch if it exists
    if (typeof setTypingState === 'function') {
        setTypingState(true);
    }

    function typing() {
        if (i < words.length) {
            // Use innerHTML to render <br> tags
            if (words[i] === '<br>') {
                element.innerHTML += '<br>';
            } else {
                element.innerHTML += words[i];
            }
            i++;

            // speed scales with word length
            const speed = baseSpeed + (words[i - 1] ? words[i - 1].length * 10 : 0);

            // Auto-scroll to bottom as text is typed
            if (responseBox) {
                responseBox.scrollTo({
                    top: responseBox.scrollHeight,
                    behavior: 'smooth'
                });
            }

            setTimeout(typing, speed);
        } else {
            // Remove typing class when finished
            if (responseBox) {
                responseBox.classList.remove('typing');
            }

            // Notify p5 sketch if it exists
            if (typeof setTypingState === 'function') {
                setTypingState(false);
            }

            if (callback) {
                callback();
            }
        }
    }

    typing();
}



// -------- Background Color Observer --------
const bgColorObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const color = entry.target.getAttribute("data-bg-color");
            if (color) {
                document.body.style.backgroundColor = color;
            } else {
                // Revert to default if no color is specified on the current message
                // Using var(--primary) which is currently #ffffff based on user's CSS
                document.body.style.backgroundColor = "var(--primary)";
            }
        }
    });
}, {
    root: document.querySelector('.responseBox'), // Observe within the scrollable container
    threshold: 0.5 // Trigger when 50% visible
});


// -------- Append Message --------
function appendMessage(sender, msg, animated = false, extra = {}, callback = null) {
    // Trigger pattern change on user input
    if (sender === "user" && typeof window.changePattern === "function") {
        window.changePattern(msg);
    }

    // Trigger pulse on AI response
    if (sender === "ai" && typeof window.startPulseLoop === "function") {
        window.startPulseLoop();
    }

    // Create card wrapper for v2
    const card = document.createElement("div");
    card.classList.add("response-card");

    const wrapper = document.createElement("div");
    wrapper.classList.add(sender === "user" ? "userMsg" : "aiMsg");

    // Set data-bg-color if provided
    if (extra.color) {
        wrapper.setAttribute("data-bg-color", extra.color);
    }

    const msgWrapper = document.createElement("div");
    msgWrapper.classList.add("msg-wrapper");
    wrapper.appendChild(msgWrapper);

    const labelCol = document.createElement("div");
    labelCol.classList.add("label-col");
    msgWrapper.appendChild(labelCol);

    const label = document.createElement("h6");
    label.textContent = sender === "user" ? "You:" : "Alex's essence:";
    labelCol.appendChild(label);

    const content = document.createElement("div");
    content.classList.add("msgContent");
    msgWrapper.appendChild(content);

    const p = document.createElement("p");
    content.appendChild(p);

    function appendExtras() {
        appendExtraContent(content, extra);

        // Skills and Projects must append to the wrapper, not the <p>
        if (extra.skills) appendSkillsGrid(extra.skills, wrapper);
        // Append projects grid if provided
        if (extra.projects) {
            const hr = document.createElement("div");
            hr.classList.add("separator-line");
            wrapper.appendChild(hr);
            appendProjectsGrid(extra.projects, wrapper);
        }

        // Append articles grid if provided
        if (extra.articles) {
            appendArticlesGrid(extra.articles, wrapper);
        }

        // Append Case Study if provided
        if (extra.caseStudy) {
            const hr = document.createElement("div");
            hr.classList.add("separator-line");
            wrapper.appendChild(hr);
            appendCaseStudy(extra.caseStudy, wrapper);
        }

        // ✅ Move inline link here AFTER typewriter
        if (extra?.link && extra.inlineLink) {
            const a = document.createElement("a");
            a.href = extra.link.href;
            a.textContent = extra.link.text;
            a.target = "_blank";
            p.append(" ");
            p.append(a);
        }

        // ✅ Handle inline links in the middle of text
        if (extra?.inlineLinks && Array.isArray(extra.inlineLinks)) {
            console.log("Processing inlineLinks:", extra.inlineLinks);
            console.log("Current paragraph text:", p.textContent);

            extra.inlineLinks.forEach(linkInfo => {
                const textContent = p.textContent;
                const searchText = linkInfo.searchText;

                console.log("Looking for:", searchText, "in:", textContent);

                if (textContent.includes(searchText)) {
                    console.log("Found! Replacing with link");
                    // Split the text into parts
                    const parts = textContent.split(searchText);

                    // Clear the paragraph
                    p.textContent = "";

                    // Rebuild with link elements
                    parts.forEach((part, index) => {
                        p.appendChild(document.createTextNode(part));

                        // Add link between parts (except after the last part)
                        if (index < parts.length - 1) {
                            const a = document.createElement("a");
                            a.href = linkInfo.href;
                            a.textContent = linkInfo.linkText;
                            a.target = "_blank";
                            a.style.color = "gray";
                            p.appendChild(a);
                            console.log("Added link element:", a);
                        }
                    });
                } else {
                    console.log("NOT found in text");
                }
            });
        }

        if (callback) callback();
    }

    if (sender === "ai") {
        if (window.speechMode && window.speechMode.isActive && window.speechMode.isActive()) {
            // Speech Mode: Instant render + Speak
            p.innerHTML = msg;
            appendExtras();

            // Speak
            window.speechMode.speak(p, () => {
                if (typeof window.stopPulseLoop === "function") {
                    window.stopPulseLoop();
                }
            });
        } else if (animated) {
            typeWriter(p, msg, wordSpeed, () => {
                appendExtras();
                if (typeof window.stopPulseLoop === "function") {
                    window.stopPulseLoop();
                }
            });
        } else {
            p.innerHTML = msg;
            appendExtras();
            if (typeof window.stopPulseLoop === "function") {
                window.stopPulseLoop();
            }
        }
    } else {
        p.textContent = msg;
        appendExtras();
    }

    wrapper.classList.add("msg-wrapper");
    card.appendChild(wrapper);
    responseBox.appendChild(card);

    // If Speech Mode is active and this is an AI message, jump to it
    if (sender === "ai" && window.speechMode && window.speechMode.isActive && window.speechMode.isActive()) {
        setTimeout(() => {
            window.speechMode.jumpToNewMessage(wrapper);
        }, 200); // Small delay to ensure DOM is ready
    }

    // Observe the new wrapper for scroll-based color changes
    bgColorObserver.observe(wrapper);

    // Scroll responseBox to the new card unless it's a case study (let user scroll manually)
    if (!extra.caseStudy) {
        setTimeout(() => {
            responseBox.scrollTo({
                top: responseBox.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }
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
        mediaWrapper.classList.add("video-only");
    } else {
        mediaWrapper.classList.add("mixed-grid");
    }

    media.forEach(m => {
        const itemWrapper = document.createElement("div");
        itemWrapper.classList.add("media-item");

        if (m.type === "video") {
            itemWrapper.classList.add("full-width");
        } else {
            if (media.length === 1) {
                itemWrapper.classList.add("full-width");
            } else {
                itemWrapper.classList.add("half-width");
            }
        }

        itemWrapper.appendChild(m.el);
        mediaWrapper.appendChild(itemWrapper);

        const reveal = () => {
            itemWrapper.classList.add("visible");
            nudgeChat(120); // Increased hint to show media is coming
        };

        if (m.type === "video") m.el.onloadeddata = reveal;
        else m.el.onload = reveal;
    });

    wrapper.appendChild(mediaWrapper);
}



// -------- Append Skills Grid --------
function appendSkillsGrid(skills, container) {
    const skillsContainer = document.createElement("div");
    skillsContainer.classList.add("skillsContainer");

    // Create 4 columns
    const columns = [[], [], [], []];
    const skillKeys = Object.keys(skills);

    // Distribute skills across 4 columns
    skillKeys.forEach((key, index) => {
        columns[index % 4].push(key);
    });

    // Collect all h4 elements to type them sequentially
    const allSkillElements = [];

    // Create column elements
    columns.forEach(columnSkills => {
        const column = document.createElement("div");
        column.classList.add("skillsColumn", "w-30");

        columnSkills.forEach(key => {
            // skills[key] is an array, so iterate through each item
            const skillArray = skills[key];
            if (Array.isArray(skillArray)) {
                skillArray.forEach(skillText => {
                    const h4 = document.createElement("h4");
                    h4.textContent = ""; // Start empty for typing effect
                    h4.setAttribute("data-skill-text", skillText); // Store the text
                    column.appendChild(h4);
                    allSkillElements.push(h4);
                });
            } else {
                // Fallback for non-array values
                const h4 = document.createElement("h4");
                h4.textContent = ""; // Start empty for typing effect
                h4.setAttribute("data-skill-text", skillArray);
                column.appendChild(h4);
                allSkillElements.push(h4);
            }
        });

        skillsContainer.appendChild(column);
    });

    container.appendChild(skillsContainer);

    // Type each skill sequentially with auto-scroll
    let currentIndex = 0;
    function typeNextSkill() {
        if (currentIndex < allSkillElements.length) {
            const h4 = allSkillElements[currentIndex];
            const text = h4.getAttribute("data-skill-text");

            // Use a faster typing speed for skills
            typeWriter(h4, text, 20, () => {
                // Auto-scroll after each skill is typed
                if (responseBox) {
                    responseBox.scrollTo({
                        top: responseBox.scrollHeight,
                        behavior: 'smooth'
                    });
                }

                currentIndex++;
                // Small delay before typing next skill
                setTimeout(typeNextSkill, 50);
            });
        }
    }

    // Start typing the first skill
    typeNextSkill();
}


// -------- Build Personal Paragraph --------
function buildParagraph(matchedKeys) {
    // Prioritize specific keys to avoid duplication
    const priority = ["background", "dream job", "philosophy", "name"];

    // Find the highest priority match
    for (const key of priority) {
        if (matchedKeys.includes(key) && knowledge.personal[key]) {
            let text = knowledge.personal[key];
            let inlineLinks = [];

            if (text.includes("{{time}}")) {
                text = text.replace("{{time}}", getDetroitTime());
            }

            // Track inline links to append after typewriter
            if (text.includes("{{leftfieldlab}}")) {
                text = text.replace("{{leftfieldlab}}", "Left Field Lab");
                inlineLinks.push({
                    searchText: "Left Field Lab",
                    href: knowledge.links?.leftfieldlab || "https://www.leftfieldlabs.com/",
                    linkText: "Left Field Lab"
                });
            }
            if (text.includes("{{rit}}")) {
                text = text.replace("{{rit}}", "Rochester Institute of Technology");
                inlineLinks.push({
                    searchText: "Rochester Institute of Technology",
                    href: knowledge.links?.rit || "https://www.rit.edu/",
                    linkText: "Rochester Institute of Technology"
                });
            }

            return {
                text: text,
                color: key === "background" ? knowledge.personal.color : undefined,
                inlineLinks: inlineLinks.length > 0 ? inlineLinks : undefined
            };
        }
    }

    // Fallback: if no priority match, use the first matched key
    if (matchedKeys.length > 0 && knowledge.personal[matchedKeys[0]]) {
        let text = knowledge.personal[matchedKeys[0]];
        let inlineLinks = [];

        if (text.includes("{{time}}")) {
            text = text.replace("{{time}}", getDetroitTime());
        }

        // Track inline links to append after typewriter
        if (text.includes("{{leftfieldlab}}")) {
            text = text.replace("{{leftfieldlab}}", "Left Field Lab");
            inlineLinks.push({
                searchText: "Left Field Lab",
                href: "https://www.leftfieldlabs.com/",
                linkText: "Left Field Lab"
            });
        }
        if (text.includes("{{rit}}")) {
            text = text.replace("{{rit}}", "Rochester Institute of Technology");
            inlineLinks.push({
                searchText: "Rochester Institute of Technology",
                href: "https://www.rit.edu/",
                linkText: "Rochester Institute of Technology"
            });
        }

        return {
            text: text,
            color: undefined,
            inlineLinks: inlineLinks.length > 0 ? inlineLinks : undefined
        };
    }

    return { text: "I don't have that information." };
}

// -------- Synonyms Mapping --------
const personalSynonyms = {
    name: ["name", "full name"],
    role: ["role", "position", "current role"],
    "dream job": ["dream job", "goal", "dream", "job idea"],
    linkedin: ["linkedin"],
    time: ["time", "what time is it", "current time"],
    education: ["education", "school", "educational background"],
    philosophy: ["philosophy", "motto", "design thinking"],
    background: ["background", "who is alex", "personal background", "story", "about alex", "tell me about"],
    skills: ["skills", "what skills", "bring to", "expertise", "capabilities"],
    availability: ["availability", "available", "when available", "hire", "start date", "when can you start"],
    weakness: ["weakness", "weaknesses", "areas for improvement"],
    deadlines: ["deadlines", "tight deadlines", "handle deadlines", "time pressure"],
    strength: ["strength", "strengths", "biggest strength", "what are you good at"],
    "successful project": ["successful project", "best project", "proudest project", "duolingo success"],
    testimonies: ["testimonies", "recommendation", "what people say", "references", "feedback"]
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
            text: knowledge.linkedin.text,
            link: knowledge.linkedin.link,
            inlineLink: true,
            instant: true
        };
    }

    if (matchedKeys.includes("education")) {
        return {
            text: knowledge.education.text,
            link: knowledge.education.link,
            inlineLink: true,
            instant: true
        };
    }

    // Check for "dream job" BEFORE "role" since "job" is in both
    if (matchedKeys.includes("dream job")) {
        const dreamJobText = knowledge.personal["dream job"];
        return {
            text: dreamJobText,
            instant: true
        };
    }

    if (matchedKeys.includes("role")) {
        return {
            text: knowledge.role.text,
            link: knowledge.role.link,
            inlineLink: true,
            instant: true
        };
    }

    // Check for "successful project" to include LinkedIn link
    if (matchedKeys.includes("successful project")) {
        return {
            text: knowledge.personal["successful project"],
            link: knowledge.duolingo_post.link,
            inlineLink: true,
            instant: true
        };
    }

    // Priority checks for specific interview questions BEFORE general matching
    // This prevents "tell me about alex's strength" from matching "background"

    if (matchedKeys.includes("strength")) {
        return {
            text: knowledge.personal["strength"],
            instant: true
        };
    }

    if (matchedKeys.includes("weakness")) {
        return {
            text: knowledge.personal["weakness"],
            instant: true
        };
    }

    if (matchedKeys.includes("skills")) {
        return {
            text: knowledge.personal["skills"],
            skills: knowledge.Skills,
            instant: true
        };
    }

    if (matchedKeys.includes("availability")) {
        return {
            text: knowledge.personal["availability"],
            instant: true
        };
    }

    if (matchedKeys.includes("deadlines")) {
        return {
            text: knowledge.personal["deadlines"],
            instant: true
        };
    }




    if (matchedKeys.length > 0) {
        const response = buildParagraph(matchedKeys);
        // Check if buildParagraph returned an object (new behavior) or string (old behavior)
        if (typeof response === 'object') return response;
        return { text: response };
    }

    // --- PROJECTS ---
    if (normalizedInput.includes("project") || normalizedInput.includes("projects") || normalizedInput.includes("work")) {
        return {
            text: "Driven by a future-forward aesthetic and a love for experimentation, I push AI, Accessibility, and UI design into tangible, usable products.",
            extra: { projects: knowledge.projects }, // this is important
        };
    }

    // --- ARTICLES ---
    if (normalizedInput.includes("article") || normalizedInput.includes("writing")) {
        return {
            text: "Here are some articles I've written:",
            extra: { articles: knowledge.Articles }
        };
    }

    // --- RANDOM CASE STUDY ---
    if (normalizedInput.includes("give me a case study") || normalizedInput.includes("show me a case study") || normalizedInput.includes("random case study")) {
        const keys = Object.keys(knowledge["case studies"]);
        if (keys.length > 0) {
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            const cs = knowledge["case studies"][randomKey];
            return {
                text: `${getFriendlyOpener()} here is a random case study, ${cs.title}: ${cs.description}`,
                images: cs.images,
                videos: cs.videos,
                link: cs.link,
                color: cs.color,
                caseStudy: cs
            };
        }
    }

    // --- CASE STUDIES ---
    for (const key in knowledge["case studies"]) {
        const cs = knowledge["case studies"][key];
        const normalizedKey = key.toLowerCase();

        if (normalizedInput.includes(normalizedKey)) {
            return {
                text: `${getFriendlyOpener()} here is my ${cs.title}: ${cs.description}`,
                images: cs.images,
                videos: cs.videos,
                link: cs.link,
                color: cs.color, // Pass color from knowledge
                caseStudy: cs // Pass full case study object
            };
        }
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
            skills: knowledge.Skills
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
    questionCount++;

    if (questionCount > maxQuestions) {
        const limitMsg = "Wow, you really like to inquire about me! � Why not have a meeting? Contact Alex on <a href='https://www.linkedin.com/in/alex-kauffman' target='_blank'>LinkedIn</a>.";
        appendMessage("ai", limitMsg);

        // Trigger scatter effect
        if (typeof window.scatterParticles === "function") {
            window.scatterParticles();
        }

        input.disabled = true;
        input.placeholder = "Limit reached.";
        return;
    }


    // ✅ await is now valid because we're inside async
    const answerObj = await findResponse(userText);

    appendMessage("ai", answerObj.text, true, {
        skills: answerObj.skills,
        images: answerObj.images,
        videos: answerObj.videos,
        link: answerObj.link,
        projects: answerObj.extra ? answerObj.extra.projects : undefined,
        articles: answerObj.extra ? answerObj.extra.articles : undefined,
        inlineLink: answerObj.inlineLink,
        color: answerObj.color,
        caseStudy: answerObj.caseStudy,
        inlineLinks: answerObj.inlineLinks
    });

    input.value = "";
}

// ------- Project Grid Sections -------
function appendProjectsGrid(projects, container, skipSpaceTop = false) {
    // Create wrapper with .project class to match index.html
    const projectWrapper = document.createElement("div");
    projectWrapper.classList.add("project");
    projectWrapper.style.width = "100%";
    projectWrapper.style.maxWidth = "100%";

    let i = 0;
    while (i < projects.length) {
        const project = projects[i];
        const nextProject = projects[i + 1];

        // Single full-width project
        if (!nextProject || project.layout === "sixty") {
            const fullWidthDiv = document.createElement("div");
            fullWidthDiv.classList.add("w-100");
            if (i > 0) fullWidthDiv.classList.add("spaceBottom");

            const projectItem = createProjectItem(project);
            fullWidthDiv.appendChild(projectItem);
            projectWrapper.appendChild(fullWidthDiv);

            i++;
        }
        // Pair of projects side by side
        else {
            const flexBox = document.createElement("div");
            flexBox.classList.add("flexBox");
            flexBox.style.alignItems = "start";

            const firstDiv = document.createElement("div");
            firstDiv.classList.add("w-50", "spaceBottom");
            if (!skipSpaceTop) firstDiv.classList.add("spaceTop");
            const firstItem = createProjectItem(project);
            firstDiv.appendChild(firstItem);

            const secondDiv = document.createElement("div");
            secondDiv.classList.add("w-50", "spaceBottom");
            if (!skipSpaceTop) secondDiv.classList.add("spaceTop");
            const secondItem = createProjectItem(nextProject);
            secondDiv.appendChild(secondItem);

            flexBox.appendChild(firstDiv);
            flexBox.appendChild(secondDiv);
            projectWrapper.appendChild(flexBox);

            i += 2;
        }
    }

    container.appendChild(projectWrapper);
}

// -------- Create individual project item --------
function createProjectItem(project) {
    const wrapper = document.createElement("a");
    wrapper.href = "#";
    wrapper.classList.add("fade-link");
    wrapper.style.cursor = "pointer";

    // Add click listener to load case study
    wrapper.addEventListener("click", (e) => {
        e.preventDefault();

        // Find case study by title
        let caseStudy = knowledge["case studies"][project.title];

        if (!caseStudy) {
            // Fallback: try to find a key that contains the project title or vice versa
            const key = Object.keys(knowledge["case studies"]).find(k =>
                k.toLowerCase().includes(project.title.toLowerCase()) ||
                project.title.toLowerCase().includes(k.toLowerCase())
            );
            if (key) caseStudy = knowledge["case studies"][key];
        }

        if (caseStudy) {
            appendMessage("ai", `Here is the case study for ${project.title}:`, false, {
                caseStudy: caseStudy
            });
        } else {
            console.log("No case study found for:", project.title);
        }
    });

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
            mediaEl.setAttribute("nocontrols", "");
        }
        mediaEl.style.width = "100%";
        wrapper.appendChild(mediaEl);
    });

    // TITLE last
    const title = document.createElement("h3");
    title.textContent = project.title;
    wrapper.appendChild(title);

    return wrapper;
}

// -------- Append Case Study --------
function appendCaseStudy(caseStudy, container) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("case-study-wrapper");

    // 1. Title
    if (caseStudy.title) {
        const h1 = document.createElement("h1");
        h1.textContent = caseStudy.title;
        h1.classList.add("case-study-header");
        wrapper.appendChild(h1);
    }

    // 2. Info Row (Role, Duration, Type, Link)
    const infoRow = document.createElement("div");
    infoRow.classList.add("case-study-flex-text");

    const addInfoItem = (label, text) => {
        if (text) {
            const div = document.createElement("div");
            div.innerHTML = `<span style="opacity: 0.6">${label}:</span> ${text}`;
            infoRow.appendChild(div);
        }
    };

    addInfoItem("Role", caseStudy.role);
    addInfoItem("Duration", caseStudy.duration);
    addInfoItem("Project Type", caseStudy.projectType);

    if (caseStudy.link) {
        const linkDiv = document.createElement("div");
        const a = document.createElement("a");
        a.href = caseStudy.link;
        a.textContent = "View Project ↗";
        a.target = "_blank";
        linkDiv.appendChild(a);
        infoRow.appendChild(linkDiv);
    }

    wrapper.appendChild(infoRow);

    // Helper to render a video block
    const renderVideo = (files, widthMode) => {
        files.forEach(src => {
            const isVideo = src.endsWith(".mp4") || src.endsWith(".webm") || src.endsWith(".mov");
            let mediaEl;

            if (isVideo) {
                mediaEl = document.createElement("video");
                mediaEl.autoplay = true;
                mediaEl.loop = true;
                mediaEl.muted = true;
                mediaEl.playsInline = true;
            } else {
                mediaEl = document.createElement("img");
            }

            mediaEl.src = src;

            if (widthMode === "fullBleed") {
                // Fix width issue: use calc(100% + padding) instead of 100vw
                mediaEl.style.width = "calc(100% + 64px)";
                mediaEl.style.maxWidth = "none";
                mediaEl.style.marginLeft = "-32px";
                mediaEl.style.marginRight = "-32px";
                mediaEl.style.height = "auto";
                mediaEl.style.position = "relative";
                mediaEl.style.left = "0";

                // Add animation class
                mediaEl.classList.add("mediaSlideIn");
                // Trigger animation
                setTimeout(() => {
                    mediaEl.classList.add("show");
                }, 100);
            } else {
                mediaEl.style.width = "100%";
                mediaEl.style.height = "auto";
            }

            mediaEl.style.marginBottom = "var(--spacing-md)";
            wrapper.appendChild(mediaEl);
        });
    };

    // Helper to render an image block
    const renderImages = (files, widthClass, textContent = null) => {
        let widthStyle = "100%";
        let wrapperWidth = "100%";
        let alignment = null;

        // Handle sixty layouts with alignment
        if (widthClass === "sixty-left" || widthClass === "sixty-right" || widthClass === "sixty-middle") {
            wrapperWidth = "70%";
            widthStyle = "100%"; // Image fills the wrapper

            if (widthClass === "sixty-left") {
                alignment = "flex-start";
            } else if (widthClass === "sixty-right") {
                alignment = "flex-end";
            } else if (widthClass === "sixty-middle") {
                alignment = "center";
            }
        } else if (widthClass === "w-50") {
            widthStyle = "calc(50% - var(--spacing-md) / 2)";
        } else if (widthClass === "w-40") {
            widthStyle = "calc(40% - var(--spacing-md) / 2)";
        } else if (widthClass === "w-60") {
            widthStyle = "calc(60% - var(--spacing-md) / 2)";
        } else if (widthClass === "w-100") {
            widthStyle = "100%";
        }

        // Create outer container for alignment
        const outerContainer = document.createElement("div");
        outerContainer.style.display = "flex";
        outerContainer.style.width = "100%";
        if (alignment) {
            outerContainer.style.justifyContent = alignment;
            outerContainer.style.paddingTop = "124px";
        }
        outerContainer.style.marginBottom = "var(--spacing-md)";

        const imagesWrapper = document.createElement("div");
        imagesWrapper.classList.add("case-study-images");
        imagesWrapper.style.display = "flex";
        imagesWrapper.style.flexWrap = "wrap";
        imagesWrapper.style.gap = "var(--spacing-md)";
        imagesWrapper.style.alignItems = "flex-start";
        imagesWrapper.style.width = wrapperWidth;

        files.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            img.style.width = widthStyle;
            img.style.height = "auto";
            img.style.objectFit = "cover";
            imagesWrapper.appendChild(img);
        });

        // If there is text, append it as a sibling (assuming w-50 layout for now)
        if (textContent) {
            const textDiv = document.createElement("div");
            textDiv.innerHTML = textContent;
            textDiv.classList.add("split-view-paragraph");

            // Sticky positioning
            textDiv.style.flex = "1";
            textDiv.style.minWidth = "300px";
            textDiv.style.position = "sticky";
            textDiv.style.top = "20px";
            textDiv.style.alignSelf = "flex-start";

            imagesWrapper.appendChild(textDiv);
        }

        outerContainer.appendChild(imagesWrapper);
        wrapper.appendChild(outerContainer);
    };

    // Helper to render text block
    const renderText = (title, paragraph, layout, block) => {
        const bodyWrapper = document.createElement("div");
        bodyWrapper.classList.add("case-study-body");

        // Default styles
        bodyWrapper.style.boxSizing = "border-box";
        bodyWrapper.style.marginBottom = "var(--spacing-md)";

        // Layout logic
        if (layout === "split_view") {
            bodyWrapper.style.display = "flex";
            bodyWrapper.style.gap = "var(--spacing-md)";
            bodyWrapper.style.marginBottom = "var(--spacing-md)";
            bodyWrapper.style.alignItems = "flex-start";

            const leftCol = document.createElement("div");
            leftCol.style.flex = "1";
            leftCol.style.position = "sticky";
            leftCol.style.top = "20px";
            leftCol.style.alignSelf = "flex-start";

            if (block.intro_title) {
                const h2 = document.createElement("h2");
                h2.textContent = block.intro_title;
                h2.style.fontSize = "32px";
                h2.style.fontWeight = "400";
                h2.style.marginBottom = "16px";
                leftCol.appendChild(h2);
            }

            bodyWrapper.appendChild(leftCol);

            const rightCol = document.createElement("div");
            rightCol.style.flex = "1";

            if (block.intro_paragraph) {
                const p = document.createElement("p");
                p.innerHTML = block.intro_paragraph;
                p.style.fontSize = "24px";
                p.style.lineHeight = "1.6";
                rightCol.appendChild(p);
            }

            bodyWrapper.appendChild(rightCol);
        } else if (layout === "right-50") {
            bodyWrapper.style.width = "50%";
            bodyWrapper.style.marginLeft = "auto";
            bodyWrapper.style.paddingLeft = "var(--spacing-md)";
            bodyWrapper.style.boxSizing = "border-box";
            bodyWrapper.style.marginBottom = "var(--spacing-md)";
        } else {
            // Default full width or other layouts can be added here
            bodyWrapper.style.width = "60%";
            bodyWrapper.style.marginLeft = "auto";
            bodyWrapper.style.paddingLeft = "var(--spacing-md)";
            bodyWrapper.style.boxSizing = "border-box";
            bodyWrapper.style.marginBottom = "var(--spacing-md)";
        }

        if (title) {
            const h3 = document.createElement("h3");
            h3.textContent = title;
            h3.style.fontSize = "24px";
            h3.style.fontWeight = "400";
            h3.style.marginBottom = "16px";
            h3.style.color = "var(--dark)";
            bodyWrapper.appendChild(h3);
        }

        if (paragraph) {
            const p = document.createElement("p");
            p.innerHTML = paragraph;
            p.style.fontSize = "24px";
            p.style.lineHeight = "1.6";
            p.style.color = "var(--dark)";
            bodyWrapper.appendChild(p);
        }

        wrapper.appendChild(bodyWrapper);
    };

    // --- NEW: Check for ordered content array ---
    if (caseStudy.content && Array.isArray(caseStudy.content)) {
        caseStudy.content.forEach(block => {
            if (block.wideTitle) {
                const wideTitle = document.createElement("h2");
                wideTitle.textContent = block.wideTitle;
                wideTitle.classList.add("wideTitle");
                wrapper.appendChild(wideTitle);
            } else if (block.type === "video") {
                renderVideo(block.files || [], block.width);
            } else if (block.type === "images" || block.type === "image") {
                renderImages(block.files || [], block.width, block.intro_paragraph);
            } else if (block.type === "text") {
                renderText(block.title, block.paragraph, block.layout, block);
            }
        });
    }
    // --- OLD: Fallback for backward compatibility ---
    else {
        // 1. Videos (Full Width)
        if (caseStudy.videos) {
            renderVideo(caseStudy.videos);
        }

        // 2. Body Content (Right aligned, w-60)
        if (caseStudy.bodyTitle || caseStudy.bodyParagraph) {
            // Re-use renderText logic but force the old style manually or just call renderText with custom layout?
            // Let's just manually create it to match exactly what was there before or use renderText if flexible enough.
            // The old logic was specific: w-60, margin-left auto.
            // Let's just paste the old logic back for safety or adapt renderText.
            // Adapting renderText:
            // renderText(caseStudy.bodyTitle, caseStudy.bodyParagraph, "old-style");
            // But renderText above handles "right-50".
            // Let's just keep the old logic block for fallback to be safe.

            const bodyWrapper = document.createElement("div");
            bodyWrapper.classList.add("case-study-body");
            bodyWrapper.style.width = "60%";
            bodyWrapper.style.marginLeft = "auto";
            bodyWrapper.style.paddingLeft = "var(--spacing-md)";
            bodyWrapper.style.boxSizing = "border-box";
            bodyWrapper.style.marginBottom = "var(--spacing-md)";

            if (caseStudy.bodyTitle) {
                const h3 = document.createElement("h3");
                h3.textContent = caseStudy.bodyTitle;
                h3.style.fontSize = "24px";
                h3.style.fontWeight = "400";
                h3.style.marginBottom = "24px";
                h3.style.color = "var(--dark)";
                bodyWrapper.appendChild(h3);
            }

            if (caseStudy.bodyParagraph) {
                const p = document.createElement("p");
                p.innerHTML = caseStudy.bodyParagraph;
                p.style.fontSize = "24px";
                p.style.lineHeight = "1.6";
                p.style.color = "var(--dark)";
                bodyWrapper.appendChild(p);
            }
            wrapper.appendChild(bodyWrapper);
        }

        // 3. Dynamic Images
        Object.keys(caseStudy).forEach(key => {
            if (key.startsWith("images")) {
                const images = caseStudy[key];
                if (!images || images.length === 0) return;

                let widthClass = "w-100";
                if (key.includes("w-50")) widthClass = "w-50";
                else if (key.includes("w-40")) widthClass = "w-40";
                else if (key.includes("w-60")) widthClass = "w-60";

                renderImages(images, widthClass);
            }
        });
    }

    container.appendChild(wrapper);

    // Add separator line after case study with extra top padding
    const bottomSeparator = document.createElement("div");
    bottomSeparator.classList.add("separator-line", "bottomSpace");
    container.appendChild(bottomSeparator);

    // Add Related Work section
    const relatedHeader = document.createElement("h2");
    relatedHeader.textContent = "Related Work";
    relatedHeader.style.fontSize = "48px"; // Match skills heading size
    relatedHeader.style.marginBottom = "32px";
    container.appendChild(relatedHeader);

    // Get random projects (2 projects at 50% width)
    if (knowledge.projects && knowledge.projects.length > 0) {
        // Filter out the current case study from the projects list
        const availableProjects = knowledge.projects.filter(p => p.title !== caseStudy.title);

        if (availableProjects.length > 0) {
            const shuffled = [...availableProjects].sort(() => 0.5 - Math.random());
            const randomProjects = shuffled.slice(0, 2);

            // Force all projects to be "forty" layout for 50% width display
            const modifiedProjects = randomProjects.map(p => ({ ...p, layout: "forty" }));

            // Create a flex container for horizontal layout
            const projectsContainer = document.createElement("div");
            projectsContainer.style.display = "flex";
            projectsContainer.style.gap = "var(--spacing-md)";
            projectsContainer.style.flexWrap = "wrap";
            container.appendChild(projectsContainer);

            appendProjectsGrid(modifiedProjects, projectsContainer, true); // Skip spaceTop for Related Work
        }
    }
}

// -------- Append Articles Grid --------
function appendArticlesGrid(articles, container) {
    const gridWrapper = document.createElement("div");
    gridWrapper.classList.add("articles-grid");
    gridWrapper.style.display = "grid";
    gridWrapper.style.gridTemplateColumns = "repeat(3, 1fr)";
    gridWrapper.style.gap = "var(--spacing-md)";
    gridWrapper.style.marginTop = "var(--spacing-md)";
    gridWrapper.style.width = "100%";

    articles.forEach(article => {
        const articleItem = createArticleItem(article);
        gridWrapper.appendChild(articleItem);
    });

    container.appendChild(gridWrapper);
}

// -------- Create individual article item --------
function createArticleItem(article) {
    const wrapper = document.createElement("a");
    wrapper.href = article.link;
    wrapper.target = "_blank";
    wrapper.classList.add("article-item");
    wrapper.style.textDecoration = "none";
    wrapper.style.display = "block";
    wrapper.style.cursor = "pointer";

    // Media
    if (article.media) {
        const isVideo = article.media.endsWith(".mp4");
        const mediaEl = isVideo ? document.createElement("video") : document.createElement("img");
        mediaEl.src = article.media;
        mediaEl.style.width = "100%";
        mediaEl.style.display = "block";
        mediaEl.style.marginBottom = "var(--spacing-sm)";
        mediaEl.style.borderRadius = "8px";

        if (isVideo) {
            mediaEl.autoplay = true;
            mediaEl.loop = true;
            mediaEl.muted = true;
            mediaEl.playsInline = true;
        }
        wrapper.appendChild(mediaEl);
    }

    // Title
    const title = document.createElement("h3");
    title.textContent = article.title;
    title.style.fontSize = "24px";
    title.style.fontWeight = "400";
    title.style.color = "var(--black)";
    title.style.marginBottom = "var(--spacing-xs)";
    title.style.lineHeight = "1.4";
    wrapper.appendChild(title);

    // Description (if exists)
    if (article.description) {
        const desc = document.createElement("p");
        desc.textContent = article.description;
        desc.style.fontSize = "24px";
        desc.style.color = "#808080";
        desc.style.lineHeight = "1.5";
        desc.style.margin = "0";
        wrapper.appendChild(desc);
    }

    return wrapper;
}


// -------- Event Listeners --------
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

// -------- Hex to RGB Helper --------
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// -------- Initialize --------
window.onload = async () => {
    await loadKnowledge();

    // V2: Show helper and expand on input focus/click
    input.addEventListener('focus', () => {
        if (!isExpanded && chatContainer) {
            chatContainer.classList.add('expanded');
            chatContainer.classList.add('show-helper');
            isExpanded = true;
        }
    });

    input.addEventListener('click', () => {
        if (!isExpanded && chatContainer) {
            chatContainer.classList.add('expanded');
            chatContainer.classList.add('show-helper');
            isExpanded = true;
        }
    });

    // Hide helper when user starts typing
    input.addEventListener('input', () => {
        if (input.value.length > 0 && chatContainer) {
            chatContainer.classList.remove('show-helper');
        }
    });

    // Track mouse position for custom cursor in demo reel
    const demoReel = document.querySelector('.demo-reel-container');
    const customCursor = document.querySelector('.custom-cursor');

    if (demoReel && customCursor) {
        demoReel.addEventListener('mousemove', (e) => {
            customCursor.style.left = e.clientX + 'px';
            customCursor.style.top = e.clientY + 'px';
        });
    }

    // --- Menu Toggle Logic ---
    const menuDot = document.querySelector('.menuDot');
    const menu = document.querySelector('.menu');

    if (menuDot && menu) {
        menuDot.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }

    // Show welcome message on load
    showWelcomeMessage();
};

// -------- Welcome Message --------
function showWelcomeMessage() {
    const card = document.createElement("div");
    card.classList.add("chat-card");
    card.setAttribute("data-bg-color", "var(--primary)");

    const wrapper = document.createElement("div");
    wrapper.classList.add("aiMsg");

    const p = document.createElement("p");
    p.id = "IntroChat";
    p.classList.add("IntroChat"); // Add class for CSS padding

    const welcomeText = "Hello, I'm Alex's essence. I'm here to help you answer questions. Here are a few prompts you can type or click right away to get a response:";

    // Create clickable prompt links
    const prompts = [
        { text: "What's Alex's dream job?", displayText: "What's Alex's dream job?", query: "dream job" },
        { text: "What's Alex's role right now?", displayText: "What's Alex's current role?", query: "role" },
        { text: "What's his educational background?", displayText: "What's Alex's educational background?", query: "education" },
        { text: "Tell me about Alex", displayText: "Tell me about Alex?", query: "background" },
        { text: "What projects does Alex have?", displayText: "What projects Alex's have worked on?", query: "projects" },
        { text: "What are Alex's skills?", displayText: "What are Alex's skills?", query: "skills" }
    ];

    const appendPrompts = () => {
        p.appendChild(document.createElement("br"));
        p.appendChild(document.createElement("br"));

        prompts.forEach((prompt, index) => {
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = prompt.text;
            link.style.cursor = "pointer";

            link.addEventListener("click", async (e) => {
                e.preventDefault();

                // Show the display text in input
                input.value = prompt.displayText;

                // But use the query for the actual search
                const userText = prompt.displayText;
                if (!userText) return;

                appendMessage("user", userText);
                questionCount++;

                if (questionCount > maxQuestions) {
                    const limitMsg = "Want to dive deeper? Connect with Alex to set up a chat. Contact through LinkedIn: <a href='https://www.linkedin.com/in/alex-kauffman' target='_blank'>LinkedIn</a>.";
                    appendMessage("ai", limitMsg);

                    // Trigger scatter effect
                    if (typeof window.scatterParticles === "function") {
                        window.scatterParticles();
                    }

                    input.disabled = true;
                    input.placeholder = "Limit reached.";
                    return;
                }

                // Use the query keyword instead of the display text
                const answerObj = await findResponse(prompt.query);

                appendMessage("ai", answerObj.text, true, {
                    skills: answerObj.skills,
                    images: answerObj.images,
                    videos: answerObj.videos,
                    link: answerObj.link,
                    projects: answerObj.extra ? answerObj.extra.projects : undefined,
                    articles: answerObj.extra ? answerObj.extra.articles : undefined,
                    inlineLink: answerObj.inlineLink,
                    color: answerObj.color,
                    caseStudy: answerObj.caseStudy,
                    inlineLinks: answerObj.inlineLinks
                });

                input.value = "";
            });

            p.appendChild(link);

            if (index < prompts.length - 1) {
                p.appendChild(document.createTextNode(", "));
            }
        });
    };

    wrapper.appendChild(p);
    card.appendChild(wrapper);
    responseBox.appendChild(card);

    // Observe for background color changes
    bgColorObserver.observe(card);

    // Display welcome text instantly
    p.innerHTML = welcomeText;
    appendPrompts();
}


// Floating Menu Toggle
document.addEventListener('DOMContentLoaded', function () {
    const menuBars = document.querySelector('.menuBars');
    const floatingMenu = document.querySelector('.floatingMenu');

    if (menuBars && floatingMenu) {
        menuBars.addEventListener('click', () => {
            floatingMenu.classList.toggle('active');
        });
    }
});

// -------- Placeholder Animation --------
function animatePlaceholder() {
    const baseText = "Ask Alex";
    let dots = 0;

    setInterval(() => {
        dots = (dots + 1) % 4; // Cycle 0, 1, 2, 3
        let dotString = "";
        for (let i = 0; i < dots; i++) {
            dotString += ".";
        }
        input.setAttribute("placeholder", `${baseText}${dotString}`);
    }, 500); // Update every 500ms
}


// Start animations
animatePlaceholder();
