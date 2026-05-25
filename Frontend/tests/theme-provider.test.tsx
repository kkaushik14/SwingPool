import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeProvider, useThemeContext } from "@/theme";

const Consumer = () => {
  const { theme, resolvedTheme, toggleTheme } = useThemeContext();

  return (
    <div>
      <span>{theme}</span>
      <span>{resolvedTheme}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
};

describe("ThemeProvider", () => {
  it("cycles through theme modes and updates the document theme", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    expect(document.documentElement.dataset.theme).toBe("dark");
    fireEvent.click(screen.getByText("Toggle"));
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent.click(screen.getByText("Toggle"));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
