import "./globals.css";
import Navbar from "./components/layout/Navbar";
import SmoothScroll from "./components/layout/SmoothScroll";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
