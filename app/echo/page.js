"use client";

import { useEffect } from "react";

export default function EchoPage() {
    useEffect(() => {
        document.body.classList.add("essence-page");

        const initialize = () => {
            if (window.echoNextInitialized) return;
            window.echoNextInitialized = true;

            const essence = document.createElement("script");
            essence.src = "/js/echo.js";
            essence.onload = () => window.dispatchEvent(new Event("load"));
            document.body.appendChild(essence);
        };

        if (typeof window.appendWorldClocks === "function") {
            initialize();
        } else {
            const worldClocks = document.createElement("script");
            worldClocks.src = "/js/worldClocks.js";
            worldClocks.onload = initialize;
            document.body.appendChild(worldClocks);
        }

        return () => {
            document.body.classList.remove("essence-page");
        };
    }, []);

    return (
        <main className="chat-container" aria-label="Echo">
            <div className="responseBox" aria-live="polite" />
            <div className="inputBox">
                <label htmlFor="llmTxt" className="sr-only">Ask Alex</label>
                <input
                    className="txtBox"
                    autoComplete="off"
                    name="no-autofill"
                    type="text"
                    id="llmTxt"
                    placeholder="Ask Alex..."
                />
                <button className="send" type="button">Send</button>
            </div>
        </main>
    );
}