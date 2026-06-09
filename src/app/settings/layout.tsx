import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Pulse NYC profile — display name, neighborhood, goals, and account preferences.",
  alternates: { canonical: "/settings" },
  openGraph: {
    title: "Settings",
    description: "Manage your Pulse NYC profile — display name, neighborhood, goals, and account preferences.",
    url: "/settings",
  },
  twitter: {
    card: "summary_large_image",
    title: "Settings",
    description: "Manage your Pulse NYC profile — display name, neighborhood, goals, and account preferences.",
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
