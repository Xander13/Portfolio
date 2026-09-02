import knowledge from "../../../api/knowledgeTree.json";

export function GET() {
    try {
        return Response.json(knowledge);
    } catch {
        return Response.json({ error: "Failed to load knowledge data" }, { status: 500 });
    }
}