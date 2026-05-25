import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components";

describe("Button", () => {
  it("renders children and variant styles", () => {
    render(<Button variant="accent">View plan</Button>);

    const button = screen.getByRole("button", { name: "View plan" });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-accent");
  });
});
