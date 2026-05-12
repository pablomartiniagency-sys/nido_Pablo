const config = {
  darkMode: ["class"],
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['"DM Sans"', "system-ui", "sans-serif"] },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        coral: { 300:"#FF9E6D", 400:"#F87D4A", 500:"#F28A5C", 600:"#E36A34", 700:"#C65424" },
        ink:   { 900:"#0E0E10", 800:"#131316", 700:"#17171B", 600:"#1D1D22" },
        chalk: { 200:"#D9D3C0", 300:"#C9C1AE", 400:"#9A9487", 500:"#6E6A60" },
        charcoal: { 900:"#0E0E10", 800:"#131316", 700:"#17171B", 600:"#1D1D22", 500:"#2A2A32", 400:"#3A3A44", 300:"#4E4E5A", 200:"#6A6A76" },
      },
      borderRadius: { lg: "var(--radius)" },
      boxShadow: { "glow-coral": "0 0 20px rgba(249,115,22,0.15)" },
      keyframes: {
        fadeIn:    { "0%": { opacity:"0", transform:"translateY(6px)" }, "100%": { opacity:"1", transform:"translateY(0)" } },
        pulseSoft: { "0%,100%": { opacity:"1" }, "50%": { opacity:"0.55" } },
      },
      animation: { fadeIn: "fadeIn 0.25s ease-out", pulseSoft: "pulseSoft 1.6s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
