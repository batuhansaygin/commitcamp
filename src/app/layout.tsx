import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "CommitCamp — Developer Tools & Community",
    template: "%s | CommitCamp",
  },
  description:
    "Where developers commit to growth. Essential developer tools, code sharing, forum, and community — all in one platform. commitcamp.com",
  metadataBase: new URL("https://commitcamp.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://commitcamp.com",
    siteName: "CommitCamp",
    title: "CommitCamp — Developer Tools & Community",
    description:
      "Where developers commit to growth. Essential developer tools, code sharing, forum, and community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CommitCamp — Developer Tools & Community",
    description:
      "Where developers commit to growth. Essential developer tools, code sharing, forum, and community.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
