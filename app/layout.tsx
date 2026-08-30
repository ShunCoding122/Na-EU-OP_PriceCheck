import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "OP Market Compare",
  description: "Compare One Piece card pricing across North America and Europe."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
