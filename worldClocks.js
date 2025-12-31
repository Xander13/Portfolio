// -------- World Clocks Display --------
function appendWorldClocks(container) {
    const clocksContainer = document.createElement("div");
    clocksContainer.classList.add("world-clocks-container");
    clocksContainer.style.display = "flex";
    clocksContainer.style.flexDirection = "row";
    clocksContainer.style.flexWrap = "wrap";
    clocksContainer.style.gap = "32px";
    clocksContainer.style.marginTop = "48px";
    clocksContainer.style.width = "100%";
    clocksContainer.style.justifyContent = "space-between";

    const clocks = [
        { city: "Detroit", timezone: "America/Detroit", darkColor: "#03001e", color: "#a8c0ff", color2: "#3f2b96" },
        { city: "Romania", timezone: "Europe/Bucharest", darkColor: "#03001e", color: "#00b09b", color2: "#96c93d" },
        { city: "Tokyo", timezone: "Asia/Tokyo", darkColor: "#03001e", color: "#fc4a1a", color2: "#f7b733" },
        { city: "London", timezone: "Europe/London", darkColor: "#03001e", color: "#7303c0", color2: "#ec38bc" }
    ];

    clocks.forEach(clock => {
        const clockDiv = document.createElement("div");
        clockDiv.classList.add("world-clock-item");
        clockDiv.style.display = "flex";
        clockDiv.style.flexDirection = "column";
        clockDiv.style.alignItems = "center";
        clockDiv.style.gap = "16px";
        // clockDiv.style.flex = "1"; // Moved to CSS for responsiveness

        // City label
        const label = document.createElement("div");
        label.textContent = clock.city;
        label.style.fontSize = "20px";
        label.style.fontWeight = "600";
        label.style.color = "white";

        // Clock face container
        const face = document.createElement("div");
        face.style.width = "100%";
        face.style.aspectRatio = "1";
        // face.style.maxWidth = "200px"; // Removed to allow clocks to be larger
        face.style.borderRadius = "50%";
        face.style.position = "relative";
        // face.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.4)"; // Optional shadow
        // face.style.border = "2px solid white"; // Removed border as per new design style

        // Minute Ring (Outer)
        const minuteRing = document.createElement("div");
        minuteRing.style.width = "100%";
        minuteRing.style.height = "100%";
        minuteRing.style.borderRadius = "50%";
        minuteRing.style.position = "absolute";
        minuteRing.style.top = "0";
        minuteRing.style.left = "0";
        // Gradient: Fun Color to Black. Hard stop at 0deg (which rotates).
        minuteRing.style.background = `conic-gradient(from 0deg, ${clock.darkColor} 0%, ${clock.color} 50%, ${clock.color2} 100%)`;
        minuteRing.style.transition = "transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)"; // Bouncy transition

        // Hour Ring (Inner)
        const hourRing = document.createElement("div");
        hourRing.style.width = "50%";
        hourRing.style.height = "50%";
        hourRing.style.borderRadius = "50%";
        hourRing.style.position = "absolute";
        hourRing.style.top = "25%";
        hourRing.style.left = "25%";
        hourRing.style.zIndex = "10";
        // Gradient: Fun Color to Black
        hourRing.style.background = `conic-gradient(from 0deg, ${clock.darkColor} 0%, ${clock.color} 50%, ${clock.color2} 100%)`;
        hourRing.style.transition = "transform 0.5s cubic-bezier(0.4, 2.08, 0.55, 0.44)";

        face.appendChild(minuteRing);
        face.appendChild(hourRing);

        clockDiv.appendChild(label);
        clockDiv.appendChild(face);
        clocksContainer.appendChild(clockDiv);

        // Update clock rotation
        function updateClock() {
            const now = new Date();
            const timeString = now.toLocaleString("en-US", { timeZone: clock.timezone });
            const time = new Date(timeString);

            const currentHours = time.getHours();
            const minutes = time.getMinutes();
            const seconds = time.getSeconds();

            const hours12 = currentHours % 12;

            // Calculate degrees
            const hourDeg = (hours12 * 30) + (minutes * 0.5); // 30deg per hour
            const minuteDeg = (minutes * 6) + (seconds * 0.1); // 6deg per minute

            // Apply rotation
            // We rotate the rings so the "start" of the gradient (0deg) points to the time
            hourRing.style.transform = `rotate(${hourDeg}deg)`;
            minuteRing.style.transform = `rotate(${minuteDeg}deg)`;
        }

        // Initial update
        updateClock();
        // Update every second
        setInterval(updateClock, 1000);
    });

    container.appendChild(clocksContainer);
}
