import { ArrowRight } from "lucide-react";

import { Badge, Button, ButtonLink, Card } from "@/components";
import { routePaths } from "@/routes/paths";

import type { EnrichedCharityRecord } from "../charities.helpers";
import { CharityVisual } from "./charity-visual";

export const CharityCard = ({
  charity,
  actionLabel = "View details",
  actionVariant = "secondary",
  selected = false,
  onSelect,
  selectLabel = "Choose for future payments",
  selectDisabled = false
}: {
  charity: EnrichedCharityRecord;
  actionLabel?: string;
  actionVariant?: "primary" | "secondary" | "ghost" | "accent" | "coral" | "outline";
  selected?: boolean;
  onSelect?: () => void;
  selectLabel?: string;
  selectDisabled?: boolean;
}) => {
  return (
    <Card
      className={selected ? "border-primary/50 bg-primary-soft/20" : "bg-surface-elevated/95"}
    >
      <CharityVisual
        label={charity.profile.visualLabel}
        category={charity.category}
        className={charity.profile.visualClassName}
      />

      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">
            Impact focus • {charity.category}
          </p>
          <h3 className="font-display text-2xl text-foreground">{charity.name}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{charity.profile.shortDescription}</p>
        </div>
        {selected ? <Badge tone="success">Selected</Badge> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {charity.impactTags.slice(0, 3).map((tag) => (
          <Badge key={tag} tone="muted">
            {tag}
          </Badge>
        ))}
        {charity.eventTags.slice(0, 1).map((tag) => (
          <Badge key={tag} tone="info">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <ButtonLink to={routePaths.publicCharityDetail(charity.id)} variant={actionVariant} size="sm">
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
        {onSelect ? (
          <Button
            variant={selected ? "secondary" : "accent"}
            size="sm"
            onClick={onSelect}
            disabled={selectDisabled}
          >
            {selected ? "Current selection" : selectLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
};
