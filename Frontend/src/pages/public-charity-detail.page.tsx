import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, HeartHandshake } from "lucide-react";
import { useParams } from "react-router-dom";
import { useMemo } from "react";

import { Alert, Badge, ButtonLink, Card } from "@/components";
import { queryKeys } from "@/constants";
import {
  CharityVisual,
  enrichCharityCatalog,
  findCharityById
} from "@/features/charities";
import {
  PublicPageShell,
  Reveal,
  getPublicCatalogNotice,
  usePublicCharitiesCatalog
} from "@/features/marketing";
import { useAuth } from "@/features/auth";
import { routePaths } from "@/routes/paths";
import { charitiesService } from "@/services";
import { formatCurrency, formatDate } from "@/utils";

export const PublicCharityDetailPage = () => {
  const { charityId } = useParams<{ charityId: string }>();
  const { isAuthenticated } = useAuth();

  const charitiesQuery = usePublicCharitiesCatalog();

  const catalog = useMemo(
    () => enrichCharityCatalog(charitiesQuery.data.items || []),
    [charitiesQuery.data]
  );
  const charityFromCatalog = findCharityById(catalog, charityId);
  const charitiesNotice = getPublicCatalogNotice(charitiesQuery.data);

  const charityDetailQuery = useQuery({
    queryKey: charityId
      ? queryKeys.publicCharityDetail(charityId)
      : ["public", "charities", "detail", "idle"],
    queryFn: async () => {
      if (!charityId) {
        return null;
      }

      return (await charitiesService.getById(charityId)).data;
    },
    enabled: Boolean(charityId && !charityFromCatalog),
    retry: false,
    meta: {
      suppressGlobalErrorToast: true
    }
  });

  const charity =
    charityFromCatalog ||
    findCharityById(
      enrichCharityCatalog(
        charityDetailQuery.data ? [charityDetailQuery.data] : []
      ),
      charityId
    );

  if (!charity && !charitiesQuery.isFetching && !charityDetailQuery.isFetching) {
    return (
      <div className="space-y-6">
        <Card className="bg-surface-elevated/95">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Charity
          </p>
          <h1 className="mt-4 font-display text-4xl text-foreground">Charity not found</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            This charity could not be found in the current catalog. Try returning to the discovery
            page to browse the full impact network.
          </p>
          <div className="mt-6">
            <ButtonLink to={routePaths.publicCharities}>Back to charities</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PublicPageShell
      eyebrow="Charity Detail"
      title={
        charity?.name ||
        "Loading charity profile"
      }
      description={
        charity?.profile.longDescription ||
        "We’re loading this charity’s mission, impact themes, and support details now."
      }
      actions={
        charity ? (
          <>
            <ButtonLink to={isAuthenticated ? routePaths.charities : routePaths.signup}>
              {isAuthenticated ? "Use for future payments" : "Join the Draw"}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to={routePaths.publicCharities} variant="secondary">
              Back to all charities
            </ButtonLink>
          </>
        ) : null
      }
      aside={
        charity ? (
          <div className="space-y-5">
            <CharityVisual
              label={charity.profile.visualLabel}
              category={charity.category}
              className={charity.profile.visualClassName}
            />
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {charity.impactTags.map((tag) => (
                  <Badge key={tag} tone="muted">
                    {tag}
                  </Badge>
                ))}
                {charity.eventTags.map((tag) => (
                  <Badge key={tag} tone="info">
                    {tag}
                  </Badge>
                ))}
              </div>
              {charity.website ? (
                <a
                  href={charity.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-accent"
                >
                  Visit website
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Loading the charity profile…</p>
          </div>
        )
      }
    >
      {charity ? (
        <>
          {charitiesNotice ? (
            <Alert tone="info" title="Preview charity catalog">
              {charitiesNotice}
            </Alert>
          ) : null}
          <Reveal>
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {charity.profile.highlightStats.map((item) => (
                <Card key={item.label} className="bg-surface-elevated/95">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    {item.label}
                  </p>
                  <h2 className="mt-4 font-display text-3xl text-foreground">{item.value}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </Card>
              ))}
              <Card className="bg-surface-elevated/95">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                  Total raised
                </p>
                <h2 className="mt-4 font-display text-3xl text-foreground">
                  {charity.totalRaisedMajor ||
                    (typeof charity.totalRaised === "number"
                      ? formatCurrency(charity.totalRaised, charity.currency || "INR")
                      : "Growing")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Public-facing totals appear here whenever the backend provides them.
                </p>
              </Card>
            </section>
          </Reveal>

          <Reveal>
            <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <Card className="bg-surface-elevated/95">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary-soft p-3 text-primary">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                      Mission focus
                    </p>
                    <h2 className="mt-1 font-display text-3xl text-foreground">
                      {charity.category}
                    </h2>
                  </div>
                </div>
                <div className="mt-6 space-y-5">
                  {charity.profile.storySections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                      <p className="text-sm leading-8 text-muted-foreground">{section.body}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-5">
                <Card className="bg-surface-elevated/95">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Support pillars
                  </p>
                  <div className="mt-5 space-y-3">
                    {charity.profile.supportPillars.map((pillar) => (
                      <div
                        key={pillar}
                        className="rounded-2xl border border-border/70 bg-surface-soft/80 px-4 py-4 text-sm text-muted-foreground"
                      >
                        {pillar}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-surface-elevated/95">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Catalog details
                  </p>
                  <div className="mt-5 space-y-4 text-sm text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Code:</span> {charity.code}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Status:</span>{" "}
                      {charity.status || "active"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Currency:</span>{" "}
                      {charity.currency || "INR"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Last updated:</span>{" "}
                      {formatDate(charity.updatedAt || charity.createdAt)}
                    </p>
                  </div>
                </Card>
              </div>
            </section>
          </Reveal>
        </>
      ) : null}
    </PublicPageShell>
  );
};
