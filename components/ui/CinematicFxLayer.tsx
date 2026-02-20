export function CinematicFxLayer() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      <div className="dazzle-vignette" />
      <div className="dazzle-orb dazzle-orb--cyan" />
      <div className="dazzle-orb dazzle-orb--violet" />
      <div className="dazzle-orb dazzle-orb--emerald" />
      <div className="dazzle-grid" />
      <div className="dazzle-scan" />
    </div>
  );
}
