import "../public/css/cssReset.css";
import "../public/css/style.css";

export const metadata = {
    title: "Echo | Alex Kauffman",
    description: "Alex Kauffman's interactive portfolio shell."
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}