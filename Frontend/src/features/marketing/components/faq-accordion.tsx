import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card } from "@/components";
import { cn } from "@/lib";

export interface FaqItem {
  question: string;
  answer: string;
}

export const FaqAccordion = ({
  items,
  defaultOpenIndex = 0
}: {
  items: FaqItem[];
  defaultOpenIndex?: number;
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <Card key={item.question} className="p-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="font-semibold text-foreground">{item.question}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen ? (
              <div className="border-t border-border/70 px-5 py-5 text-sm text-muted-foreground">
                {item.answer}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
};
