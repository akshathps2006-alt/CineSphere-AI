import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineSphere — Find your next favourite film",
  description: "Discover films picked for your taste with CineSphere's smart movie recommendations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
