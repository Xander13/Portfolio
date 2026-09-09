import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "./lib/germscopeAuth";

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

async function isValidToken(token) {
    if (!token) return false;

    const [expiry, signatureHex] = token.split(".");
    if (!expiry || !signatureHex || Number(expiry) < Date.now()) return false;

    const secret = process.env.GERMSCOPE_SESSION_SECRET || process.env.GERMSCOPE_PASSWORD;
    if (!secret) return false;

    try {
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );
        return await crypto.subtle.verify(
            "HMAC",
            key,
            hexToBytes(signatureHex),
            new TextEncoder().encode(expiry)
        );
    } catch {
        return false;
    }
}

function loginPage(error) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>GermScope</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet">
<style>
    body, html {
        background: rgb(0, 0, 0);
        height: 100%;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Bricolage Grotesque", sans-serif;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 280px;
        padding: 32px;
        background: rgb(17, 17, 17);
        border: 1px solid rgb(77, 77, 77);
        border-radius: 12px;
        box-sizing: border-box;
    }

    h2 {
        margin: 0 0 8px;
        color: white;
        font-weight: 400;
    }

    label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
    }

    input {
        padding: 8px 12px;
        background: rgb(17, 17, 17);
        border: 1px solid rgb(77, 77, 77);
        border-radius: 8px;
        color: white;
        font-family: inherit;
    }

    button {
        padding: 8px 16px;
        background: white;
        border: 0;
        border-radius: 999px;
        color: rgb(17, 17, 17);
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
    }

    .loginError {
        min-height: 16px;
        margin: 0;
        font-size: 12px;
        color: rgb(255, 120, 120);
    }
</style>
</head>
<body>
    <form id="loginForm" autocomplete="off">
        <h2>Project Access</h2>
        <label for="loginPassword">Password</label>
        <input id="loginPassword" name="password" type="password" required autofocus>
        <button type="submit">Enter</button>
        <p class="loginError" id="loginError">${error || ""}</p>
    </form>
    <script>
        const loginForm = document.querySelector("#loginForm");
        const loginError = document.querySelector("#loginError");

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            loginError.textContent = "";

            const password = new FormData(loginForm).get("password");

            try {
                const response = await fetch("/api/germscope-auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password })
                });
                const result = await response.json();

                if (response.ok && result.ok) {
                    window.location.reload();
                } else {
                    loginError.textContent = result.error || "Incorrect password";
                }
            } catch {
                loginError.textContent = "Unable to reach the login service";
            }
        });
    </script>
</body>
</html>`;
}

export async function proxy(request) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (await isValidToken(token)) {
        return NextResponse.next();
    }

    return new NextResponse(loginPage(), {
        status: 401,
        headers: { "Content-Type": "text/html; charset=utf-8" }
    });
}

export const config = {
    matcher: ["/GermScope.html"]
};
