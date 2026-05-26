/**
 * MeshBackground — Fixed ambient animated blob background.
 * Place once at the root of any page for the premium gradient mesh effect.
 * Uses CSS keyframes defined in globals.css (blobDrift, blobDrift2, blobDrift3).
 */
export function MeshBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: -1 }}
    >
      {/* ── Primary arc-purple blob ──────────────────────────────── */}
      <div
        style={{
          position:   "absolute",
          width:      "780px",
          height:     "580px",
          top:        "-12%",
          left:       "8%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #6c47ff 0%, #4422cc 45%, transparent 78%)",
          filter:     "blur(110px)",
          opacity:    0.09,
          animation:  "blobDrift 18s ease-in-out infinite alternate",
        }}
      />

      {/* ── Blue / teal contrast blob ────────────────────────────── */}
      <div
        style={{
          position:   "absolute",
          width:      "640px",
          height:     "720px",
          bottom:     "-22%",
          right:      "-2%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #0099cc 0%, #005588 48%, transparent 80%)",
          filter:     "blur(130px)",
          opacity:    0.06,
          animation:  "blobDrift2 22s ease-in-out infinite alternate",
        }}
      />

      {/* ── Violet accent blob ───────────────────────────────────── */}
      <div
        style={{
          position:   "absolute",
          width:      "440px",
          height:     "520px",
          top:        "38%",
          left:       "-6%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #9c7bff 0%, #5535e6 55%, transparent 88%)",
          filter:     "blur(90px)",
          opacity:    0.055,
          animation:  "blobDrift3 26s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}
