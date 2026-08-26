// -------- Globals --------
let knowledge = {};
let input = null;
let inputBox = null;
let sendBtn = null;
let responseBox = null;
let chatContainer = null;
let slashMenu = null;

const defaultWeatherLocation = {
    latitude: 42.3314,
    longitude: -83.0458,
    name: "Detroit"
};

function initElements() {
    input = document.getElementById("llmTxt");
    inputBox = document.querySelector(".inputBox");
    sendBtn = document.querySelector(".send");
    responseBox = document.querySelector(".responseBox");
    chatContainer = document.querySelector(".chat-container");
}

let questionCount = 0;
const wordSpeed = 4;
let welcomeShown = false;
const maxQuestions = 25;
let isExpanded = false;
let pendingWeatherConfirmation = false;
let pendingTimerRestart = false;
let activeTimer = null;
let noteMode = false;
let activeNoteEditor = null;
let activeNoteLine = null;
let draggedNoteLine = null;
const defaultStockSymbols = ["JNJ", "AAPL", "FIG", "SP500", "DOW"];
let stockSymbols = loadStockSymbols();


// -------- Normalize Input --------
function normalizeText(text) {
    return text.toLowerCase().replace(/[^\w\s]/gi, '').trim();
}

function loadStockSymbols() {
    try {
        const savedSymbols = JSON.parse(localStorage.getItem("essence-stock-symbols"));
        if (Array.isArray(savedSymbols) && savedSymbols.length > 0) {
            return savedSymbols.map(symbol => String(symbol).toUpperCase()).filter(Boolean);
        }
    } catch (error) {
        console.warn("Unable to load saved stock symbols", error);
    }
    return [...defaultStockSymbols];
}

function saveStockSymbols() {
    localStorage.setItem("essence-stock-symbols", JSON.stringify(stockSymbols));
}

function parseStockSymbols(value) {
    return [...new Set(String(value)
        .split(/[\s,]+/)
        .map(symbol => symbol.replace(/[^a-z0-9.=-]/gi, "").toUpperCase())
        .filter(symbol => /^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)))];
}

function resolveStockSymbol(symbol) {
    const normalized = String(symbol || "").toUpperCase();
    if (normalized === "SP500") {
        return {
            requestedSymbol: "SP500",
            providerSymbol: "^GSPC",
            delayedSymbol: "SPY",
            preferredName: "S&P 500"
        };
    }
    if (normalized === "DOW") {
        return {
            requestedSymbol: "DOW",
            providerSymbol: "^DJI",
            delayedSymbol: "DIA",
            preferredName: "Dow Jones"
        };
    }
    return {
        requestedSymbol: normalized,
        providerSymbol: normalized,
        delayedSymbol: normalized,
        preferredName: normalized
    };
}

function buildStockSummary(quotes) {
    return "";
}

function formatCompactValue(value) {
    if (!Number.isFinite(value)) return "N/A";
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 2
    }).format(value);
}

function isBiblePrompt(normalizedInput) {
    return /\b(?:bible|scripture|verse|script)\b/.test(normalizedInput);
}

function isStockPrompt(normalizedInput) {
    return /\b(?:stock|stocks|shares|market|watchlist|yahoo finance)\b/.test(normalizedInput);
}

const bibleReferences = [
    {
        book: "John",
        chapter: 1,
        verse: 12,
        label: "John 1:12",
        fallback: "But to all who did receive him, who believed in his name, he gave the right to become children of God,"
    },
    {
        book: "Psalms",
        chapter: 23,
        verse: 1,
        label: "Psalm 23:1",
        fallback: "The Lord is my shepherd; I shall not want."
    },
    {
        book: "Proverbs",
        chapter: 3,
        verse: 5,
        label: "Proverbs 3:5",
        fallback: "Trust in the Lord with all thine heart; and lean not unto thine own understanding."
    },
    {
        book: "Philippians",
        chapter: 4,
        verse: 13,
        label: "Philippians 4:13",
        fallback: "I can do all things through Christ which strengtheneth me."
    },
    {
        book: "Romans",
        chapter: 8,
        verse: 28,
        label: "Romans 8:28",
        fallback: "And we know that all things work together for good to them that love God,"
    }
];

let lastBibleReference = null;

async function getBibleVerse() {
    const availableReferences = bibleReferences.filter(reference => reference !== lastBibleReference);
    const reference = availableReferences[Math.floor(Math.random() * availableReferences.length)];
    lastBibleReference = reference;
    try {
        const response = await fetch(`https://bible.helloao.org/api/ENGESV/${reference.book}/${reference.chapter}.json`);
        if (!response.ok) throw new Error(`Bible request failed with ${response.status}`);
        const data = await response.json();
        const verse = data.verses?.find(item => Number(item.verse) === reference.verse);
        if (!verse?.text) throw new Error("Bible response did not contain the requested verse.");
        return {
            text: "Here is a scripture passage:",
            bible: { quote: verse.text, reference: reference.label, source: "https://bible.helloao.org" },
            instant: true
        };
    } catch (error) {
        console.error("Unable to load Bible verse", error);
        return {
            text: "Here is a scripture passage:",
            bible: {
                quote: reference.fallback,
                reference: reference.label,
                source: "https://bible.helloao.org"
            },
            instant: true
        };
    }
}

async function getDelayedStockQuote(symbolConfig) {
    const response = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(symbolConfig.delayedSymbol.toLowerCase())}.us&i=d`);
    if (!response.ok) throw new Error(`Delayed stock request failed with ${response.status}`);
    const rows = (await response.text()).trim().split("\n").slice(1).map(row => row.split(","));
    const closes = rows.map(row => Number(row[4])).filter(value => Number.isFinite(value)).slice(-30);
    const volumes = rows.map(row => Number(row[5])).filter(value => Number.isFinite(value)).slice(-30);
    const price = closes.at(-1);
    const previousClose = closes.at(-2);
    const volume = volumes.at(-1);
    if (!Number.isFinite(price) || !Number.isFinite(previousClose)) throw new Error("Delayed response did not contain quote data.");
    return {
        symbol: symbolConfig.requestedSymbol,
        name: `${symbolConfig.preferredName} (delayed)`,
        price,
        change: price - previousClose,
        changePercent: ((price - previousClose) / previousClose) * 100,
        closes,
        volume,
        delayed: true
    };
}

async function getStockQuote(symbolConfig) {
    const response = await fetch(`/api/stocks?symbol=${encodeURIComponent(symbolConfig.providerSymbol)}`);
    if (!response.ok) throw new Error(`Yahoo request failed with ${response.status}`);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const closes = result?.indicators?.quote?.[0]?.close?.filter(value => Number.isFinite(value)) || [];
    const volumes = result?.indicators?.quote?.[0]?.volume?.filter(value => Number.isFinite(value)) || [];
    const price = Number(meta?.regularMarketPrice ?? closes.at(-1));
    const previousClose = Number(meta?.previousClose ?? closes.at(-2));
    const volume = Number(meta?.regularMarketVolume ?? volumes.at(-1));
    if (!Number.isFinite(price) || !Number.isFinite(previousClose)) throw new Error("Yahoo response did not contain quote data.");
    return {
        symbol: symbolConfig.requestedSymbol,
        name: meta?.shortName || meta?.longName || symbolConfig.preferredName,
        price,
        change: price - previousClose,
        changePercent: ((price - previousClose) / previousClose) * 100,
        closes: closes.slice(-30),
        volume
    };
}

async function getProxyStockQuote(symbolConfig) {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbolConfig.providerSymbol)}?range=1mo&interval=1d&includePrePost=false`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy Yahoo request failed with ${response.status}`);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    const closes = result?.indicators?.quote?.[0]?.close?.filter(value => Number.isFinite(value)) || [];
    const volumes = result?.indicators?.quote?.[0]?.volume?.filter(value => Number.isFinite(value)) || [];
    const price = Number(meta?.regularMarketPrice ?? closes.at(-1));
    const previousClose = Number(meta?.previousClose ?? closes.at(-2));
    const volume = Number(meta?.regularMarketVolume ?? volumes.at(-1));
    const marketCap = Number(meta?.marketCap);
    if (!Number.isFinite(price) || !Number.isFinite(previousClose)) throw new Error("Proxy Yahoo response did not contain quote data.");
    return {
        symbol: symbolConfig.requestedSymbol,
        name: meta?.shortName || meta?.longName || symbolConfig.preferredName,
        price,
        change: price - previousClose,
        changePercent: ((price - previousClose) / previousClose) * 100,
        closes: closes.slice(-30),
        volume,
        marketCap,
        delayed: true
    };
}

async function getStockWatchlist() {
    const quotes = await Promise.all(stockSymbols.map(async symbol => {
        const resolvedSymbol = resolveStockSymbol(symbol);
        try {
            return await getStockQuote(resolvedSymbol);
        } catch (error) {
            console.error(`Unable to load quote for ${resolvedSymbol.requestedSymbol}`, error);
            try {
                return await getProxyStockQuote(resolvedSymbol);
            } catch (fallbackError) {
                console.error(`Unable to load proxy quote for ${resolvedSymbol.requestedSymbol}`, fallbackError);
                try {
                    return await getDelayedStockQuote(resolvedSymbol);
                } catch (delayedError) {
                    console.error(`Unable to load delayed quote for ${resolvedSymbol.requestedSymbol}`, delayedError);
                    return { symbol: resolvedSymbol.requestedSymbol, error: true, reason: "Stock API blocked or unavailable" };
                }
            }
        }
    }));
    const summary = buildStockSummary(quotes);
    return { text: "Today's market view:", stockTool: { quotes, summary }, instant: true };
}

async function getWeatherLocation() {
    if (!navigator.geolocation) return defaultWeatherLocation;

    return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
            position => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                name: "your location"
            }),
            () => resolve(defaultWeatherLocation),
            { timeout: 3500, maximumAge: 900000 }
        );
    });
}

function formatWeatherResponse(data, locationName) {
    const current = data.current || data.currentConditions || data.observation || data;
    const temperature = current.temperature ?? current.temp ?? current.temperatureF;
    const condition = current.condition?.text || current.weatherDescription || current.description || current.weather;
    const feelsLike = current.feelsLike ?? current.feels_like ?? current.feelsLikeF;

    if (temperature === undefined || !condition) {
        throw new Error("The weather response did not contain current conditions.");
    }

    const temperatureText = `${Math.round(Number(temperature))}°F`;
    const feelsLikeText = feelsLike === undefined
        ? ""
        : ` It feels like ${Math.round(Number(feelsLike))}°F.`;
    const advice = /rain|storm|snow|sleet/i.test(condition)
        ? "You may want a weatherproof layer and an umbrella."
        : Number(temperature) >= 75
            ? "Looks like a light shirt and some sunscreen would be a good call."
            : Number(temperature) <= 50
                ? "A warm layer would be a good idea."
                : "A light layer should do nicely today.";

    return `Today in ${locationName}, it is ${condition.toLowerCase()} with temperatures around ${temperatureText}.${feelsLikeText} ${advice}`;
}

async function getWeatherResponse() {
    try {
        const location = await getWeatherLocation();
        const headers = { Accept: "application/geo+json" };
        const pointsResponse = await fetch(`https://api.weather.gov/points/${location.latitude},${location.longitude}`, { headers });
        if (!pointsResponse.ok) throw new Error(`NWS points request failed with ${pointsResponse.status}`);

        const points = await pointsResponse.json();
        const forecastUrl = points.properties?.forecast;
        if (!forecastUrl) throw new Error("NWS did not return a forecast URL.");

        const forecastResponse = await fetch(forecastUrl, { headers });
        if (!forecastResponse.ok) throw new Error(`NWS forecast request failed with ${forecastResponse.status}`);

        const forecast = await forecastResponse.json();
        const period = forecast.properties?.periods?.[0];
        if (!period) throw new Error("NWS did not return a forecast period.");
        const precipitationChance = period.probabilityOfPrecipitation?.value;
        const precipitationText = precipitationChance === null || precipitationChance === undefined
            ? ""
            : ` There is a ${precipitationChance}% chance of precipitation.`;
        const advice = Number(period.temperature) >= 75
            ? "Looks like a light shirt and some sunscreen would be a good call."
            : Number(period.temperature) <= 50
                ? "A warm layer would be a good idea."
                : "A light layer should do nicely today.";

        return {
            text: `Today in ${location.name}, expect ${period.shortForecast.toLowerCase()} with a high around ${period.temperature}°${period.temperatureUnit}.${precipitationText} ${advice}`,
            instant: true
        };
    } catch (error) {
        console.error("Unable to load NWS weather data", error);
        return {
            text: "Hmm, I'm not sure about today's weather right now. I hope it's nice.",
            instant: true
        };
    }
}

function getWeatherConfirmation() {
    pendingWeatherConfirmation = true;
    return {
        text: "I can pull today's local forecast directly from {{weatherSite}}. Click or type <strong>Yes</strong> to continue. Your browser will ask for permission, and your location data is never saved.",
        weatherConfirmation: true,
        instant: true
    };
}

function parseTimerDuration(userInput) {
    const normalizedInput = normalizeText(userInput);
    const clockMatch = userInput.match(/\b(\d{1,2}):([0-5]\d)\b/);
    if (clockMatch) {
        return Number(clockMatch[1]) * 60 + Number(clockMatch[2]);
    }

    const durationMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?)/i);
    if (durationMatch) {
        const value = Number(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        if (unit.startsWith("hour")) return Math.round(value * 3600);
        if (unit.startsWith("min")) return Math.round(value * 60);
        return Math.round(value);
    }

    if (/\b(?:timer|countdown)\b/.test(normalizedInput)) {
        const bareNumber = normalizedInput.match(/\b\d+(?:\.\d+)?\b/);
        if (bareNumber) return Math.round(Number(bareNumber[0]));
    }

    return null;
}

function isTimerPrompt(userInput) {
    return /\b(?:set\s+(?:a\s+)?(?:timer|time)|need\s+(?:a\s+)?timer|start\s+(?:a\s+)?timer|countdown)\b/i.test(userInput) ||
        parseTimerDuration(userInput) !== null;
}

function formatTimerDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getTimerResponse(userInput) {
    const duration = parseTimerDuration(userInput);
    if (duration === null || duration <= 0) {
        return {
            text: "How long should I set the timer for? Try 30 seconds, 5 minutes, or 1:30.",
            instant: true
        };
    }

    return {
        text: `Timer set for ${formatTimerDuration(duration)}.`,
        timer: { duration },
        instant: true
    };
}

function formatNoteFilename() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    return `notes-${datePart}-${timePart}.md`;
}

function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const slashShortcuts = [
    {
        label: "Write a new note",
        value: "write a new note"
    },
    {
        label: "Check today's weather",
        value: "What's the weather like today?"
    },
    {
        label: "Read a Bible verse",
        value: "Show me a Bible verse"
    },
    {
        label: "View stock watchlist",
        value: "Show me stocks"
    },
    {
        label: "Set a timer to...",
        value: "Set a timer to ",
        sendOnSelect: false
    },
    {
        label: "Clear chat",
        value: "Clear chat",
        sendOnSelect: false
    }
];

function hideSlashMenu() {
    if (!slashMenu) return;
    slashMenu.classList.remove("is-visible");
    slashMenu.style.opacity = "0";
    slashMenu.style.transform = "translateY(10px)";
    slashMenu.style.pointerEvents = "none";

    const menuToRemove = slashMenu;
    setTimeout(() => {
        if (slashMenu === menuToRemove && menuToRemove.parentElement) {
            menuToRemove.remove();
            slashMenu = null;
        }
    }, 180);
}

function positionSlashMenu() {
    if (!inputBox || !slashMenu) return;

    const rect = inputBox.getBoundingClientRect();
    const menuWidth = rect.width;

    slashMenu.style.left = `${rect.left}px`;
    slashMenu.style.width = `${menuWidth}px`;
    slashMenu.style.top = "auto";
    slashMenu.style.bottom = `${rect.height + 6}px`;
}

function applySlashMenuLayout() {
    if (!slashMenu) return;

    const isCompact = window.matchMedia("(max-width: 917px)").matches;
    slashMenu.style.padding = isCompact ? "0 16px 32px 16px" : "0 0 32px 0";
}

function selectSlashShortcut(shortcut) {
    if (!input) initElements();
    if (!input) return;

    input.value = shortcut.value;
    hideSlashMenu();
    input.focus();

    if (shortcut.sendOnSelect === false) {
        return;
    }

    setTimeout(() => {
        sendMessage();
    }, 0);
}

function showSlashMenu() {
    if (!inputBox) initElements();
    if (!inputBox) return;

    if (!slashMenu || !document.body.contains(slashMenu)) {
        slashMenu = document.createElement("div");
        slashMenu.className = "slash-menu";
        slashMenu.style.position = "fixed";
        slashMenu.style.height = "100vh";
        slashMenu.style.overflow = "hidden";
        slashMenu.style.zIndex = "50";
        slashMenu.style.border = "none";
        slashMenu.style.borderBottom = "1px solid rgba(255, 255, 255, 0.9)";
        slashMenu.style.borderRadius = "0";
        slashMenu.style.background = "linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.22) 25%, rgba(0, 0, 0, 0.92) 78%, rgba(0, 0, 0, 1) 100%)";
        slashMenu.style.boxShadow = "none";
        slashMenu.style.backdropFilter = "none";
        applySlashMenuLayout();

        const label = document.createElement("div");
        label.textContent = "Lil Shortcuts";
        label.className = "slash-menu-label";
        slashMenu.appendChild(label);

        slashShortcuts.forEach(shortcut => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = shortcut.label;
            button.className = "slash-menu-item";

            button.addEventListener("click", () => selectSlashShortcut(shortcut));
            slashMenu.appendChild(button);
        });

        document.body.appendChild(slashMenu);
    }

    positionSlashMenu();
    applySlashMenuLayout();
    requestAnimationFrame(() => {
        if (!slashMenu) return;
        slashMenu.classList.add("is-visible");
        slashMenu.style.opacity = "1";
        slashMenu.style.transform = "translateY(0)";
    });
}

function isBareSlashShortcutInput(value) {
    if (value == null) return false;
    return /^\/\s*$/.test(String(value));
}

function normalizeSlashCommandText(value) {
    const text = String(value || "").trim();
    if (!text.startsWith("/")) return text;
    return text.replace(/^\/\s*/, "").trim();
}

function autoFormatSlashCommandInput(value) {
    const text = String(value || "");
    if (!text.startsWith("/")) return text;
    if (text.startsWith("/ ")) return text;
    if (text === "/") return text;
    return "/ " + text.slice(1).trim();
}

function updateSlashMenu() {
    if (!input) initElements();
    if (!input) return;

    const rawValue = input.value || "";

    if (isBareSlashShortcutInput(rawValue)) {
        showSlashMenu();
    } else {
        hideSlashMenu();
    }
}

const NOTE_LINE_FORMAT_CLASS = {
    heading: "note-line-heading",
    bold: "note-line-bold",
    bullet: "note-line-bullet",
    divider: "note-line-divider"
};

function syncNoteLineFormatClass(line) {
    line.classList.remove(
        NOTE_LINE_FORMAT_CLASS.heading,
        NOTE_LINE_FORMAT_CLASS.bold,
        NOTE_LINE_FORMAT_CLASS.bullet,
        NOTE_LINE_FORMAT_CLASS.divider
    );

    const format = line.dataset.noteFormat;
    if (format && NOTE_LINE_FORMAT_CLASS[format]) {
        line.classList.add(NOTE_LINE_FORMAT_CLASS[format]);
    }
}

function setNoteLineFormat(line, format) {
    if (!format) {
        delete line.dataset.noteFormat;
    } else {
        line.dataset.noteFormat = format;
    }

    if (line) {
        line.contentEditable = format !== "divider";
    }

    syncNoteLineFormatClass(line);
}

function applyMarkdownShortcutFormatting(line, { moveCaret = true } = {}) {
    if (!line) return false;

    const sourceText = line.innerText.replace(/\u00a0/g, " ");
    const rawText = sourceText.trim();
    if (!rawText) {
        setNoteLineFormat(line, "");
        return false;
    }

    let format = "";
    let content = rawText;

    if (/^#(?:\s|$)/.test(rawText)) {
        format = "heading";
        content = rawText.replace(/^#\s*/, "");
    } else if (/^---(?:\s|$)/.test(rawText)) {
        format = "divider";
        content = "";
    } else if (/^-(?!-).+/.test(rawText)) {
        format = "bullet";
        content = rawText.replace(/^-\s*/, "");
    } else {
        const boldMatch = rawText.match(/^\*\*(.+)\*\*$/);
        if (boldMatch) {
            format = "bold";
            content = boldMatch[1].trim();
        }
    }

    if (!format) return false;

    line.textContent = content;
    setNoteLineFormat(line, format);

    if (format === "divider") {
        line.textContent = "";
        line.setAttribute("aria-label", "Divider line");
        line.setAttribute("data-divider-line", "true");
        if (moveCaret) {
            line.focus();
        }
        return true;
    }

    if (moveCaret) {
        focusCaretAtEnd(line);
    }

    return true;
}

function serializeNoteLineForMarkdown(line) {
    const text = line.innerText.replace(/\u00a0/g, " ").trim();
    if (!text) return "";

    switch (line.dataset.noteFormat) {
        case "heading":
            return `# ${text}`;
        case "bold":
            return `**${text}**`;
        case "bullet":
            return `- ${text}`;
        case "divider":
            return "---";
        default:
            return text;
    }
}

function createNoteLine(text = "") {
    const line = document.createElement("div");
    line.className = "note-line";
    line.contentEditable = "true";
    line.spellcheck = false;
    line.tabIndex = 0;
    line.draggable = true;
    line.dataset.align = "left";
    line.dataset.fontSize = "20px";
    line.style.textAlign = "left";
    line.style.color = "var(--white)";

    if (text) {
        line.textContent = text;
        applyMarkdownShortcutFormatting(line, { moveCaret: false });
    } else {
        line.innerHTML = "";
    }

    const focusLine = () => {
        activeNoteLine = line;
    };

    line.addEventListener("focus", focusLine);
    line.addEventListener("mousedown", focusLine);
    line.addEventListener("click", focusLine);
    line.addEventListener("input", () => {
        applyMarkdownShortcutFormatting(line);
        activeNoteLine = line;
    });

    const clearDragState = () => {
        line.classList.remove("dragging", "drag-over");
        if (draggedNoteLine === line) {
            draggedNoteLine = null;
        }
    };

    line.addEventListener("dragstart", event => {
        draggedNoteLine = line;
        line.classList.add("dragging");
        event.dataTransfer?.setData("text/plain", "note-line");
        event.dataTransfer.effectAllowed = "move";
    });

    line.addEventListener("dragover", event => {
        if (!draggedNoteLine || draggedNoteLine === line) return;
        event.preventDefault();
        line.classList.add("drag-over");
        event.dataTransfer.dropEffect = "move";
    });

    line.addEventListener("dragleave", () => {
        line.classList.remove("drag-over");
    });

    line.addEventListener("drop", event => {
        event.preventDefault();
        if (!draggedNoteLine || draggedNoteLine === line) {
            clearDragState();
            return;
        }

        const parent = line.parentElement;
        if (!parent || !parent.contains(line)) {
            clearDragState();
            return;
        }

        parent.insertBefore(draggedNoteLine, line);
        activeNoteLine = draggedNoteLine;
        clearDragState();
        line.classList.remove("drag-over");
    });

    line.addEventListener("dragend", clearDragState);
    line.addEventListener("keydown", event => {
        if (line.dataset.noteFormat === "divider") {
            if (event.key === "Backspace" || event.key === "Delete") {
                event.preventDefault();
                line.remove();
                activeNoteLine = line.previousElementSibling || line.nextElementSibling || null;
                if (activeNoteLine) {
                    focusCaretAtEnd(activeNoteLine);
                }
                return;
            }

            if (event.key === "Enter") {
                event.preventDefault();
                insertNoteLineAfter(line);
                return;
            }
        }

        if (event.key === "Enter") {
            if (event.shiftKey) {
                event.preventDefault();
                insertSoftBreakInLine(line);
                return;
            }

            event.preventDefault();
            insertNoteLineAfter(line);
            return;
        }

        if (event.key === "Backspace" && isCaretAtLineStart(line)) {
            const currentText = line.innerText.replace(/\u00a0/g, " ").trim();
            const previousLine = line.previousElementSibling?.classList?.contains("note-line")
                ? line.previousElementSibling
                : null;

            if (!currentText) {
                event.preventDefault();
                if (previousLine) {
                    line.remove();
                    activeNoteLine = previousLine;
                    focusCaretAtEnd(previousLine);
                } else {
                    line.innerHTML = "<br>";
                }
                return;
            }

            if (previousLine) {
                event.preventDefault();
                const previousText = previousLine.innerText.replace(/\u00a0/g, " ");
                const mergedText = `${previousText}${currentText}`.trim();
                previousLine.innerText = mergedText || "";
                line.remove();
                activeNoteLine = previousLine;
                focusCaretAtEnd(previousLine);
            }
        }
    });

    return line;
}

function isCaretAtLineStart(line) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;

    const range = selection.getRangeAt(0);
    if (!line.contains(range.startContainer)) return false;

    const preRange = range.cloneRange();
    preRange.selectNodeContents(line);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length === 0;
}

function focusCaretAtEnd(line) {
    if (!line) return;

    requestAnimationFrame(() => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(line);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
        line.focus();
    });
}

function insertSoftBreakInLine(line) {
    if (!line) return false;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const br = document.createElement("br");

    if (range.collapsed) {
        range.insertNode(br);
        range.setStartAfter(br);
        range.setEndAfter(br);
        selection.removeAllRanges();
        selection.addRange(range);
        line.focus();
        return true;
    }

    range.deleteContents();
    range.insertNode(br);
    range.setStartAfter(br);
    range.setEndAfter(br);
    selection.removeAllRanges();
    selection.addRange(range);
    line.focus();
    return true;
}

function getActiveNoteLine() {
    if (activeNoteLine && activeNoteEditor?.contains(activeNoteLine)) {
        return activeNoteLine;
    }

    if (!activeNoteEditor) return null;

    return activeNoteEditor.querySelector(".note-line:last-child") || null;
}

function ensureNoteEditorLine() {
    if (!activeNoteEditor) return null;

    let line = activeNoteEditor.querySelector(".note-line:last-child");
    if (!line) {
        line = createNoteLine();
        activeNoteEditor.appendChild(line);
    }

    return line;
}

function insertNoteLineAfter(referenceLine) {
    if (!activeNoteEditor) return;

    const nextLine = createNoteLine();
    if (referenceLine && referenceLine.parentNode === activeNoteEditor) {
        referenceLine.insertAdjacentElement("afterend", nextLine);
    } else {
        activeNoteEditor.appendChild(nextLine);
    }

    activeNoteLine = nextLine;
    nextLine.focus();
}

function clearNoteEditor() {
    if (!activeNoteEditor) return;

    activeNoteEditor.innerHTML = "";
    const line = createNoteLine();
    activeNoteEditor.appendChild(line);
    activeNoteLine = line;
    line.focus();
}

function importNoteText(text) {
    if (!activeNoteEditor) return;

    activeNoteEditor.innerHTML = "";
    const lines = String(text).replace(/\r\n/g, "\n").split("\n");
    if (lines.length === 0) {
        clearNoteEditor();
        return;
    }

    lines.forEach(lineText => {
        const line = createNoteLine(lineText);
        activeNoteEditor.appendChild(line);
    });

    activeNoteLine = activeNoteEditor.querySelector(".note-line:last-child");
    activeNoteLine?.focus();

    if (responseBox) {
        responseBox.scrollTo({
            top: responseBox.scrollHeight,
            behavior: "smooth"
        });
    }
}

function updateNoteLineStyle(property, value) {
    const line = getActiveNoteLine() || ensureNoteEditorLine();
    if (!line) return;

    line.style[property] = value;
    if (property === "textAlign") {
        line.dataset.align = value;
    }
    if (property === "fontSize") {
        line.dataset.fontSize = value;
    }
    activeNoteLine = line;
    focusCaretAtEnd(line);
}

function createNotePanel() {
    const panel = document.createElement("div");
    panel.className = "note-mode-panel";

    const editor = document.createElement("div");
    editor.className = "note-mode-editor";
    editor.setAttribute("role", "group");

    const toolbar = document.createElement("div");
    toolbar.className = "note-mode-actions";

    const leftActions = document.createElement("div");
    leftActions.className = "note-mode-toolbar-group note-mode-toolbar-left";

    const rightActions = document.createElement("div");
    rightActions.className = "note-mode-toolbar-group note-mode-toolbar-right";

    const createActionButton = (label, handler) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sort-btn";
        button.textContent = label;
        button.addEventListener("click", handler);
        return button;
    };

    const fontSizeDropdown = document.createElement("div");
    fontSizeDropdown.className = "note-fontsize-dropdown";

    const fontSizeToggle = createActionButton("Type Size", () => {
        fontSizeDropdown.classList.toggle("is-open");
    });
    fontSizeToggle.classList.add("note-fontsize-toggle");

    const fontSizeList = document.createElement("ul");
    fontSizeList.className = "note-fontsize-list";

    const createFontSizeItem = (label, size) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "note-fontsize-option";
        button.textContent = label;
        button.addEventListener("click", () => {
            updateNoteLineStyle("fontSize", size);
            fontSizeDropdown.classList.remove("is-open");
        });
        item.appendChild(button);
        return item;
    };

    fontSizeList.appendChild(createFontSizeItem("Small", "16px"));
    fontSizeList.appendChild(createFontSizeItem("Body", "20px"));
    fontSizeList.appendChild(createFontSizeItem("Medium", "24px"));
    fontSizeList.appendChild(createFontSizeItem("Header", "56px"));
    fontSizeDropdown.appendChild(fontSizeToggle);
    fontSizeDropdown.appendChild(fontSizeList);

    const alignmentDropdown = document.createElement("div");
    alignmentDropdown.className = "note-alignment-dropdown";

    const alignmentToggle = createActionButton("Text Aligment", () => {
        alignmentDropdown.classList.toggle("is-open");
    });
    alignmentToggle.classList.add("note-alignment-toggle");

    const alignmentList = document.createElement("ul");
    alignmentList.className = "note-alignment-list";

    const createAlignmentItem = (label, align) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "note-alignment-option";
        button.textContent = label;
        button.addEventListener("click", () => {
            updateNoteLineStyle("textAlign", align);
            alignmentDropdown.classList.remove("is-open");
        });
        item.appendChild(button);
        return item;
    };

    alignmentList.appendChild(createAlignmentItem("Left", "left"));
    alignmentList.appendChild(createAlignmentItem("Center", "center"));
    alignmentList.appendChild(createAlignmentItem("Right", "right"));
    alignmentDropdown.appendChild(alignmentToggle);
    alignmentDropdown.appendChild(alignmentList);

    leftActions.appendChild(fontSizeDropdown);
    leftActions.appendChild(alignmentDropdown);

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "sort-btn";
    clearButton.textContent = "Clear";
    clearButton.addEventListener("click", () => {
        clearNoteEditor();
    });

    const importButton = document.createElement("button");
    importButton.type = "button";
    importButton.className = "sort-btn";
    importButton.textContent = "Import";

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".md,text/markdown,.txt,text/plain";
    importInput.style.display = "none";
    importInput.addEventListener("change", async () => {
        const file = importInput.files?.[0];
        importInput.value = "";
        if (!file) return;

        const isSupported = file.type === "text/plain" || file.type === "text/markdown" || file.name.toLowerCase().endsWith(".txt") || file.name.toLowerCase().endsWith(".md");
        if (!isSupported) {
            alert("Please import a .md or .txt file only.");
            return;
        }

        const content = await file.text();
        importNoteText(content);
    });
    importButton.addEventListener("click", () => importInput.click());

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "sort-btn";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => {
        const noteContent = Array.from(editor.querySelectorAll(".note-line"))
            .map(line => serializeNoteLineForMarkdown(line))
            .join("\n")
            .trim() || "";
        downloadTextFile(noteContent, formatNoteFilename());
    });

    const startLine = createNoteLine();
    editor.appendChild(startLine);

    rightActions.appendChild(clearButton);
    rightActions.appendChild(saveButton);
    rightActions.appendChild(importButton);

    toolbar.appendChild(leftActions);
    toolbar.appendChild(rightActions);

    panel.appendChild(editor);
    panel.appendChild(toolbar);
    panel.appendChild(importInput);

    activeNoteEditor = editor;
    activeNoteLine = startLine;
    return panel;
}

function appendNoteLine(text) {
    if (!activeNoteEditor) return;

    const cleanText = text.trim();
    if (!cleanText) return;

    appendNoteBlock(cleanText);
    ensureNoteEditorLine();

    if (responseBox) {
        responseBox.scrollTo({
            top: responseBox.scrollHeight,
            behavior: "smooth"
        });
    }
}

function enterNoteMode() {
    noteMode = true;
    input.placeholder = "Ask Alex...";
    appendMessage("ai", "Ok here is a space for your notes. Use the Save button to download as a .md file, Clear to reset, or Import a .md or .txt file.", true, {
        noteMode: true,
        instant: true
    });
}

function shouldEnterNoteMode(userText) {
    const rawText = String(userText || "").toLowerCase().trim();

    if (/^(?:\/\s*|\-)?notes?$/.test(rawText)) {
        return true;
    }

    if (/^(?:\/\s*)?(write|make|start|create)\s+(a\s+)?new\s+notes?\??$/.test(rawText)) {
        return true;
    }

    if (/^(?:\/\s*)?(write|make|start|create)\s+(a\s+)?note\??$/.test(rawText)) {
        return true;
    }

    if (/(?:^|\s)(?:\/\s*|\-)?notes?\b/.test(rawText)) {
        return true;
    }

    if (/\blet'?s\s+write\s+some\s+(?:\/\s*|\-)?notes?\b/.test(rawText)) {
        return true;
    }

    return false;
}

// -------- Load Knowledge JSON --------
async function loadKnowledge() {
    try {
        const res = await fetch("/api/knowledge");
        knowledge = await res.json();
    } catch (err) {
        console.error("Failed to load knowledge data", err);
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
    // Pre-process inline links into the message string if they exist
    let processedMsg = msg;
    if (extra?.inlineLinks && Array.isArray(extra.inlineLinks)) {
        extra.inlineLinks.forEach(linkInfo => {
            const escaped = linkInfo.searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, 'g');
            processedMsg = processedMsg.replace(regex, `<a href="${linkInfo.href}" target="_blank" style="color: white; text-decoration: none;">$1</a>`);
        });
    }

    // Trigger pattern change on user input
    if (sender === "user" && typeof window.changePattern === "function") {
        window.changePattern(processedMsg);
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

        if (extra.timer) {
            const timerContainer = document.createElement("div");
            timerContainer.className = "timer-container";
            timerContainer.style.width = "100%";
            timerContainer.style.maxWidth = "100%";
            timerContainer.style.alignSelf = "stretch";

            const timerDisplay = document.createElement("div");
            timerDisplay.className = "timer-display";
            timerContainer.appendChild(timerDisplay);

            const timerControls = document.createElement("div");
            timerControls.className = "timer-controls";

            const createTimerButton = (label, handler) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "sort-btn";
                button.textContent = label;
                button.addEventListener("click", handler);
                timerControls.appendChild(button);
            };

            if (activeTimer?.interval) clearInterval(activeTimer.interval);

            const timer = {
                remaining: extra.timer.duration,
                size: 1,
                interval: null,
                display: timerDisplay
            };

            const updateTimerDisplay = () => {
                const minutes = Math.floor(timer.remaining / 60);
                const seconds = timer.remaining % 60;
                timerDisplay.innerHTML = `${String(minutes).padStart(2, "0")}<span class="timer-colon">:</span>${String(seconds).padStart(2, "0")}`;
            };

            const finishTimer = () => {
                if (timer.interval) clearInterval(timer.interval);
                if (activeTimer === timer) activeTimer = null;
                pendingTimerRestart = true;
                appendMessage("ai", "Timer went off! Do you need to set a new timer?");
            };

            const stopTimer = () => {
                if (timer.interval) clearInterval(timer.interval);
                if (activeTimer === timer) activeTimer = null;
                pendingTimerRestart = false;
                timerDisplay.textContent = "Timer stopped.";
            };

            createTimerButton("1x size", () => {
                timer.size = 1;
                timerDisplay.classList.remove("timer-large");
            });
            createTimerButton("2x size", () => {
                timer.size = 2;
                timerDisplay.classList.add("timer-large");
            });
            createTimerButton("Stop timer", stopTimer);

            timerContainer.appendChild(timerControls);
            content.appendChild(timerContainer);
            activeTimer = timer;
            updateTimerDisplay();

            timer.interval = setInterval(() => {
                timer.remaining -= 1;
                updateTimerDisplay();
                if (timer.remaining <= 0) finishTimer();
            }, 1000);
        }

        if (extra.bible) appendBiblePanel(extra.bible, content);
        if (extra.stockTool) appendStockPanel(extra.stockTool, content);

        if (extra.weatherConfirmation) {
            const actions = document.createElement("div");
            actions.className = "weather-confirmation-actions";

            ["YES", "NO"].forEach(choice => {
                const action = document.createElement("button");
                action.type = "button";
                action.className = "weather-confirmation-action";
                action.textContent = choice;
                action.addEventListener("click", () => {
                    input.value = choice;
                    sendMessage();
                });
                actions.appendChild(action);
            });

            content.appendChild(actions);
        }

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

        if (extra.noteMode) {
            appendNoteEditor(content);
        }


        // Append standalone link if provided
        if (extra?.link && extra.inlineLink) {
            const allPs = content.querySelectorAll("p");
            const lastP = allPs[allPs.length - 1] || p;
            const a = document.createElement("a");
            a.href = extra.link.href;
            a.textContent = extra.link.text;
            if (!extra.link.sameTab) {
                a.target = "_blank";
            }
            a.style.color = "white";
            a.style.textDecoration = "underline";

            if (extra.link.fadeNavigate) {
                a.addEventListener("click", event => {
                    event.preventDefault();
                    document.body.classList.remove("loaded");
                    setTimeout(() => {
                        window.location.href = extra.link.href;
                    }, 500);
                });
            }

            lastP.append(" ");
            lastP.append(a);
        }

        if (callback) callback();
    }

    if (sender === "ai") {
        if (window.speechMode && window.speechMode.isActive && window.speechMode.isActive()) {
            // Speech Mode: Instant render + Speak
            p.innerHTML = processedMsg;
            appendExtras();

            // Speak
            window.speechMode.speak(p, () => {
                if (typeof window.stopPulseLoop === "function") {
                    window.stopPulseLoop();
                }
            });
        } else {
            // Normal mode: Split by <br><br> and animate paragraphs sequentially
            const paragraphs = processedMsg.split(/<br\s*\/?>\s*<br\s*\/?>/i);

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
        p.innerHTML = processedMsg;
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
    // If case study, force scroll to bottom to reveal content
    if (extra.caseStudy) {
        setTimeout(() => {
            responseBox.scrollTo({
                top: responseBox.scrollHeight,
                behavior: 'smooth'
            });
        }, 300); // Slight delay for rendering
    }

    // Original logic for other content
    else {
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

    return card;
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

function appendNoteEditor(container) {
    const panel = createNotePanel();
    container.appendChild(panel);
    requestAnimationFrame(() => {
        activeNoteLine?.focus();
    });
}

function appendBiblePanel(bible, container) {
    const panel = document.createElement("blockquote");
    panel.className = "bible-panel";
    if (bible.source) {
        const source = document.createElement("a");
        source.className = "bible-source";
        source.href = bible.source;
        source.target = "_blank";
        source.rel = "noreferrer";
        source.textContent = "Source: bible.helloao.org";
        panel.appendChild(source);
    }
    const quote = document.createElement("p");
    quote.className = "bible-quote";
    quote.textContent = `“${bible.quote}”`;
    const reference = document.createElement("cite");
    reference.textContent = `- ${bible.reference}`;
    panel.append(quote, reference);
    container.appendChild(panel);
}

function createStockChart(values) {
    const chart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chart.setAttribute("viewBox", "0 0 240 72");
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", "One month stock price trend");
    chart.classList.add("stock-chart");
    if (values.length < 2) return chart;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;
    const points = values.map((value, index) => {
        const x = (index / (values.length - 1)) * 240;
        const y = 64 - ((value - min) / spread) * 56;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", points);
    line.setAttribute("fill", "none");
    line.setAttribute("vector-effect", "non-scaling-stroke");
    chart.appendChild(line);
    return chart;
}

function appendStockPanel(stockTool, container) {
    const panel = document.createElement("section");
    panel.className = "stock-panel";
    panel.setAttribute("aria-label", "Stock watchlist");
    const header = document.createElement("div");
    header.className = "stock-panel-header";
    const title = document.createElement("h3");
    title.textContent = "Yahoo stocks";
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "stock-refresh";
    refresh.textContent = "Refresh";
    header.append(title, refresh);
    const summary = document.createElement("p");
    summary.className = "stock-summary";
    summary.textContent = stockTool.summary || "";
    summary.hidden = !summary.textContent;

    const form = document.createElement("form");
    form.className = "stock-add-form";
    const symbolInput = document.createElement("input");
    symbolInput.type = "text";
    symbolInput.placeholder = "Add symbols: MSFT, TSLA";
    symbolInput.setAttribute("aria-label", "Add stock symbols");
    const addButton = document.createElement("button");
    addButton.type = "submit";
    addButton.textContent = "Add";
    form.append(symbolInput, addButton);
    const list = document.createElement("div");
    list.className = "stock-list";
    panel.append(header, summary, list, form);
    container.appendChild(panel);

    const renderQuotes = quotes => {
        list.innerHTML = "";
        quotes.forEach(quote => {
            const card = document.createElement("article");
            card.className = "stock-card";
            const info = document.createElement("div");
            info.className = "stock-card-info";
            const symbol = document.createElement("strong");
            symbol.textContent = quote.symbol;
            const name = document.createElement("span");
            name.textContent = quote.error ? "Quote unavailable" : quote.name;
            info.append(symbol, name);
            const values = document.createElement("div");
            values.className = "stock-card-values";
            if (quote.error) {
                values.textContent = quote.reason || "Quote unavailable";
            } else {
                const direction = quote.change >= 0 ? "▲" : "▼";
                const volumeLabel = `Vol ${formatCompactValue(Number(quote.volume))}`;
                values.classList.add(quote.change >= 0 ? "stock-up" : "stock-down");
                values.innerHTML = `<span>${direction}</span> $${quote.price.toFixed(2)} <small>${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)</small>`;

                const volume = document.createElement("div");
                volume.className = "stock-card-volume";
                volume.textContent = volumeLabel;
                card.appendChild(volume);

                card.appendChild(createStockChart(quote.closes));
            }
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "stock-remove";
            remove.textContent = "Remove";
            remove.setAttribute("aria-label", `Remove ${quote.symbol}`);
            remove.addEventListener("click", () => {
                stockSymbols = stockSymbols.filter(item => item !== quote.symbol);
                if (stockSymbols.length === 0) stockSymbols = [...defaultStockSymbols];
                saveStockSymbols();
                refreshQuotes();
            });
            card.append(info, values, remove);
            list.appendChild(card);
        });
    };

    const refreshQuotes = async () => {
        refresh.disabled = true;
        refresh.textContent = "Loading...";
        const result = await getStockWatchlist();
        renderQuotes(result.stockTool.quotes);
        summary.textContent = result.stockTool.summary || "";
        summary.hidden = !summary.textContent;
        refresh.disabled = false;
        refresh.textContent = "Refresh";
    };

    form.addEventListener("submit", event => {
        event.preventDefault();
        const addedSymbols = parseStockSymbols(symbolInput.value);
        if (addedSymbols.length > 0) {
            stockSymbols = [...new Set([...stockSymbols, ...addedSymbols])];
            saveStockSymbols();
            symbolInput.value = "";
            refreshQuotes();
        }
    });
    refresh.addEventListener("click", refreshQuotes);
    renderQuotes(stockTool.quotes);
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
function processPlaceholders(text) {
    let inlineLinks = [];
    if (text.includes("{{time}}")) {
        text = text.replace("{{time}}", getDetroitTime());
    }
    if (text.includes("{{sean}}")){
        text = text.replace("{{sean}}", "Sean Klassen")
        inlineLinks.push({
            searchText: "Sean Klassen",
            href: knowledge.links?.sean || "https://www.linkedin.com/in/klassen/",
            lineText: "Sean Klassen"
        })
    }
    if (text.includes("{{weatherSite}}")) {
        text = text.replaceAll("{{weatherSite}}", "weather.gov");
        inlineLinks.push({
            searchText: "weather.gov",
            href: knowledge.links?.weatherSite || "https://www.weather.gov/",
            linkText: "weather.gov"
        });
    }
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
    if (text.includes("{{microsoft}}")) {
        const fullPhrase = "Microsoft Accessibility's adaptive controllers";
        text = text.replace("{{microsoft}}", fullPhrase);
        inlineLinks.push({
            searchText: fullPhrase,
            href: knowledge.links?.microsoft || "https://www.xbox.com/en-US/community/for-everyone/accessibility",
            linkText: fullPhrase
        });
    }
    if (text.includes("{{apple}}")) {
        const fullPhrase = "Apple's Inclusion & Diversity team";
        text = text.replace("{{apple}}", fullPhrase);
        inlineLinks.push({
            searchText: fullPhrase,
            href: knowledge.links?.apple || "https://www.apple.com/diversity/",
            linkText: fullPhrase
        });
    }
    if (text.includes("{{gameboy}}")){
        inlineLinks.push({
            searchText: "{{gameboy}}",
            href: knowledge.links?.gameboy || "https://en.wikipedia.org/wiki/Game_Boy",
            linkText: "Game Boy (1989)"
        });
    }
    if (text.includes("{{jnj}}")) {
        const fullPhrase = "JnJ MedTech's";
        text = text.replace("{{jnj}}", fullPhrase);
        inlineLinks.push({
            searchText: fullPhrase,
            href: knowledge.links?.jnj || "https://www.careers.jnj.com/en/",
            linkText: fullPhrase
        });
    }
    return { text, inlineLinks };
}

function buildParagraph(matchedKeys) {
    // Prioritize specific keys to avoid duplication
    const priority = ["background", "dream job", "philosophy", "name"];

    // Find the highest priority match
    for (const key of priority) {
        if (matchedKeys.includes(key) && knowledge.personal[key]) {
            let originalText = knowledge.personal[key];
            const processed = processPlaceholders(originalText);

            return {
                text: processed.text,
                color: key === "background" ? knowledge.personal.color : undefined,
                inlineLinks: processed.inlineLinks.length > 0 ? processed.inlineLinks : undefined
            };
        }
    }

    // Fallback: if no priority match, use the first matched key
    if (matchedKeys.length > 0 && knowledge.personal[matchedKeys[0]]) {
        let originalText = knowledge.personal[matchedKeys[0]];
        const processed = processPlaceholders(originalText);

        return {
            text: processed.text,
            color: undefined,
            inlineLinks: processed.inlineLinks.length > 0 ? processed.inlineLinks : undefined
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
    weather: ["weather", "wather", "what is the weather", "whats the weather", "what the weather like", "what the wather like", "how is the weather", "hows the weather", "temperature", "forecast"],
    education: ["education", "school", "educational background"],
    philosophy: ["philosophy", "motto", "design thinking"],
    background: ["background", "who is alex", "personal background", "story", "about alex", "tell me about"],
    skills: ["skills", "what skills", "bring to", "expertise", "capabilities"],
    availability: ["availability", "available", "when available", "hire", "start date", "when can you start"],
    weakness: ["weakness", "weaknesses", "areas for improvement"],
    deadlines: ["deadlines", "tight deadlines", "handle deadlines", "time pressure"],
    strength: ["strength", "strengths", "biggest strength", "what are you good at"],
    "successful project": ["successful project", "best project", "proudest project", "favorite project", "favourite project", "favorite personal project", "favorite case study", "favourite case study", "duolingo success"],
    resume: ["resume", "alex's resume", "CV", "cv"],
    coding: ["coding", "code", "programming", "development", "engineering", "cs", "computer science", "algorithm", "algorithms", "sort", "sorting"],
    favcolor: ["What is Alex's favorite color", "fav color", "favorite Color"],
    favproduct: ["What Alex's favorite product", "fav product", "favorite product", "fav toy", "fav inventions"]
};


// -------- Find Response --------
async function findResponse(userInput) {
    const normalizedInput = normalizeText(userInput);

    if (isTimerPrompt(userInput)) {
        return getTimerResponse(userInput);
    }

    if (isBiblePrompt(normalizedInput)) return getBibleVerse();
    if (isStockPrompt(normalizedInput)) return getStockWatchlist();

    // --- TIME FIRST ---
    const timeQueries = ["time", "current time", "currenttime", "what time is it", "located"];
    if (timeQueries.some(q => normalizedInput.includes(q))) {
        const detroitTime = new Date().toLocaleTimeString("en-US", {
            timeZone: "America/Detroit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
        const formattedDetroitTime = detroitTime.replace(/^0/, "").replace(" ", "");
        return {
            text: `It's currently ${formattedDetroitTime} in Detroit Metro Area (GMT-4). Here are a few other time zones I enjoy looking at! ↓`,
            worldClocks: true // Flag to render world clocks
        };
    }

    if (personalSynonyms.weather.some(q => normalizedInput.includes(q))) {
        return getWeatherConfirmation();
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
        const response = buildParagraph(["dream job"]);
        return {
            ...response,
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
            videos: ["video/Duolingo_ASL_Lily.mp4", "video/Duoling_Feature4.mp4"],
            text: `Favorite project:<br><br>
Duolingo ASL Case Study
<br><br>
Core Challenge: Integrating American Sign Language into Duolingo's rigid, world-class design system.
<br><br>
Execution: Combined UI design, accessibility strategy, and front-end code to build a functional proof-of-concept.
<br><br>
Impact: Proved how platforms can tap into major underserved markets without compromising core design constraints, with high social interaction on <a href="https://www.linkedin.com/feed/update/urn:li:activity:7264858607559598080/" target="_blank" style="color: white; text-decoration: underline;">LinkedIn</a>.
<br><br>
<a href="http://127.0.0.1:5519/duolingoasl.html" style="color: white; text-decoration: underline;">See Duolingo Case Study</a>`,
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

    if (matchedKeys.includes("favproduct")) {
        return {
            text: knowledge.personal["favproduct"],
            instant: true
        };
    }

    if (matchedKeys.includes("favcolor")) {
        return {
            text: knowledge.personal.favcolor,
            instant: true
        }
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
        normalizedInput.includes("proudest") ||
        normalizedInput.includes("favorite") ||
        normalizedInput.includes("favourite");

    if (!isAskingAboutSuccessfulProject && (
        normalizedInput.includes("project") ||
        normalizedInput.includes("projects") ||
        normalizedInput.includes("work") ||
        normalizedInput.includes("case studies")
    )) {
        return {
            text: "Here are some projects Alex has worked on. They are case studies that showcase his thinking and design skills, with an intermix of engineering mindset.",
            extra: { projects: knowledge.projects }
        };
    }

    // --- ARTICLES ---
    if (normalizedInput.includes("article") || normalizedInput.includes("writing")) {
        return {
            text: "Here are experiments and writing that explore new directions in systems, tools, and product design.",
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
                color: cs.color,
                caseStudy: cs
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

    return { text: "Hmm… I don't have an answer for that." };
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

function shouldClearChat(userText) {
    const rawText = String(userText || "").trim().toLowerCase();
    return /^(clear|clear chat|clear history|reset chat|reset history)$/.test(rawText);
}


// -------- Send Message --------
async function sendMessage() {
    if (!input || !responseBox) initElements();
    if (!input || !responseBox) return;

    const rawUserText = input.value.trim();
    if (!rawUserText) return;

    const safeUserText = normalizeSlashCommandText(rawUserText);
    const userText = safeUserText || rawUserText;
    const normalizedUserText = normalizeText(userText);

    if (shouldClearChat(userText)) {
        responseBox.innerHTML = "";
        questionCount = 0;
        welcomeShown = false;
        input.value = "";
        showWelcomeMessage();
        return;
    }

    if (shouldEnterNoteMode(rawUserText)) {
        enterNoteMode();
        input.value = "";
        return;
    }

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
    let answerObj;
    if (pendingTimerRestart && normalizedUserText === "yes") {
        pendingTimerRestart = false;
        answerObj = { text: "How long should I set the next timer for?" };
    } else if (pendingWeatherConfirmation && (normalizedUserText === "yes" || normalizedUserText === "no")) {
        pendingWeatherConfirmation = false;
        answerObj = normalizedUserText === "yes"
            ? await getWeatherResponse()
            : { text: "Hmm, I'm not sure what the weather will be today. I hope it's nice." };
    } else {
        answerObj = await findResponse(userText);
    }

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
        weatherConfirmation: answerObj.weatherConfirmation,
        timer: answerObj.timer,
        bible: answerObj.bible,
        stockTool: answerObj.stockTool
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
    projectWrapper.style.gap = "10vh";

    let i = 0;
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
            const currentScroll = responseBox.scrollTop;
            const peekAmount = window.innerHeight * 0.3;

            responseBox.scrollTo({
                top: currentScroll + peekAmount,
                behavior: 'smooth'
            });
        }
    }, 100);
}


// -------- Create individual project item --------
function createProjectItem(project) {
    const wrapper = document.createElement("a");
    wrapper.href = "#";
    wrapper.classList.add("fade-link");

    // Check if project is "Coming Soon"
    const isComingSoon = project.title.toLowerCase().includes("coming soon");

    if (isComingSoon) {
        wrapper.style.cursor = "default";
        wrapper.style.pointerEvents = "none";
    } else {
        wrapper.style.cursor = "pointer";
    }

    // Add click listener to load case study
    // Add click listener to load case study directly inline
    if (!isComingSoon) {
        wrapper.addEventListener("click", (e) => {
            e.preventDefault();

            // Find case study by title from knowledge tree
            let caseStudy = knowledge["case studies"][project.title];

            if (!caseStudy) {
                // Fallback search
                const key = Object.keys(knowledge["case studies"]).find(k =>
                    k.toLowerCase().includes(project.title.toLowerCase()) ||
                    project.title.toLowerCase().includes(k.toLowerCase())
                );
                if (key) caseStudy = knowledge["case studies"][key];
            }

            if (caseStudy) {
                // Create a new AI message container for the case study
                appendMessage("ai", `Here is the full case study for ${project.title}:`, false, {
                    caseStudy: caseStudy
                });
                if (caseStudy.link) {
                    // Trigger fade out
                    document.body.classList.remove('loaded');
                    // Wait for transition then navigate
                    setTimeout(() => {
                        window.location.href = caseStudy.link;
                    }, 500);
                }
            } else {
                console.log("No case study link found for:", project.title);
            }
        });
    }

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
// Helper to render a video block
const renderVideo = (files, widthMode, targetContainer) => {
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
            mediaEl.style.width = "calc(100% + 64px)";
            mediaEl.style.maxWidth = "none";
            mediaEl.style.marginLeft = "-32px";
            mediaEl.style.marginRight = "-32px";
            mediaEl.style.height = "auto";
            mediaEl.style.position = "relative";
            mediaEl.style.left = "0";

            mediaEl.classList.add("mediaSlideIn");
            setTimeout(() => {
                mediaEl.classList.add("show");
            }, 100);
        } else {
            mediaEl.style.width = "100%";
            mediaEl.style.height = "auto";
        }

        mediaEl.style.marginBottom = "var(--spacing-md)";
        (targetContainer || wrapper).appendChild(mediaEl);
    });
};


// Helper to render an image block
const renderImages = (files, widthClass, textContent = null, targetContainer) => {
    let widthStyle = "100%";
    let wrapperWidth = "100%";
    let alignment = null;

    if (widthClass === "sixty-left" || widthClass === "sixty-right" || widthClass === "sixty-middle") {
        wrapperWidth = "70%";
        widthStyle = "100%";
        if (widthClass === "sixty-left") alignment = "flex-start";
        else if (widthClass === "sixty-right") alignment = "flex-end";
        else if (widthClass === "sixty-middle") alignment = "center";
    } else if (widthClass === "w-50") {
        widthStyle = "calc(50% - var(--spacing-md) / 2)";
    } else if (widthClass === "w-40") {
        widthStyle = "calc(40% - var(--spacing-md) / 2)";
    } else if (widthClass === "w-60") {
        widthStyle = "calc(60% - var(--spacing-md) / 2)";
    } else if (widthClass === "w-100") {
        widthStyle = "100%";
    }

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

    if (textContent) {
        const textDiv = document.createElement("div");
        textDiv.innerHTML = textContent;
        textDiv.classList.add("split-view-paragraph");
        textDiv.style.flex = "1";
        textDiv.style.minWidth = "300px";
        textDiv.style.position = "sticky";
        textDiv.style.top = "20px";
        textDiv.style.alignSelf = "flex-start";
        imagesWrapper.appendChild(textDiv);
    }

    outerContainer.appendChild(imagesWrapper);
    (targetContainer || wrapper).appendChild(outerContainer);
};


// Helper to render text block
const renderText = (title, paragraph, layout, block, targetContainer) => {
    const bodyWrapper = document.createElement("div");
    bodyWrapper.classList.add("case-study-body");

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
            leftCol.appendChild(h2);
        }
        bodyWrapper.appendChild(leftCol);

        const rightCol = document.createElement("div");
        rightCol.style.flex = "1";
        if (block.intro_paragraph) {
            const p = document.createElement("p");
            p.innerHTML = block.intro_paragraph;
            rightCol.appendChild(p);
        }
        bodyWrapper.appendChild(rightCol);
    } else {
        if (title) {
            const h3 = document.createElement("h3");
            h3.textContent = title;
            bodyWrapper.appendChild(h3);
        }
        if (paragraph) {
            const p = document.createElement("p");
            p.innerHTML = paragraph;
            bodyWrapper.appendChild(p);
        }
    }
    (targetContainer || wrapper).appendChild(bodyWrapper);

    // Ensure no internal links have underlines
    bodyWrapper.querySelectorAll("a").forEach(a => a.style.textDecoration = "none");
};


// -------- Append Articles Grid --------
function appendArticlesGrid(articles, container) {
    const gridWrapper = document.createElement("div");
    gridWrapper.classList.add("articles-grid");
    gridWrapper.style.display = "grid";
    gridWrapper.style.gridTemplateColumns = "repeat(4, 1fr)";
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
    title.style.fontSize = "20px";
    title.style.fontWeight = "400";
    title.style.color = "var(--black)";
    title.style.lineHeight = "1.4";
    title.style.paddingRight = "12px";
    wrapper.appendChild(title);

    // Description (if exists)
    if (article.description) {
        const desc = document.createElement("p");
        desc.textContent = article.description;
        desc.style.fontSize = "20px";
        desc.style.color = "var(--black)";
        desc.style.lineHeight = "1.3";
        desc.style.margin = "0";
        desc.style.paddingRight = "12px";
        desc.style.paddingBlock = "64px";
        desc.style.paddingTop = "12px";
        wrapper.appendChild(desc);
    }

    return wrapper;
}


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
// Load knowledge immediately
const knowledgePromise = loadKnowledge();

window.addEventListener('load', async () => {
    initElements();

    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (input) input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

    await Promise.all([knowledgePromise]);

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
        const formattedInput = autoFormatSlashCommandInput(input.value);
        if (formattedInput !== input.value) {
            input.value = formattedInput;
        }

        updateSlashMenu();

        if (input.value.length > 0 && chatContainer) {
            chatContainer.classList.remove('show-helper');
        }

        if (!isBareSlashShortcutInput(input.value) && slashMenu) {
            hideSlashMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (slashMenu && slashMenu.classList.contains("is-visible")) {
            positionSlashMenu();
            applySlashMenuLayout();
        }
    });

    window.addEventListener("scroll", () => {
        if (slashMenu && slashMenu.classList.contains("is-visible")) {
            positionSlashMenu();
        }
    }, true);

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

    // Show welcome message on load only if on essence.html page (legacy)
    // Or if currently in essence mode (on refresh)
    if (document.body.classList.contains('essence-page') || document.body.classList.contains('essence-mode')) {
        showWelcomeMessage();
    }
});


// -------- Welcome Message --------
function showWelcomeMessage() {
    if (!responseBox) initElements();
    if (!responseBox) return;

    // Guard against multiple calls
    if (welcomeShown) return;
    welcomeShown = true;

    // Clear any existing content
    responseBox.innerHTML = "";

    const card = document.createElement("div");
    card.classList.add("chat-card");
    card.setAttribute("data-bg-color", "var(--primary)");

    const wrapper = document.createElement("div");
    wrapper.classList.add("aiMsg");

    const p = document.createElement("p");
    p.id = "IntroChat";
    p.classList.add("IntroChat");

    const welcomeText = "👋 I'm Essence — Alex's portfolio assistant. Ask me anything about his work, skills, or the weather.";

    wrapper.appendChild(p);
    card.appendChild(wrapper);
    responseBox.appendChild(card);

    // Observe for background color changes
    bgColorObserver.observe(card);

    // Type out welcome text for premium feel
    typeWriter(p, welcomeText, 20, () => {
        appendPrompts(wrapper);
    });
}


function appendPrompts(container) {
    if (!container) return;

    // Create clickable prompt links
    const prompts = [
        { text: "🎯 Target jobs", displayText: "What's Alex's dream job?", query: "dream job" },
        { text: "💼 Curent job", displayText: "What's Alex's current role?", query: "role" },
        { text: "🎓 Education", displayText: "What's Alex's educational background?", query: "education" },
        { text: "👤 About", displayText: "Tell me about Alex", query: "background" },
        { text: "🚀 Projects", displayText: "What projects has Alex worked on?", query: "projects" },
        { text: "🛠️ Skills", displayText: "What are Alex's skills?", query: "skills" },
        { text: "👨‍💻 Coding", displayText: "What is Alex's coding background?", query: "code" },
        { text: "📍 Time Zone", displayText: "What time zone is Alex In?", query: "located" },
        { text: "☀️ Weather", displayText: "What's the weather like today?", query: "weather" }
    ];

    const promptsContainer = document.createElement("div");
    promptsContainer.style.display = "flex";
    promptsContainer.style.flexWrap = "wrap";
    promptsContainer.style.gap = "12px";
    promptsContainer.style.marginTop = "24px";
    promptsContainer.style.opacity = "0";
    promptsContainer.style.transition = "opacity 0.6s ease";

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
        link.style.color = "var(--white)";
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

            // Re-fetch input if needed
            if (!input) input = document.getElementById("llmTxt");
            if (!input) return;

            // Show the display text in input
            input.value = prompt.displayText;

            // Trigger actual message send
            sendMessage();
        });

        promptsContainer.appendChild(link);
    });

    container.appendChild(promptsContainer);

    container.appendChild(promptsContainer);

    // Trigger fade in with slight delay to ensure DOM render
    setTimeout(() => {
        promptsContainer.style.opacity = "1";
    }, 50);
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
    if (!input) input = document.getElementById('llmTxt');
    if (!input) return;

    const baseText = "Ask Alex";
    let dots = 0;

    setInterval(() => {
        if (!input) input = document.getElementById('llmTxt');
        if (!input) return;

        dots = (dots + 1) % 4; // Cycle 0, 1, 2, 3
        let dotString = "";
        for (let i = 0; i < dots; i++) {
            dotString += ".";
        }
        input.setAttribute("placeholder", `${baseText}${dotString} `);
    }, 500); // Update every 500ms
}


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

    // Counting Sort Box
    const countingBox = createSortBox("Counting Sort");
    boxesContainer1.appendChild(countingBox);

    wrapper.appendChild(boxesContainer1);

    // 2. Boxes Container (Row 2)
    const boxesContainer2 = document.createElement("div");
    boxesContainer2.classList.add("boxes-container");
    boxesContainer2.style.marginTop = "20px"; // Space between rows

    // Insertion Sort Box
    const insertionBox = createSortBox("Insertion Sort");
    boxesContainer2.appendChild(insertionBox);

    // Quick Sort Box
    const quickBox = createSortBox("Quick Sort");
    boxesContainer2.appendChild(quickBox);

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
        renderBars(countingBox.querySelector(".bars-container"), arrayData, n, 'green');
        renderBars(insertionBox.querySelector(".bars-container"), arrayData, n, 'teal');
        renderBars(quickBox.querySelector(".bars-container"), arrayData, n, 'red');

        // Set initial stats text
        bubbleBox.querySelector(".box-stats").innerHTML = "O(n²)";
        countingBox.querySelector(".box-stats").innerHTML = "O(n + k)";
        insertionBox.querySelector(".box-stats").innerHTML = "O(n²)";
        quickBox.querySelector(".box-stats").innerHTML = "O(n log n)";

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
        const countingStats = countingBox.querySelector(".box-stats");
        const insertionStats = insertionBox.querySelector(".box-stats");
        const quickStats = quickBox.querySelector(".box-stats");

        bubbleStats.innerHTML = "Sorting...";
        countingStats.innerHTML = "Sorting...";
        insertionStats.innerHTML = "Sorting...";
        quickStats.innerHTML = "Sorting...";

        // Run all sorts
        const bubbleData = JSON.parse(JSON.stringify(arrayData));
        const countingData = JSON.parse(JSON.stringify(arrayData));
        const insertionData = JSON.parse(JSON.stringify(arrayData));
        const quickData = JSON.parse(JSON.stringify(arrayData));

        const p1 = runBubbleSort(bubbleBox.querySelector(".bars-container"), bubbleData, numItems, 'blue', speedConfig);
        const p2 = runCountingSort(countingBox.querySelector(".bars-container"), countingData, numItems, 'green', speedConfig);
        const p3 = runInsertionSort(insertionBox.querySelector(".bars-container"), insertionData, numItems, 'teal', speedConfig);
        const p4 = runQuickSort(quickBox.querySelector(".bars-container"), quickData, numItems, 'red', speedConfig);

        const [t1, t2, t3, t4] = await Promise.all([p1, p2, p3, p4]);

        bubbleStats.innerHTML = `${t1}ms (Steps: ${Math.floor(t1 / 20)})`;
        countingStats.innerHTML = `${t2}ms (Steps: ${Math.floor(t2 / 20)})`;
        insertionStats.innerHTML = `${t3}ms (Steps: ${Math.floor(t3 / 20)})`;
        quickStats.innerHTML = `${t4}ms (Steps: ${Math.floor(t4 / 20)})`;

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
    updateSpeedBtns();

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
            await new Promise(r => setTimeout(r, 100 * speedConfig.multiplier));

            if (data[i].value > data[i + 1].value) {
                // Swap
                let temp = data[i];
                data[i] = data[i + 1];
                data[i + 1] = temp;
                swapped = true;
                steps++;

                // Visualize Swap (Active moving)
                renderBars(container, data, maxN, theme, [i + 1], [i], speedConfig);
                await new Promise(r => setTimeout(r, 100 * speedConfig.multiplier));
            }
        }
        n--;
    } while (swapped);
    renderBars(container, data, maxN, theme, [], [], speedConfig);
    return Date.now() - startTime;
}


// COUNTING SORT
async function runCountingSort(container, data, maxN, theme, speedConfig = { multiplier: 1 }) {
    const startTime = Date.now();
    let n = data.length;

    // 1. Find the maximum value
    let max = 0;
    for (let i = 0; i < n; i++) {
        if (data[i].value > max) max = data[i].value;
    }

    // 2. Count occurrences
    const count = new Array(max + 1).fill(0);
    const countMap = {};

    for (let i = 0; i < n; i++) {
        // Visualize Scanning
        renderBars(container, data, maxN, theme, [i], [], speedConfig);
        await new Promise(r => setTimeout(r, 60 * speedConfig.multiplier));

        const val = data[i].value;
        count[val]++;
        if (!countMap[val]) countMap[val] = [];
        countMap[val].push(data[i]);
    }

    // 3. Reconstruct the array
    let index = 0;
    for (let val = 0; val <= max; val++) {
        while (count[val] > 0) {
            data[index] = countMap[val].shift();
            // Visualize Reconstruction
            renderBars(container, data, maxN, theme, [index], [], speedConfig);
            await new Promise(r => setTimeout(r, 80 * speedConfig.multiplier));
            index++;
            count[val]--;
        }
    }

    renderBars(container, data, maxN, theme, [], [], speedConfig);
    return Date.now() - startTime;
}


// INSERTION SORT
async function runInsertionSort(container, data, maxN, theme, speedConfig = { multiplier: 1 }) {
    const startTime = Date.now();
    let n = data.length;
    for (let i = 1; i < n; i++) {
        let key = data[i];
        let j = i - 1;
        while (j >= 0 && data[j].value > key.value) {
            renderBars(container, data, maxN, theme, [j, j + 1], [i], speedConfig);
            await new Promise(r => setTimeout(r, 60 * speedConfig.multiplier));
            data[j + 1] = data[j];
            j = j - 1;
        }
        data[j + 1] = key;
        renderBars(container, data, maxN, theme, [j + 1], [], speedConfig);
        await new Promise(r => setTimeout(r, 100 * speedConfig.multiplier));
    }
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