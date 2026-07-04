import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mon classement d'écoles",
  description: "Classez vos écoles par ordre de préférence, exportez votre voeux.",
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
