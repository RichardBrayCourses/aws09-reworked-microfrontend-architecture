import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
} satisfies Config;

export default config;
