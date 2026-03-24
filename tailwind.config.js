/** @type {import('tailwindcss').Config} */
export default {
  content: ["./frontend/index.html", "./frontend/src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 24px 90px rgba(41, 37, 36, 0.08)",
      },
      colors: {
        parchment: "#fff9f0",
        ink: "#201a17",
        coral: "#ef7d57",
        teal: "#4ecdc4",
        moss: "#1a9d90",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.28", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(1.05)" },
        },
        riseIn: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        "pulse-glow": "pulseGlow 8s ease-in-out infinite",
        "rise-in": "riseIn 0.7s ease-out both",
      },
    },
  },
  plugins: [],
}
