import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { AUTH_COOKIE_NAME, SESSION_DURATION_MS } from "../../../lib/germscopeAuth";

function hash(value) {
    return createHash("sha256").update(String(value)).digest();
}

export async function POST(request) {
    let password = "";
    try {
        const body = await request.json();
        password = String(body?.password ?? "");
    } catch {
        return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const expectedPassword = process.env.GERMSCOPE_PASSWORD;
    const sessionSecret = process.env.GERMSCOPE_SESSION_SECRET || expectedPassword;

    if (!expectedPassword || !sessionSecret) {
        return Response.json({ ok: false, error: "Login is not configured" }, { status: 500 });
    }

    const isMatch = timingSafeEqual(hash(password), hash(expectedPassword));
    if (!isMatch) {
        return Response.json({ ok: false, error: "Incorrect password" }, { status: 401 });
    }

    const expiry = String(Date.now() + SESSION_DURATION_MS);
    const signature = createHmac("sha256", sessionSecret).update(expiry).digest("hex");
    const token = `${expiry}.${signature}`;

    const response = Response.json({ ok: true });
    response.headers.append(
        "Set-Cookie",
        `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DURATION_MS / 1000}`
    );
    return response;
}
