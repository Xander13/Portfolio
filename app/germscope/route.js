import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "../../lib/germscopeAuth";
import { germscopeLoginPage } from "../../lib/germscopeLoginPage";

function hexToBytes(hex) {
    const bytes = Buffer.from(hex, "hex");
    return bytes;
}

function isValidToken(token) {
    if (!token) return false;

    const [expiry, signatureHex] = token.split(".");
    if (!expiry || !signatureHex || Number(expiry) < Date.now()) return false;

    const secret = process.env.GERMSCOPE_SESSION_SECRET || process.env.GERMSCOPE_PASSWORD;
    if (!secret) return false;

    const expectedSignature = createHmac("sha256", secret).update(expiry).digest();
    const providedSignature = hexToBytes(signatureHex);

    if (providedSignature.length !== expectedSignature.length) return false;
    return timingSafeEqual(providedSignature, expectedSignature);
}

export async function GET() {
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

    if (!isValidToken(token)) {
        return new Response(germscopeLoginPage(), {
            status: 401,
            headers: { "Content-Type": "text/html; charset=utf-8" }
        });
    }

    const filePath = path.join(process.cwd(), "content", "germscope.html");
    const html = await readFile(filePath, "utf8");

    return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
    });
}
