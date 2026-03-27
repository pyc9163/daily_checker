import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4efe6",
        ink: "#1f2937",
        panel: "#fffaf2",
        accent: "#0f766e",
        danger: "#b91c1c",
        warning: "#ca8a04",
        muted: "#6b7280"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.08)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at 20% 20%, rgba(15,118,110,0.2), transparent 35%), radial-gradient(circle at 80% 0%, rgba(217,119,6,0.18), transparent 28%), linear-gradient(180deg, #f8f2e8 0%, #f2ede3 100%)"
      }
    }
  },
  plugins: []
};

export default config;
