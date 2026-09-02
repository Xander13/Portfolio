import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "public", "knowledgeTree.json");
        const fileData = await readFile(filePath, "utf8");
        return Response.json(JSON.parse(fileData));
    } catch {
        return Response.json({ error: "Failed to load knowledge data" }, { status: 500 });
    }
}