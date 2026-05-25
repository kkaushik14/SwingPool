import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Input,
  SectionHeading,
} from "@/components";
import {
  CharityCard,
  CharityVisual,
  enrichCharityCatalog,
  filterCharities,
  getCharityCategoryOptions
} from "@/features/charities";
import {
  PublicPageShell,
  Reveal,
  charitySplitHighlights,
  getPublicCatalogNotice,
  usePublicCharitiesCatalog
} from "@/features/marketing";
import { routePaths } from "@/routes/paths";

export const PublicCharitiesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const charitiesQuery = usePublicCharitiesCatalog();

  const charities = useMemo(
    () => enrichCharityCatalog(charitiesQuery.data.items || []),
    [charitiesQuery.data]
  );
  const filteredCharities = useMemo(
    () =>
      filterCharities({
        charities,
        searchTerm,
        activeCategory
      }),
    [activeCategory, charities, searchTerm]
  );
  const categories = getCharityCategoryOptions(charities);
  const featured =
    filteredCharities.find((charity) => charity.isFeatured) || filteredCharities[0] || charities[0];
  const charitiesNotice = getPublicCatalogNotice(charitiesQuery.data);

  return (
    <PublicPageShell
      eyebrow="Charities"
      title="Charitable impact leads the experience here, long before anyone thinks about winning."
      description="Browse the cause catalog before signup, learn what each partner stands for, and understand how future member payments can create real impact without rewriting historical accounting."
      actions={
        <>
          <ButtonLink to={routePaths.signup}>
            Join the Draw
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink to={routePaths.howItWorks} variant="secondary">
            How It Works
          </ButtonLink>
        </>
      }
      aside={
        featured ? (
          <div className="space-y-6">
            <CharityVisual
              label={featured.profile.visualLabel}
              category={featured.category}
              className={featured.profile.visualClassName}
            />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">
                Featured cause
              </p>
              <h2 className="font-display text-4xl text-foreground">{featured.name}</h2>
              <p className="text-base leading-8 text-muted-foreground">
                {featured.profile.longDescription}
              </p>
              <div className="flex flex-wrap gap-2">
                {featured.impactTags.slice(0, 3).map((tag) => (
                  <Badge key={tag} tone="muted">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {featured.profile.highlightStats.slice(0, 2).map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/70 bg-surface-elevated/90 px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                      {item.label}
                    </p>
                    <p className="mt-2 font-display text-2xl text-foreground">{item.value}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Featured charity content will appear here as soon as the catalog loads.
            </p>
          </div>
        )
      }
    >
      <Reveal>
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Cause catalog"
            title="Search, filter, and compare the public impact network"
            description="Every card is designed to help future members understand mission, category, and impact tone before they ever reach checkout."
          />

          <div className="grid gap-4 rounded-[32px] border border-border/70 bg-surface-elevated/90 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <label
                htmlFor="charity-search"
                className="text-xs font-semibold uppercase tracking-[0.24em] text-accent"
              >
                Search charities
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="charity-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-11"
                  placeholder="Search by cause, mission, or impact tag"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "accent" : "secondary"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCharities.map((charity) => (
              <CharityCard key={charity.id} charity={charity} actionVariant="primary" />
            ))}
          </div>
          {charitiesNotice ? (
            <Alert tone="info" title="Preview charity catalog">
              {charitiesNotice}
            </Alert>
          ) : null}

          {!filteredCharities.length ? (
            <EmptyState
              eyebrow="No matches"
              title="No charities matched this search yet"
              description="Try another keyword or switch back to All categories to see the full impact network."
              actionLabel="Reset filters"
              onAction={() => {
                setSearchTerm("");
                setActiveCategory("All");
              }}
            />
          ) : null}
        </section>
      </Reveal>

      <Reveal>
        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[32px] border border-border/70 bg-surface-elevated/90 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Why impact comes first
            </p>
            <h2 className="mt-4 font-display text-3xl text-foreground">
              Members see the cause network before the membership prompt
            </h2>
            <p className="mt-4 text-sm leading-8 text-muted-foreground">
              Swing Pool is intentionally not sport-first in tone. The charitable destination is
              visible before signup because impact is part of the product identity, not an upsell
              tucked behind payment.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {charitySplitHighlights.map((item) => (
              <div
                key={item}
                className="rounded-[28px] border border-border/70 bg-surface-elevated/90 p-5"
              >
                <p className="text-sm leading-7 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </PublicPageShell>
  );
};
