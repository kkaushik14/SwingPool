import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui";
import { useTheme } from "@/hooks";

export const ThemeToggle = () => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Theme: ${resolvedTheme}`}
    >
      {resolvedTheme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </Button>
  );
};
