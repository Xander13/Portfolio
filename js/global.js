
// -------- Detroit Time --------
function updateDetroitTime() {
    const timeEl = document.getElementById("detroitTime");
    if (!timeEl) return;

    const now = new Date();
    const options = {
        timeZone: "America/Detroit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    };

    const timeString = now.toLocaleTimeString("en-US", options);
    timeEl.textContent = `Detroit, MI ${timeString}`;
}

// Update time immediately and then every second
updateDetroitTime();
setInterval(updateDetroitTime, 1000);
