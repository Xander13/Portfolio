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

        if (extra.worldClocks) {
            appendWorldClocks(content);
        }

        // Append Sorting Visualization if provided
        if (extra.sorting) {
            const hr = document.createElement("div");
            hr.classList.add("separator-line");
            content.appendChild(hr);
            appendSortingVisualization(content);
        }

        // Append Fourier Visualization if provided
        if (extra.fourier) {
            appendFourierVisualization(content);
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
    resume: ["resume", "alex's resume", "CV", "cv"],
    coding: ["coding", "code", "programming", "development", "engineering", "cs", "computer science", "algorithm", "algorithms", "sort", "sorting"],
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
            text: `Alex works in Eastern Standard Time, based in Detroit. Here are a few other clocks I enjoy looking at!`,
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


    if (matchedKeys.includes("coding")) {
        return {
            text: knowledge.personal["Coding"] || "Alex bridges the gap between design and engineering, using computational thinking to build functional, accessible systems.",
            sorting: true,
            instant: true
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

    // --- SWEET SPOT ---
    if (normalizedInput.includes("sweet spot") || normalizedInput.includes("human maximum") || normalizedInput.includes("predictive analytics")) {
        return {
            text: `<h3>"Modeling the Human Maximum" Where Predictive Analytics Meets Human Factors</h3><br>
            I treat data as a living landscape. Using Predictive Modeling, I map the relationship between system performance and human capability. The resulting surface isn't just a statistical distribution—it's a map of Access.<br><br>
            While the sorting algorithms provide the structural integrity (the 'Build'), the Philosophy of Accessibility determines the height of the peak. By using regression analysis to identify the 'Sweet Spot,' I ensure that my designs aren't just mathematically correct, but humanly optimal. The peak represents the moment where complexity vanishes, leaving only a seamless, inclusive experience.`,
            instant: true
        };
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
        worldClocks: answerObj.worldClocks,
        sorting: answerObj.sorting,
        fourier: answerObj.fourier
    });

    input.value = "";
}

// ------- Project Grid Sections -------
function appendProjectsGrid(projects, container, skipSpaceTop = false) {
    // Create wrapper with .project class to match index.html
    const projectWrapper = document.createElement("div");
    projectWrapper.classList.add("project", "essence-project-grid");
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
        { text: "⚡ Skills", displayText: "What are Alex's skills?", query: "skills" },
        { text: "👨‍💻 Coding Background", displayText: "What is Alex's coding background?", query: "code" },
        { text: "🌍 World Clocks", displayText: "What time is it?", query: "time" }
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
                    inlineLinks: answerObj.inlineLinks,
                    sorting: answerObj.sorting,
                    worldClocks: answerObj.worldClocks,
                    fourier: answerObj.fourier
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

// -------- Sorting Visualization --------
function appendSortingVisualization(container) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("sorting-wrapper");

    // 1. Boxes Container (Row 1)
    const boxesContainer1 = document.createElement("div");
    boxesContainer1.classList.add("boxes-container");

    // Bubble Sort Box
    const bubbleBox = createSortBox("Bubble Sort");
    boxesContainer1.appendChild(bubbleBox);

    // Merge Sort Box
    const mergeBox = createSortBox("Merge Sort");
    boxesContainer1.appendChild(mergeBox);

    wrapper.appendChild(boxesContainer1);

    // 2. Boxes Container (Row 2)
    const boxesContainer2 = document.createElement("div");
    boxesContainer2.classList.add("boxes-container");
    boxesContainer2.style.marginTop = "20px"; // Space between rows

    // Quick Sort Box
    const quickBox = createSortBox("Quick Sort");
    boxesContainer2.appendChild(quickBox);

    // Heap Sort Box
    const heapBox = createSortBox("Heap Sort");
    boxesContainer2.appendChild(heapBox);

    wrapper.appendChild(boxesContainer2);


    // 3. Stats & Controls
    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("controls-container");

    // Buttons Row
    const btnRow = document.createElement("div");
    btnRow.classList.add("btn-row");

    // Helper to create styled buttons
    const createBtn = (text, onClick) => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.classList.add("sort-btn");
        btn.onclick = onClick;
        return btn;
    };

    const isSorterMobile = window.innerWidth <= 930;
    let numItems = isSorterMobile ? 6 : 12;
    const maxItems = isSorterMobile ? 12 : 30;
    let arrayData = [];
    let isSorted = false;

    // Helper to init arrays
    const initArrays = (n) => {
        arrayData = [];
        // Generate values 1 to n
        for (let i = 1; i <= n; i++) {
            arrayData.push({
                value: i,
                id: i
            });
        }

        // Shuffle (Fisher-Yates)
        for (let i = arrayData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arrayData[i], arrayData[j]] = [arrayData[j], arrayData[i]];
        }

        renderBars(bubbleBox.querySelector(".bars-container"), arrayData, n, 'blue');
        renderBars(mergeBox.querySelector(".bars-container"), arrayData, n, 'green');
        renderBars(quickBox.querySelector(".bars-container"), arrayData, n, 'red');
        renderBars(heapBox.querySelector(".bars-container"), arrayData, n, 'teal');

        // Set initial stats text
        bubbleBox.querySelector(".box-stats").innerHTML = "O(n²)";
        mergeBox.querySelector(".box-stats").innerHTML = "O(n log n)";
        quickBox.querySelector(".box-stats").innerHTML = "O(n log n)";
        heapBox.querySelector(".box-stats").innerHTML = "O(n log n)";

        isSorted = false;

        // Reset Run Button if it exists
        if (typeof runBtn !== 'undefined') {
            runBtn.textContent = "Run Sort";
            runBtn.disabled = false;
        }
    };

    const minusBtn = createBtn("-", () => {
        if (numItems > 5) {
            numItems--;
            initArrays(numItems);
        }
    });

    const plusBtn = createBtn("+", () => {
        if (numItems < maxItems) {
            numItems++;
            initArrays(numItems);
        }
    });

    const runBtn = createBtn("Run Sort", async () => {
        if (isSorted) {
            // Restart / Shuffle behavior
            initArrays(numItems);
            return;
        }

        runBtn.disabled = true;
        minusBtn.disabled = true;
        plusBtn.disabled = true;

        const bubbleStats = bubbleBox.querySelector(".box-stats");
        const mergeStats = mergeBox.querySelector(".box-stats");
        const quickStats = quickBox.querySelector(".box-stats");
        const heapStats = heapBox.querySelector(".box-stats");

        bubbleStats.innerHTML = "Sorting...";
        mergeStats.innerHTML = "Sorting...";
        quickStats.innerHTML = "Sorting...";
        heapStats.innerHTML = "Sorting...";

        // Run all sorts
        const bubbleData = JSON.parse(JSON.stringify(arrayData));
        const mergeData = JSON.parse(JSON.stringify(arrayData));
        const quickData = JSON.parse(JSON.stringify(arrayData));
        const heapData = JSON.parse(JSON.stringify(arrayData));

        const p1 = runBubbleSort(bubbleBox.querySelector(".bars-container"), bubbleData, numItems, 'blue', speedConfig);
        const p2 = runMergeSort(mergeBox.querySelector(".bars-container"), mergeData, numItems, 'green', speedConfig);
        const p3 = runQuickSort(quickBox.querySelector(".bars-container"), quickData, numItems, 'red', speedConfig);
        const p4 = runHeapSort(heapBox.querySelector(".bars-container"), heapData, numItems, 'teal', speedConfig);

        const [t1, t2, t3, t4] = await Promise.all([p1, p2, p3, p4]);

        bubbleStats.innerHTML = `${t1}ms (Steps: ${Math.floor(t1 / 20)})`;
        mergeStats.innerHTML = `${t2}ms (Steps: ${Math.floor(t2 / 20)})`;
        quickStats.innerHTML = `${t3}ms (Steps: ${Math.floor(t3 / 20)})`;
        heapStats.innerHTML = `${t4}ms (Steps: ${Math.floor(t4 / 20)})`;

        // Enable buttons and switch to Restart
        runBtn.disabled = false;
        runBtn.textContent = "Restart";
        minusBtn.disabled = false;
        plusBtn.disabled = false;
        isSorted = true;
    });
    runBtn.classList.add("run-sort-btn");

    // Speed Controls
    const speedConfig = { multiplier: 1 };

    const btn1x = createBtn("1x", () => {
        speedConfig.multiplier = 1;
        updateSpeedBtns();
    });
    const btn2x = createBtn("2x", () => {
        speedConfig.multiplier = 2; // 2x slower (double delay)
        updateSpeedBtns();
    });

    const updateSpeedBtns = () => {
        // Simple active state style
        if (speedConfig.multiplier === 1) {
            btn1x.style.backgroundColor = "white";
            btn1x.style.color = "black";
            btn2x.style.backgroundColor = "transparent";
            btn2x.style.color = "var(--white)";
        } else {
            btn2x.style.backgroundColor = "white";
            btn2x.style.color = "black";
            btn1x.style.backgroundColor = "transparent";
            btn1x.style.color = "var(--white)";
        }
    };
    updateSpeedBtns(); // Init state

    btnRow.appendChild(minusBtn);
    btnRow.appendChild(plusBtn);
    btnRow.appendChild(runBtn);
    btnRow.appendChild(btn1x);
    btnRow.appendChild(btn2x);

    controlsContainer.appendChild(btnRow);
    wrapper.appendChild(controlsContainer);

    container.appendChild(wrapper);

    // Initial Render
    initArrays(numItems);
}

function createSortBox(title) {
    const box = document.createElement("div");
    box.classList.add("w-50", "sort-box");

    const titleEl = document.createElement("h4");
    titleEl.textContent = title;
    box.appendChild(titleEl);

    const barsContainer = document.createElement("div");
    barsContainer.classList.add("bars-container");
    box.appendChild(barsContainer);

    const statsEl = document.createElement("div");
    statsEl.classList.add("box-stats");
    statsEl.style.marginTop = "10px";
    statsEl.style.fontSize = "12px";
    statsEl.style.color = "var(--gray)";
    statsEl.style.textAlign = "center";
    statsEl.style.fontFamily = "monospace";
    box.appendChild(statsEl);

    return box;
}

function renderBars(container, data, maxN, colorTheme = 'blue', activeIndices = [], compareIndices = [], speedConfig = { multiplier: 1 }) {
    const transitionDuration = `${0.1 * speedConfig.multiplier}s`;
    const maxVal = maxN || Math.max(...data.map(d => d.value));
    const widthPct = 100 / data.length;

    // Initialize if empty or mismatch
    if (container.children.length !== data.length) {
        container.innerHTML = "";
        container.style.position = "relative";
        container.style.display = "block";

        data.forEach((item, idx) => {
            const barWrapper = document.createElement("div");
            barWrapper.setAttribute("data-id", item.id);
            barWrapper.style.position = "absolute";
            barWrapper.style.bottom = "0";
            barWrapper.style.left = `${idx * widthPct}%`;
            barWrapper.style.width = `${widthPct}%`;
            barWrapper.style.height = "100%";
            barWrapper.style.display = "flex";
            barWrapper.style.flexDirection = "column";
            barWrapper.style.justifyContent = "flex-end";
            barWrapper.style.alignItems = "center";
            barWrapper.style.padding = "0 2px";
            barWrapper.style.transition = `left ${transitionDuration} ease-in-out`;

            const label = document.createElement("div");
            label.textContent = item.value;
            label.classList.add("bar-label");
            label.style.width = "24px";
            label.style.height = "24px";
            label.style.display = "flex";
            label.style.justifyContent = "center";
            label.style.alignItems = "center";
            label.style.marginBottom = "4px";
            label.style.fontWeight = "bold";
            label.style.fontSize = "10px";
            label.style.borderRadius = "100rem";
            label.style.transition = "all 0.1s ease";
            label.style.color = "var(--gray)";
            label.style.backgroundColor = "transparent";
            label.style.border = "1px solid transparent";

            const bar = document.createElement("div");
            bar.classList.add("sort-bar");
            bar.classList.add(colorTheme);
            bar.style.width = "100%";
            bar.style.height = `${(item.value / maxVal) * 100}%`;

            barWrapper.appendChild(label);
            barWrapper.appendChild(bar);
            container.appendChild(barWrapper);
        });
    }

    // Update positions and styles
    data.forEach((item, idx) => {
        const wrapper = container.querySelector(`[data-id="${item.id}"]`);
        if (!wrapper) return;

        wrapper.style.left = `${idx * widthPct}%`;
        wrapper.style.transition = `left ${transitionDuration} ease-in-out`;

        const label = wrapper.querySelector(".bar-label");
        const isActive = activeIndices.includes(idx);
        const isCompare = compareIndices.includes(idx);

        if (isActive) {
            label.style.backgroundColor = "white";
            label.style.color = "black";
            label.style.border = "1px solid white";
        } else if (isCompare) {
            label.style.backgroundColor = "transparent";
            label.style.color = "white";
            label.style.border = "1px solid white";
        } else {
            label.style.backgroundColor = "transparent";
            label.style.color = "var(--gray)";
            label.style.border = "1px solid transparent";
        }
    });
}

// BUBBLE SORT
async function runBubbleSort(container, data, maxN, theme, speedConfig = { multiplier: 1 }) {
    const startTime = Date.now();
    let n = data.length;
    let swapped;
    let steps = 0;
    do {
        swapped = false;
        for (let i = 0; i < n - 1; i++) {
            // Visualize comparison
            renderBars(container, data, maxN, theme, [i], [i + 1], speedConfig);
            await new Promise(r => setTimeout(r, 100 * speedConfig.multiplier)); // Delay for comparison

            if (data[i].value > data[i + 1].value) {
                // Swap
                let temp = data[i];
                data[i] = data[i + 1];
                data[i + 1] = temp;
                swapped = true;
                steps++;

                // Visualize Swap (Active moving)
                renderBars(container, data, maxN, theme, [i + 1], [i], speedConfig);
                await new Promise(r => setTimeout(r, 100 * speedConfig.multiplier)); // Delay
            }
        }
        n--;
    } while (swapped);
    renderBars(container, data, maxN, theme, [], [], speedConfig);
    return Date.now() - startTime;
}

// MERGE SORT
async function runMergeSort(container, data, maxN, theme, speedConfig = { multiplier: 1 }) {
    const startTime = Date.now();

    async function mergeSortHelper(arr, startIdx) {
        if (arr.length <= 1) return arr;

        const mid = Math.floor(arr.length / 2);
        const left = await mergeSortHelper(arr.slice(0, mid), startIdx);
        const right = await mergeSortHelper(arr.slice(mid), startIdx + mid);

        return await merge(left, right, startIdx);
    }

    async function merge(left, right, startIdx) {
        let resultArray = [], leftIndex = 0, rightIndex = 0;

        // Visualize Processing Range (Active work area)
        let rangeIndices = [];
        for (let k = 0; k < left.length + right.length; k++) {
            rangeIndices.push(startIdx + k);
        }
        // Show range
        renderBars(container, data, maxN, theme, [], rangeIndices, speedConfig);
        await new Promise(r => setTimeout(r, 80 * speedConfig.multiplier));

        while (leftIndex < left.length && rightIndex < right.length) {
            if (left[leftIndex].value < right[rightIndex].value) {
                resultArray.push(left[leftIndex]);
                leftIndex++;
            } else {
                resultArray.push(right[rightIndex]);
                rightIndex++;
            }
        }

        resultArray = resultArray.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));

        // Update the main data array with sorted slice
        for (let i = 0; i < resultArray.length; i++) {
            data[startIdx + i] = resultArray[i];
            // Visualize Updating (Active element)
            renderBars(container, data, maxN, theme, [startIdx + i], rangeIndices, speedConfig);
            await new Promise(r => setTimeout(r, 50 * speedConfig.multiplier));
        }

        renderBars(container, data, maxN, theme, [], [], speedConfig);
        return resultArray;
    }

    await mergeSortHelper(data, 0);
    renderBars(container, data, maxN, theme, [], [], speedConfig);
    return Date.now() - startTime;
}

// QUICK SORT
async function runQuickSort(container, data, maxN, theme, speedConfig = { multiplier: 1 }) {
    const startTime = Date.now();

    async function partition(arr, low, high) {
        let pivot = arr[high];
        // Visualize Pivot Highlighting
        renderBars(container, data, maxN, theme, [high], [], speedConfig);
        await new Promise(r => setTimeout(r, 50 * speedConfig.multiplier));

        let i = low - 1;

        for (let j = low; j < high; j++) {
            // Visualize Comparison: j vs pivot
            renderBars(container, data, maxN, theme, [high], [j], speedConfig);
            await new Promise(r => setTimeout(r, 80 * speedConfig.multiplier));

            if (arr[j].value < pivot.value) {
                i++;
                // Swap
                [arr[i], arr[j]] = [arr[j], arr[i]];

                // Visualize Swap
                renderBars(container, data, maxN, theme, [high, i], [j], speedConfig);
                await new Promise(r => setTimeout(r, 80 * speedConfig.multiplier));
            }
        }
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        renderBars(container, data, maxN, theme, [i + 1], [], speedConfig);
        await new Promise(r => setTimeout(r, 80 * speedConfig.multiplier));
        return i + 1;
    }

    async function quickSortHelper(arr, low, high) {
        if (low < high) {
            let pi = await partition(arr, low, high);
            await quickSortHelper(arr, low, pi - 1);
            await quickSortHelper(arr, pi + 1, high);
        }
    }

    await quickSortHelper(data, 0, data.length - 1);
    renderBars(container, data, maxN, theme, [], [], speedConfig);
    return Date.now() - startTime;
}

// HEAP SORT
async function runHeapSort(container, data, maxN, theme, speedConfig = { multiplier: 1 }) {
    const startTime = Date.now();
    let n = data.length;

    async function heapify(arr, n, i) {
        let largest = i;
        let l = 2 * i + 1;
        let r = 2 * i + 2;

        // Visualize Root Check
        renderBars(container, data, maxN, theme, [i], [l < n ? l : -1], speedConfig);
        await new Promise(r => setTimeout(r, 40 * speedConfig.multiplier));

        if (l < n && arr[l].value > arr[largest].value) largest = l;
        if (r < n && arr[r].value > arr[largest].value) largest = r;

        if (largest !== i) {
            [arr[i], arr[largest]] = [arr[largest], arr[i]];
            // Visualize Swap
            renderBars(container, data, maxN, theme, [largest], [i], speedConfig);
            await new Promise(r => setTimeout(r, 80 * speedConfig.multiplier));
            await heapify(arr, n, largest);
        }
    }

    // Build heap (rearrange array)
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(data, n, i);
    }

    // One by one extract an element from heap
    for (let i = n - 1; i > 0; i--) {
        [data[0], data[i]] = [data[i], data[0]]; // Move current root to end

        // Visualize Extraction
        renderBars(container, data, maxN, theme, [i], [0], speedConfig);
        await new Promise(r => setTimeout(r, 80 * speedConfig.multiplier));

        await heapify(data, i, 0); // call max heapify on the reduced heap
    }

    renderBars(container, data, maxN, theme, [], [], speedConfig);
    return Date.now() - startTime;
}
