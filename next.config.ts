import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // nodemailer uses dynamic requires; keep it external so it runs from
  // node_modules at runtime instead of being bundled (avoids build/runtime
  // errors on Vercel server functions).
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
