// -------- Globals --------
let knowledge = {};
let scratchKnowledge = {};
let input = null;
let sendBtn = null;
let responseBox = null;
let chatContainer = null;

const defaultWeatherLocation = {
    latitude: 42.3314,
    longitude: -83.0458,
    name: "Detroit"
};

function initElements() {
    input = document.getElementById("llmTxt");
    sendBtn = document.querySelector(".send");
    responseBox = document.querySelector(".responseBox");
    chatContainer = document.querySelector(".chat-container");
}

let questionCount = 0;
const wordSpeed = 4;
let welcomeShown = false;
const maxQuestions = 25; // No limit on questions
let isExpanded = false;
let pendingWeatherConfirmation = false;
let scratchMode = false;
const scratchStorageKey = "essenceScratchHistory";
const scratchStateKey = "essenceScratchState";


// -------- Normalize Input --------
function normalizeText(text) {
    return text.toLowerCase().replace(/[^\w\s]/gi, '').trim();
}

function getScratchHistory() {
    try {
        return JSON.parse(sessionStorage.getItem(scratchStorageKey) || "[]");
    } catch (error) {
        console.error("Unable to read scratch history", error);
        return [];
    }
}

function saveScratchMessage(sender, text) {
    const history = getScratchHistory();
    history.push({ sender, text });
    sessionStorage.setItem(scratchStorageKey, JSON.stringify(history));
}

function getScratchState() {
    try {
        return JSON.parse(sessionStorage.getItem(scratchStateKey) || "null") || {
            turn: 0,
            patternId: null,
            recentResponseIds: []
        };
    } catch (error) {
        console.error("Unable to read scratch state", error);
        return { turn: 0, patternId: null, recentResponseIds: [] };
    }
}

function saveScratchState(state) {
    sessionStorage.setItem(scratchStateKey, JSON.stringify(state));
}

function clearScratchMode() {
    scratchMode = false;
    sessionStorage.removeItem(scratchStorageKey);
    sessionStorage.removeItem(scratchStateKey);
}

function enterScratchMode() {
    scratchMode = true;
    if (responseBox) {
        responseBox.style.display = "";
        responseBox.style.opacity = "1";
    }
    const introText = scratchKnowledge.intro || "How can I help you think today?";
    sessionStorage.setItem(scratchStorageKey, JSON.stringify([
        { sender: "ai", text: introText }
    ]));
    saveScratchState({ turn: 0, patternId: null, recentResponseIds: [] });
    return {
        text: introText,
        scratchIntro: true,
        instant: true
    };
}

function formatScratchNumber(value) {
    if (!Number.isFinite(value)) return null;
    const rounded = Math.round(value * 10000000000) / 10000000000;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function evaluateScratchExpression(expression) {
    const compactExpression = expression.replace(/[×x]/gi, "*").replace(/÷/g, "/").replace(/,/g, "").replace(/\s+/g, "");
    if (!compactExpression || !/^[\d.()+\-*/%]+$/.test(compactExpression)) return null;

    const rawTokens = compactExpression.match(/\d+(?:\.\d+)?|[()+\-*/%]/g) || [];
    if (rawTokens.join("") !== compactExpression) return null;

    const tokens = [];
    rawTokens.forEach((token, index) => {
        const previous = rawTokens[index - 1];
        if (token === "-" && (index === 0 || ["(", "+", "-", "*", "/", "%"].includes(previous))) {
            const next = rawTokens[index + 1];
            if (next && /^\d/.test(next)) {
                tokens.push(String(-Number(next)));
                rawTokens[index + 1] = "";
                return;
            }
        }
        if (token) tokens.push(token);
    });

    const values = [];
    const operators = [];
    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };
    const applyOperator = () => {
        const operator = operators.pop();
        const right = values.pop();
        const left = values.pop();
        if (left === undefined || right === undefined || (operator === "/" && right === 0)) return false;
        const result = operator === "+" ? left + right
            : operator === "-" ? left - right
                : operator === "*" ? left * right
                    : operator === "/" ? left / right
                        : left % right;
        if (!Number.isFinite(result)) return false;
        values.push(result);
        return true;
    };

    for (const token of tokens) {
        if (/^-?\d/.test(token)) {
            values.push(Number(token));
        } else if (token === "(") {
            operators.push(token);
        } else if (token === ")") {
            while (operators.length && operators.at(-1) !== "(") {
                if (!applyOperator()) return null;
            }
            if (operators.pop() !== "(") return null;
        } else if (precedence[token]) {
            while (operators.length && precedence[operators.at(-1)] >= precedence[token]) {
                if (!applyOperator()) return null;
            }
            operators.push(token);
        } else {
            return null;
        }
    }

    while (operators.length) {
        if (operators.at(-1) === "(") return null;
        if (!applyOperator()) return null;
    }

    return values.length === 1 ? formatScratchNumber(values[0]) : null;
}

function findScratchPerson(people, name) {
    const normalizedName = normalizeText(name);
    return people.find(person => person.key === normalizedName) || people.find(person =>
        normalizedName.startsWith(person.key) || person.key.startsWith(normalizedName)
    );
}

function solveScratchWordProblem(userInput) {
    if (!/\b(?:had|has|have)\b/i.test(userInput) || !/\b\d+\s+[A-Za-z]+\b/i.test(userInput)) return null;

    const people = [];
    const initialPattern = /\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:had|has|have)\s+(\d+)\s+([A-Za-z]+)\b/gi;
    let initialMatch;
    while ((initialMatch = initialPattern.exec(userInput))) {
        const key = normalizeText(initialMatch[1]);
        if (!people.some(person => person.key === key)) {
            people.push({
                key,
                name: initialMatch[1].trim(),
                amount: Number(initialMatch[2]),
                changes: [],
                index: initialMatch.index
            });
        }
    }
    if (people.length === 0) return null;

    const personBefore = index => people.filter(person => person.index < index).at(-1);
    const atePattern = /\b(?:ate|lost|used)\s+(\d+)(?:\s+of them|\s+[A-Za-z]+)?/gi;
    let actionMatch;
    while ((actionMatch = atePattern.exec(userInput))) {
        const person = personBefore(actionMatch.index);
        if (person) {
            const amount = Number(actionMatch[1]);
            person.amount -= amount;
            person.changes.push(`- ${amount}`);
        }
    }

    const stolenPattern = /\bstole\s+(\d+)(?:\s+[A-Za-z]+)?\s+from\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/gi;
    while ((actionMatch = stolenPattern.exec(userInput))) {
        const thief = personBefore(actionMatch.index);
        const donor = findScratchPerson(people, actionMatch[2]);
        if (thief && donor) {
            const amount = Number(actionMatch[1]);
            thief.amount += amount;
            donor.amount -= amount;
            thief.changes.push(`+ ${amount}`);
            donor.changes.push(`- ${amount}`);
        }
    }

    const lines = people.map(person => {
        const calculation = `${escapeScratchText(person.name)}: ${person.changes.length ? `${person.amount - person.changes.reduce((sum, change) => sum + (change.startsWith("+") ? Number(change.slice(1)) : -Number(change.slice(1))), 0)} ${person.changes.join(" ")} = ` : ""}${person.amount}`;
        return calculation;
    });
    const total = people.reduce((sum, person) => sum + person.amount, 0);
    const calculator = scratchKnowledge.calculator || {};
    return `${calculator.wordProblemIntro || "Let's map the quantities step by step:"}<br><br>${lines.join("<br>")}<br><br>${calculator.totalLabel || "Together"}: ${total}`;
}

function solveScratchComparison(userInput) {
    if (!/\b(?:difference|differ|apart|less|more)\b/i.test(userInput)) return null;

    const measurements = [];
    const measurementPattern = /(\d+(?:\.\d+)?)\s*(inches?|centimeters?|cm|feet|ft|meters?|m|pounds?|lbs?|ounces?|oz|degrees?|°[cf])/gi;
    let measurementMatch;
    while ((measurementMatch = measurementPattern.exec(userInput))) {
        measurements.push({
            value: Number(measurementMatch[1]),
            unit: measurementMatch[2].toLowerCase()
        });
    }
    if (measurements.length < 2) return null;

    const firstUnit = measurements[0].unit;
    const sameUnit = measurements.every(measurement => {
        const unit = measurement.unit;
        return unit === firstUnit ||
            (firstUnit.startsWith("inch") && unit.startsWith("inch")) ||
            (firstUnit.startsWith("cent") && (unit === "cm" || unit.startsWith("cent"))) ||
            (firstUnit.startsWith("foot") && unit === "ft") ||
            (firstUnit.startsWith("meter") && unit === "m") ||
            (firstUnit.startsWith("pound") && unit.startsWith("lb")) ||
            (firstUnit.startsWith("ounce") && unit.startsWith("oz"));
    });
    if (!sameUnit) return null;

    const difference = formatScratchNumber(Math.abs(measurements[0].value - measurements[1].value));
    const calculator = scratchKnowledge.calculator || {};
    return `${calculator.comparisonIntro || "Let's compare the two measurements:"}<br><br>${measurements[0].value} ${measurements[0].unit} - ${measurements[1].value} ${measurements[1].unit} = ${difference} ${firstUnit}`;
}

function findScratchNotationResponse(userInput) {
    const normalizedInput = normalizeText(userInput);
    const notations = (scratchKnowledge.calculator?.notations || []).filter(notation =>
        notation.triggers.some(trigger => normalizedInput.includes(normalizeText(trigger)))
    );
    if (notations.length === 0) return null;

    const lines = notations.map(notation =>
        `${escapeScratchText(notation.label)}: <strong>${notation.symbol}</strong><br>${escapeScratchText(notation.meaning)}`
    );
    return `Here is the notation:<br><br>${lines.join("<br><br>")}`;
}

function solveScratchTimeMath(userInput) {
    const timeMatch = userInput.match(/\b(\d{1,2}):([0-5]\d)\b/);
    const hoursMatch = userInput.match(/(\d+(?:\.\d+)?)\s*hours?/i);
    if (!timeMatch || !hoursMatch) return null;

    const startMinutes = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
    const addedMinutes = Math.round(Number(hoursMatch[1]) * 60);
    const resultMinutes = startMinutes + addedMinutes;
    const resultHour = Math.floor((resultMinutes / 60) % 24);
    const resultMinute = resultMinutes % 60;
    const result = `${String(resultHour).padStart(2, "0")}:${String(resultMinute).padStart(2, "0")}`;
    const calculator = scratchKnowledge.calculator || {};
    return `${calculator.timeIntro || "Let's add the time:"}<br><br>${timeMatch[0]} + ${hoursMatch[1]} hours = ${result}`;
}

function solveScratchTemperature(userInput) {
    const temperatureMatch = userInput.match(/(-?\d+(?:\.\d+)?)\s*(?:degrees?\s*)?(celsius|fahrenheit|°c|°f|c|f)?\b/i);
    if (!temperatureMatch || !/(?:temp|temperature|degrees?|celsius|fahrenheit|°c|°f)/i.test(userInput)) return null;

    const value = Number(temperatureMatch[1]);
    const unit = temperatureMatch[2]?.toLowerCase();
    const isFahrenheit = unit === "f" || unit === "°f" || unit === "fahrenheit";
    const isCelsius = unit === "c" || unit === "°c" || unit === "celsius";
    const format = number => formatScratchNumber(number);
    const calculator = scratchKnowledge.calculator || {};

    if (isFahrenheit) {
        return `${calculator.conversionIntro || "Let's convert that temperature:"}<br><br>${value}°F = ${format((value - 32) * 5 / 9)}°C`;
    }

    if (isCelsius) {
        return `${calculator.conversionIntro || "Let's convert that temperature:"}<br><br>${value}°C = ${format(value * 9 / 5 + 32)}°F`;
    }

    return `${calculator.conversionIntro || "Let's convert that temperature:"}<br><br>${value}°C = ${format(value * 9 / 5 + 32)}°F<br>${value}°F = ${format((value - 32) * 5 / 9)}°C`;
}

function solveScratchDegreeDifference(userInput) {
    if (!/\b(?:from|form|difference|apart)\b/i.test(userInput)) return null;

    const degreeValues = [...userInput.matchAll(/(-?\d+(?:\.\d+)?)\s*(?:degrees?|°)/gi)]
        .map(match => Number(match[1]));
    if (degreeValues.length < 2) return null;

    const difference = formatScratchNumber(Math.abs(degreeValues[0] - degreeValues[1]));
    const calculator = scratchKnowledge.calculator || {};
    return `${calculator.comparisonIntro || "Let's compare the two measurements:"}<br><br>${degreeValues[1]}° - ${degreeValues[0]}° = ${difference}°`;
}

function solveScratchVerbalOperation(userInput) {
    const numbers = [...userInput.matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0]));
    if (numbers.length < 2) return null;

    const normalizedInput = normalizeText(userInput);
    let operator = null;
    let symbol = null;
    if (/\b(?:add|sum|plus|total)\b/.test(normalizedInput)) {
        operator = (total, number) => total + number;
        symbol = "+";
    } else if (/\b(?:multiply|multiplied|product|times)\b/.test(normalizedInput)) {
        operator = (total, number) => total * number;
        symbol = "×";
    } else if (/\b(?:divide|divided|quotient)\b/.test(normalizedInput)) {
        operator = (total, number) => number === 0 ? NaN : total / number;
        symbol = "÷";
    } else {
        return null;
    }

    const result = numbers.slice(1).reduce(operator, numbers[0]);
    if (!Number.isFinite(result)) return "I can't divide by zero.";

    const calculator = scratchKnowledge.calculator || {};
    return `${calculator.operationIntro || "Let's work through that operation:"}<br><br>${numbers.join(` ${symbol} `)} = ${formatScratchNumber(result)}`;
}

function solveScratchVerbalMath(userInput) {
    const subtractionMatch = userInput.match(/\b(\d+(?:\.\d+)?)\s+subtracted\s+from\s+(\d+(?:\.\d+)?)/i);
    const subtractMatch = userInput.match(/\bsubtract\s+(\d+(?:\.\d+)?)\s+from\s+(\d+(?:\.\d+)?)/i);
    const minusMatch = userInput.match(/\b(\d+(?:\.\d+)?)\s+(?:minus|less)\s+(\d+(?:\.\d+)?)/i);
    const match = subtractionMatch || subtractMatch || minusMatch;
    if (!match) return null;

    const subtractor = Number(subtractionMatch || subtractMatch ? match[1] : match[2]);
    const firstBase = Number(subtractionMatch || subtractMatch ? match[2] : match[1]);
    const allNumbers = [...userInput.matchAll(/\b\d+(?:\.\d+)?\b/g)].map(number => Number(number[0]));
    const additionalBases = subtractionMatch || subtractMatch
        ? [...new Set(allNumbers.filter(number => number !== subtractor && number !== firstBase))]
        : [];
    const bases = [firstBase, ...additionalBases];
    const suffix = /degr(?:ee|ees|e|ess)|°/i.test(userInput) ? "°" : "";
    const calculations = bases.map(base => `${base} - ${subtractor} = ${formatScratchNumber(base - subtractor)}${suffix}`);
    const calculator = scratchKnowledge.calculator || {};
    return `${calculator.verbalMathIntro || "Let's translate that into math:"}<br><br>${calculations.join("<br>")}`;
}

function findScratchResponse(userInput) {
    const degreeDifferenceResponse = solveScratchDegreeDifference(userInput);
    if (degreeDifferenceResponse) {
        return { text: degreeDifferenceResponse, instant: true };
    }

    const temperatureResponse = solveScratchTemperature(userInput);
    if (temperatureResponse) {
        return { text: temperatureResponse, instant: true };
    }

    const timeResponse = solveScratchTimeMath(userInput);
    if (timeResponse) {
        return { text: timeResponse, instant: true };
    }

    const verbalMathResponse = solveScratchVerbalMath(userInput);
    if (verbalMathResponse) {
        return { text: verbalMathResponse, instant: true };
    }

    const verbalOperationResponse = solveScratchVerbalOperation(userInput);
    if (verbalOperationResponse) {
        return { text: verbalOperationResponse, instant: true };
    }

    const notationResponse = findScratchNotationResponse(userInput);
    if (notationResponse) {
        return { text: notationResponse, instant: true };
    }

    const comparisonResponse = solveScratchComparison(userInput);
    if (comparisonResponse) {
        return { text: comparisonResponse, instant: true };
    }

    const wordProblemResponse = solveScratchWordProblem(userInput);
    if (wordProblemResponse) {
        return { text: wordProblemResponse, instant: true };
    }

    const expressionInput = userInput.replace(/\bmod(?:ulo)?\b/gi, "%");
    const expression = expressionInput.match(/^[\s\d.+\-*/%()×x÷,]+$/i)?.[0];
    const expressionResult = expression ? evaluateScratchExpression(expression) : null;
    if (expressionResult !== null) {
        const calculator = scratchKnowledge.calculator || {};
        return {
            text: `${calculator.expressionIntro || "Let's work that out:"}<br><br>${escapeScratchText(expression.trim())} = ${expressionResult}`,
            instant: true
        };
    }

    const normalizedInput = normalizeText(userInput);
    const state = getScratchState();
    const words = normalizedInput.split(/\s+/).filter(Boolean);
    const oneWordResponse = words.length === 1
        ? (scratchKnowledge.oneWordResponses || []).find(response =>
            response.triggers.some(trigger => words[0] === normalizeText(trigger))
        )
        : null;
    const matchingPatterns = (scratchKnowledge.patterns || [])
        .map(pattern => ({
            pattern,
            matches: pattern.triggers.filter(trigger => words.includes(normalizeText(trigger)))
        }))
        .filter(result => result.matches.length > 0)
        .sort((a, b) => (b.pattern.priority || 0) - (a.pattern.priority || 0) || b.matches.length - a.matches.length);
    const matchingPattern = matchingPatterns[0]?.pattern;
    const stageNames = ["opening", "clarify", "explore", "next_step"];
    const stage = stageNames[Math.min(state.turn, stageNames.length - 1)];
    const responsePool = oneWordResponse
        ? [oneWordResponse]
        : matchingPattern?.stages?.[stage] || matchingPattern?.stages?.next_step || [];
    let availableResponses = responsePool.filter(response => !state.recentResponseIds.includes(response.id));

    if (availableResponses.length === 0) {
        state.recentResponseIds = [];
        availableResponses = responsePool;
    }

    const response = availableResponses[Math.floor(Math.random() * availableResponses.length)] || {
        id: "scratch-fallback",
        style: "question",
        text: "What feels most important to put into words next?"
    };
    const topic = escapeScratchText(userInput.trim().slice(0, 120));
    const responseText = response.text.replace(/\{\{topic\}\}/g, topic);
    state.turn += 1;
    state.patternId = matchingPattern?.id || null;
    state.recentResponseIds.push(response.id);
    state.recentResponseIds = state.recentResponseIds.slice(-8);
    saveScratchState(state);

    return {
        text: response.style === "reflect"
            ? `${responseText}<br><br>What part of that feels most true?`
            : responseText,
        instant: true
    };
}

function escapeScratchText(text) {
    const element = document.createElement("div");
    element.textContent = text;
    return element.innerHTML;
}

function restoreScratchHistory() {
    const history = getScratchHistory();
    if (!scratchMode || history.length === 0) return;

    responseBox.innerHTML = "";
    history.forEach(message => appendMessage(message.sender, message.text, false, {}, null, false));
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
            text: "Hmm, I’m not sure about today’s weather right now. I hope it’s nice.",
            instant: true
        };
    }
}

function getWeatherConfirmation() {
    pendingWeatherConfirmation = true;
    return {
        text: "I can pull today's local forecast directly from weather.gov. Click or type <strong>Yes</strong> to continue. Your browser will ask for permission, and your location data is never saved.",
        weatherConfirmation: true,
        instant: true
    };
}

// -------- Load Knowledge JSON --------
async function loadKnowledge() {
    try {
        const res = await fetch("js/knowledgeTree.json");
        knowledge = await res.json();
        console.log("Knowledge loaded:", knowledge);
    } catch (err) {
        console.error("Failed to load knowledgeTree.json", err);
    }
}

async function loadScratchKnowledge() {
    try {
        const res = await fetch("js/scratchKnowledge.json");
        scratchKnowledge = await res.json();
    } catch (err) {
        console.error("Failed to load scratchKnowledge.json", err);
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

        // Append Fourier Visualization if provided
        if (extra.fourier) {
            appendFourierVisualization(content);
        }


        // ✅ Append standalone link if provided
        if (extra?.link && extra.inlineLink) {
            const allPs = content.querySelectorAll("p");
            const lastP = allPs[allPs.length - 1] || p;
            const a = document.createElement("a");
            a.href = extra.link.href;
            a.textContent = extra.link.text;
            a.target = "_blank";
            a.style.color = "white";
            a.style.textDecoration = "underline";
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
    "successful project": ["successful project", "best project", "proudest project", "duolingo success"],
    testimonies: ["testimonies", "recommendation", "what people say", "references", "feedback"],
    resume: ["resume", "alex's resume", "CV", "cv"],
    coding: ["coding", "code", "programming", "development", "engineering", "cs", "computer science", "algorithm", "algorithms", "sort", "sorting"],
};


// -------- Find Response --------
async function findResponse(userInput) {
    const normalizedInput = normalizeText(userInput);

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
            text: `It's currently ${formattedDetroitTime} in Detroit Metro.<br>Here are a few other clocks I enjoy looking at!`,
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
            // This ensures the text and link objects are passed 
            // so your parser can inject the <a> tag into the {{{rit}}} placeholder
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
    if (!input || !responseBox) initElements();
    if (!input || !responseBox) return;

    const userText = input.value.trim();
    if (!userText) return;
    const normalizedUserText = normalizeText(userText);
    const startsScratchMode = normalizedUserText === "scratch" || normalizedUserText === "braindump";
    const exitsScratchMode = normalizedUserText === "exit";
    const shouldCloseScratch = exitsScratchMode && scratchMode;

    // 1. Show user message immediately
    appendMessage("user", userText);
    if (scratchMode || startsScratchMode) saveScratchMessage("user", userText);
    if (!scratchMode && !startsScratchMode) questionCount++;

    if (!scratchMode && !startsScratchMode && questionCount > maxQuestions) {
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
    if (shouldCloseScratch) {
        clearScratchMode();
        answerObj = { text: "Scratch mode closed." };
    } else if (startsScratchMode) {
        answerObj = enterScratchMode();
    } else if (scratchMode) {
        answerObj = findScratchResponse(userText);
    } else if (pendingWeatherConfirmation && (normalizedUserText === "yes" || normalizedUserText === "no")) {
        pendingWeatherConfirmation = false;
        answerObj = normalizedUserText === "yes"
            ? await getWeatherResponse()
            : { text: "Hmm, I’m not sure what the weather will be today. I hope it’s nice." };
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
        fourier: answerObj.fourier,
        weatherConfirmation: answerObj.weatherConfirmation
    });

    if (scratchMode && !exitsScratchMode && !answerObj.scratchIntro) saveScratchMessage("ai", answerObj.text);

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

    // Check if project is "Coming Soon"
    const isComingSoon = project.title.toLowerCase().includes("coming soon");

    if (isComingSoon) {
        wrapper.style.cursor = "default";
        wrapper.style.pointerEvents = "none"; // Disable interactions
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
                // Actually, simply setting window.location.href is better if user wants to jump pages.
                // "When user click on them it will jump to that page."
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
const scratchKnowledgePromise = loadScratchKnowledge();
try {
    scratchMode = sessionStorage.getItem(scratchStorageKey) !== null;
} catch (error) {
    console.error("Unable to restore scratch mode", error);
}

window.addEventListener('load', async () => {
    initElements();

    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (input) input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });

    await Promise.all([knowledgePromise, scratchKnowledgePromise]);

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

    // Show welcome message on load only if on essence.html page (legacy)
    // Or if currently in essence mode (on refresh)
    if (scratchMode && getScratchHistory().length > 0) {
        restoreScratchHistory();
    } else if (document.body.classList.contains('essence-page') || document.body.classList.contains('essence-mode')) {
        showWelcomeMessage();
    }
});


// -------- Welcome Message --------
function showWelcomeMessage() {
    if (!responseBox) initElements();
    if (!responseBox) return;

    if (scratchMode && getScratchHistory().length > 0) {
        restoreScratchHistory();
        welcomeShown = true;
        return;
    }

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
    p.classList.add("IntroChat"); // Add class for CSS padding

    const welcomeText = "👋 I'm Essence — Alex's portfolio assistant.<br>Ask me anything about his work, skills, or vision.";

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
        { text: "💭 Dream job", displayText: "What's Alex's dream job?", query: "dream job" },
        { text: "💼 Current role", displayText: "What's Alex's current role?", query: "role" },
        { text: "🎓 Education", displayText: "What's Alex's educational background?", query: "education" },
        { text: "👤 About Alex", displayText: "Tell me about Alex", query: "background" },
        { text: "🚀 Projects", displayText: "What projects has Alex worked on?", query: "projects" },
        { text: "⚡ Skills", displayText: "What are Alex's skills?", query: "skills" },
        { text: "👨‍💻 Coding Background", displayText: "What is Alex's coding background?", query: "code" },
        { text: "📍 Located", displayText: "Where's Alex Located?", query: "Located" },
        { text: "☀️ Today's weather", displayText: "What's the weather like today?", query: "weather" }
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
    const countMap = {}; // To store the original objects by value

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


// -------- Fourier Visualization (Stub) --------
function appendFourierVisualization(container) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("fourier-wrapper");
    wrapper.style.padding = "20px";
    wrapper.style.textAlign = "center";
    wrapper.innerHTML = "<p>Fourier Transform visualization coming soon...</p>";
    container.appendChild(wrapper);
}