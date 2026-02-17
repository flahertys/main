import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Tool | TradeHax AI",
  description: "Internal task management utility.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TodosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
