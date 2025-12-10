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

        // Skills should append to content (msgContent), not wrapper
        if (extra.skills) appendSkillsGrid(extra.skills, content);
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

        // Append World Clocks if provided
        if (extra.worldClocks) {
            appendWorldClocks(content);
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
        } else {
            // Normal mode: Split by <br><br> and animate paragraphs sequentially
            const paragraphs = msg.split(/<br\s*\/?>\s*<br\s*\/?>/i);

            // Remove the default <p> since we'll create multiple
            p.remove();

            const paragraphElements = [];
            paragraphs.forEach((paragraphText, index) => {
                const paragraphElement = document.createElement("p");
                paragraphElement.innerHTML = paragraphText.trim();
                paragraphElement.style.position = "relative";
                paragraphElement.style.animation = `slideIn 0.8s ease ${index * 0.3}s forwards`;
                paragraphElement.style.opacity = "0"; // Start hidden

                content.appendChild(paragraphElement);
                paragraphElements.push(paragraphElement);
            });

            // Append inline link to the last paragraph if provided
            if (extra?.link && extra.inlineLink && paragraphElements.length > 0) {
                const lastParagraph = paragraphElements[paragraphElements.length - 1];
                const a = document.createElement("a");
                a.href = extra.link.href;
                a.textContent = extra.link.text;
                a.target = "_blank";
                lastParagraph.append(" ");
                lastParagraph.append(a);
            }

            // Append extras after all paragraphs are added
            const totalDelay = paragraphs.length * 0.3 * 1000;
            setTimeout(() => {
                appendExtras();
            }, totalDelay);

            // Stop pulse after animation completes
            if (typeof window.stopPulseLoop === "function") {
                setTimeout(() => {
                    window.stopPulseLoop();
                }, totalDelay + 800); // Animation duration + last paragraph delay
            }
        }
    } else {
        // User message: always instant
        p.innerHTML = msg;
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

    // Smart Scroll Logic
    if (!extra.caseStudy) {
        setTimeout(() => {
            if (extra.worldClocks) {
                // Force scroll to bottom to show clocks
                responseBox.scrollTo({
                    top: responseBox.scrollHeight,
                    behavior: 'smooth'
                });
                return;
            }
            const cardHeight = card.offsetHeight;
            const viewportHeight = window.innerHeight;
            const isShortResponse = cardHeight < (viewportHeight * 0.4);

            if (isShortResponse) {
                // Short response: Scroll to show the whole thing
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                // Long response: Center the interaction (User Q + Start of A)
                const prevCard = card.previousElementSibling;
                if (prevCard) {
                    prevCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
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
    testimonies: ["testimonies", "recommendation", "what people say", "references", "feedback"],
    resume: ["resume", "alex's resume", "CV", "cv"]
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
        return {
            text: `Here is the current time in Detroit and across the globe.`,
            worldClocks: true // Flag to render world clocks
        };
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

     // Check for "resume" to include Resume PDF
    if (matchedKeys.includes("resume")) {
        // knowledgeTree.json exposes resume_post with text and link
        return {
            text: knowledge.resume_post?.text || "Check out the resume:",
            link: knowledge.resume_post?.link,
            inlineLink: true,
            instant: true
        };
    }

    // Priority checks for specific interview questions BEFORE general matching
    // This prevents "tell me about alex's strength" from matching "background"

    if (matchedKeys.includes("strengths")) {
        return {
            text: knowledge.personal["strengths"],
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
    // Don't show all projects if they're asking about successful/best/proudest project
    const isAskingAboutSuccessfulProject = normalizedInput.includes("successful") ||
        normalizedInput.includes("best") ||
        normalizedInput.includes("proudest");

    if (!isAskingAboutSuccessfulProject && (
        normalizedInput.includes("project") ||
        normalizedInput.includes("projects") ||
        normalizedInput.includes("work") ||
        normalizedInput.includes("case studies")
    )) {
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

    // 1. Show user message immediately
    appendMessage("user", userText);
    questionCount++;

    if (questionCount > maxQuestions) {
        const limitMsg = "Wow, you really like to inquire about me! 😉 Why not have a meeting? Contact Alex on <a href='https://www.linkedin.com/in/alex-kauffman' target='_blank'>LinkedIn</a>.";
        appendMessage("ai", limitMsg);

        // Trigger scatter effect
        if (typeof window.scatterParticles === "function") {
            window.scatterParticles();
        }

        input.disabled = true;
        input.placeholder = "Limit reached.";
        return;
    }

    // 2. Show thinking indicator
    const thinkingIndicator = document.createElement("div");
    thinkingIndicator.classList.add("thinking-indicator");
    thinkingIndicator.innerHTML = `
        <div class="dot-pulse"></div>
        <div class="dot-pulse"></div>
        <div class="dot-pulse"></div>
    `;
    responseBox.appendChild(thinkingIndicator);

    // Scroll to show thinking indicator
    responseBox.scrollTo({
        top: responseBox.scrollHeight,
        behavior: 'smooth'
    });

    // 3. Get response (with artificial thinking delay)
    const answerObj = await findResponse(userText);

    // Add artificial delay for "thinking" feel (800ms - 1500ms random)
    const thinkingDelay = 800 + Math.random() * 700;
    await new Promise(resolve => setTimeout(resolve, thinkingDelay));

    // 4. Remove thinking indicator
    thinkingIndicator.remove();

    // 5. Show AI response
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
        inlineLinks: answerObj.inlineLinks,
        worldClocks: answerObj.worldClocks
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
    projectWrapper.style.display = "flex";
    projectWrapper.style.flexDirection = "column";
    projectWrapper.style.gap = "10vh"; // Big gap for spacing

    let i = 0;
    // Layout pattern: 0: Full(100), 1: Split(50/40), 2: Wide(80) ... repeat
    let patternIndex = 0;

    while (i < projects.length) {
        const project = projects[i];

        // Pattern 0: Full Width (100%)
        if (patternIndex === 0) {
            const fullWidthDiv = document.createElement("div");
            fullWidthDiv.classList.add("w-100");

            const projectItem = createProjectItem(project);
            fullWidthDiv.appendChild(projectItem);
            projectWrapper.appendChild(fullWidthDiv);

            i++;
            patternIndex = 1;
        }
        // Pattern 1: Split (50% / 40%) - Requires 2 projects
        else if (patternIndex === 1 && i + 1 < projects.length) {
            const nextProject = projects[i + 1];

            const flexBox = document.createElement("div");
            flexBox.classList.add("flexBox");
            flexBox.style.alignItems = "start";

            // Left Item (50%)
            const firstDiv = document.createElement("div");
            firstDiv.classList.add("w-50");
            const firstItem = createProjectItem(project);
            firstDiv.appendChild(firstItem);

            // Spacer (5%)
            const spacerDiv = document.createElement("div");
            spacerDiv.classList.add("w-05");

            // Right Item (40%)
            const secondDiv = document.createElement("div");
            secondDiv.classList.add("w-40");
            const secondItem = createProjectItem(nextProject);
            secondDiv.appendChild(secondItem);

            // End Spacer (5%) - to balance if needed, or just leave empty space on right
            const endSpacer = document.createElement("div");
            endSpacer.classList.add("w-05");

            flexBox.appendChild(firstDiv);
            flexBox.appendChild(spacerDiv);
            flexBox.appendChild(secondDiv);
            flexBox.appendChild(endSpacer);

            projectWrapper.appendChild(flexBox);

            i += 2;
            patternIndex = 2;
        }
        // Pattern 2: Wide (80%)
        else if (patternIndex === 2) {
            const wideDiv = document.createElement("div");
            wideDiv.classList.add("w-80");

            const projectItem = createProjectItem(project);
            wideDiv.appendChild(projectItem);
            projectWrapper.appendChild(wideDiv);

            i++;
            patternIndex = 0; // Reset to full width
        }
        // Fallback: If pattern expects 2 items but only 1 left, show as full or wide
        else {
            const fullWidthDiv = document.createElement("div");
            fullWidthDiv.classList.add("w-100");

            const projectItem = createProjectItem(project);
            fullWidthDiv.appendChild(projectItem);
            projectWrapper.appendChild(fullWidthDiv);

            i++;
            patternIndex = 0;
        }
    }

    container.appendChild(projectWrapper);

    // Scroll to peek at projects (not all the way to bottom)
    setTimeout(() => {
        if (responseBox) {
            // Scroll down just enough to show a peek (30vh)
            const currentScroll = responseBox.scrollTop;
            const peekAmount = window.innerHeight * 0.3; // 30% of viewport height

            responseBox.scrollTo({
                top: currentScroll + peekAmount,
                behavior: 'smooth'
            });
        }
    }, 100); // Small delay to ensure DOM is updated
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
            appendMessage("ai", `Here is the case study for ${project.title}: `, false, {
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
            div.innerHTML = `< span style = "opacity: 0.6" > ${label}:</span > ${text} `;
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

            // Create a simple 50/50 flexbox layout for Related Work
            const flexBox = document.createElement("div");
            flexBox.classList.add("flexBox");
            flexBox.style.alignItems = "start";
            flexBox.style.gap = "32px";

            randomProjects.forEach(project => {
                const projectDiv = document.createElement("div");
                projectDiv.classList.add("w-50");

                const projectItem = createProjectItem(project);
                projectDiv.appendChild(projectItem);
                flexBox.appendChild(projectDiv);
            });

            container.appendChild(flexBox);
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

    // Show welcome message on load only if on essence.html page
    // On index.html, the welcome message is triggered by modeToggle.js
    if (document.body.classList.contains('essence-page')) {
        showWelcomeMessage();
    }
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

    const welcomeText = "👋 I'm Essence — Alex's portfolio assistant.<br>Ask me anything about his work, skills, or vision.";

    // Create clickable prompt links
    const prompts = [
        { text: "💭 Dream job", displayText: "What's Alex's dream job?", query: "dream job" },
        { text: "💼 Current role", displayText: "What's Alex's current role?", query: "role" },
        { text: "🎓 Education", displayText: "What's Alex's educational background?", query: "education" },
        { text: "👤 About Alex", displayText: "Tell me about Alex", query: "background" },
        { text: "🚀 Projects", displayText: "What projects has Alex worked on?", query: "projects" },
        { text: "⚡ Skills", displayText: "What are Alex's skills?", query: "skills" }
    ];

    const appendPrompts = () => {
        p.appendChild(document.createElement("br"));
        p.appendChild(document.createElement("br"));

        const promptsContainer = document.createElement("div");
        promptsContainer.style.display = "flex";
        promptsContainer.style.flexWrap = "wrap";
        promptsContainer.style.gap = "12px";
        promptsContainer.style.marginTop = "24px";

        prompts.forEach((prompt, index) => {
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = prompt.text;
            link.style.cursor = "pointer";
            link.style.padding = "12px 20px";
            link.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            link.style.border = "1px solid rgba(255, 255, 255, 0.2)";
            link.style.borderRadius = "100rem";
            link.style.fontSize = "16px";
            link.style.transition = "all 0.2s ease";
            link.style.textDecoration = "none";
            link.style.display = "inline-block";

            link.addEventListener("mouseenter", () => {
                link.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                link.style.borderColor = "rgba(255, 255, 255, 0.4)";
                link.style.transform = "translateY(-2px)";
            });

            link.addEventListener("mouseleave", () => {
                link.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                link.style.borderColor = "rgba(255, 255, 255, 0.2)";
                link.style.transform = "translateY(0)";
            });

            link.addEventListener("click", async (e) => {
                e.preventDefault();

                // Show the display text in input
                input.value = prompt.displayText;

                // But use the query for the actual search
                const userText = prompt.displayText;
                if (!userText) return;

                // 1. Show user message
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

                // 2. Show thinking indicator
                const thinkingIndicator = document.createElement("div");
                thinkingIndicator.classList.add("thinking-indicator");
                thinkingIndicator.innerHTML = `
                    <div class="dot-pulse"></div>
                    <div class="dot-pulse"></div>
                    <div class="dot-pulse"></div>
                `;
                responseBox.appendChild(thinkingIndicator);

                // Scroll to show thinking indicator
                responseBox.scrollTo({
                    top: responseBox.scrollHeight,
                    behavior: 'smooth'
                });

                // 3. Get response (with artificial thinking delay)
                const answerObj = await findResponse(prompt.query);

                // Add artificial delay for "thinking" feel (800ms - 1500ms random)
                const thinkingDelay = 800 + Math.random() * 700;
                await new Promise(resolve => setTimeout(resolve, thinkingDelay));

                // 4. Remove thinking indicator
                thinkingIndicator.remove();

                // 5. Show AI response
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

            promptsContainer.appendChild(link);
        });

        p.appendChild(promptsContainer);
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
        input.setAttribute("placeholder", `${baseText}${dotString} `);
    }, 500); // Update every 500ms
}


// Start animations
animatePlaceholder();

// Expose showWelcomeMessage globally for mode toggle
window.showWelcomeMessage = showWelcomeMessage;
