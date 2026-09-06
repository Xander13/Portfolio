"use client";

import { Analytics } from "@vercel/analytics/next";
import { useEffect } from "react";

export default function HomePage() {
    useEffect(() => {
        window.location.replace("/index.html");
    }, []);

    return <Analytics />;
}