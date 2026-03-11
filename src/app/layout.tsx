import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SeeWhy LIVE",
  description: "Live streaming platform powered by SeeWhy LIVE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
