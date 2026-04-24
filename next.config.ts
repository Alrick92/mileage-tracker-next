import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit (and its fontkit dep) read AFM/font data files off disk and use
  // Babel-style decorated classes that Turbopack can't re-bundle cleanly.
  // Running them through Node's require at runtime sidesteps both issues.
  serverExternalPackages: ["pdfkit", "fontkit"],
};

export default nextConfig;
