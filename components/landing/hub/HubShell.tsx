import React from "react";

type HubShellProps = {
  background?: React.ReactNode;
  children: React.ReactNode;
};

export function HubShell({ background, children }: HubShellProps) {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {background}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">{children}</div>
      </div>
    </section>
  );
}
