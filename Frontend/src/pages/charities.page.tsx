import { useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton,
  SectionHeading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Textarea
} from "@/components";
import { queryKeys } from "@/constants";
import {
  CharityCard,
  CharityVisual,
  enrichCharityCatalog,
  filterCharities,
  findCharityById,
  getCharityCategoryOptions,
  getImpactSummary,
  sortDonationsByRecent
} from "@/features/charities";
import { useOnlineStatus } from "@/hooks";
import { queryClient } from "@/lib";
import { charitiesService } from "@/services";
import { formatCurrency, formatDate, getErrorMessage, toStatusLabel, toStatusTone } from "@/utils";

export const CharitiesPage = () => {
  const isOnline = useOnlineStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectionReason, setSelectionReason] = useState("");
  const [selectionSuccessMessage, setSelectionSuccessMessage] = useState<string | null>(null);

  const charitiesQuery = useQuery({
    queryKey: queryKeys.charities,
    queryFn: async () => (await charitiesService.list()).data
  });
  const selectionQuery = useQuery({
    queryKey: queryKeys.myCharitySelection,
    queryFn: async () => (await charitiesService.getMySelection()).data
  });
  const donationsQuery = useQuery({
    queryKey: queryKeys.myDonations,
    queryFn: async () => (await charitiesService.listMyDonations()).data
  });

  const charities = useMemo(
    () => enrichCharityCatalog(charitiesQuery.data || []),
    [charitiesQuery.data]
  );
  const categories = getCharityCategoryOptions(charities);
  const filteredCharities = useMemo(
    () =>
      filterCharities({
        charities,
        searchTerm,
        activeCategory
      }),
    [activeCategory, charities, searchTerm]
  );
  const impactSummary = getImpactSummary({
    charities,
    selection: selectionQuery.data,
    donations: donationsQuery.data
  });
  const currentSelection = findCharityById(charities, selectionQuery.data?.charityId);
  const recentDonations = sortDonationsByRecent(donationsQuery.data || []).slice(0, 8);

  const selectionMutation = useMutation({
    mutationFn: (charityId: string) =>
      charitiesService.setMySelection(
        charityId,
        selectionReason.trim() ? selectionReason.trim() : undefined
      ),
    onSuccess: async () => {
      setSelectionSuccessMessage(
        "Your charity preference was updated. Future payments will follow this choice, while historical allocations stay unchanged."
      );
      setSelectionReason("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.myCharitySelection });
    }
  });
  const criticalQueries = [charitiesQuery, selectionQuery, donationsQuery];
  const hasCriticalData = criticalQueries.some((query) => query.data !== undefined);
  const isInitialLoading =
    criticalQueries.some((query) => query.isPending) && !hasCriticalData;
  const hasBlockingError =
    criticalQueries.some((query) => query.isError) && !hasCriticalData;
  const retryCharityQueries = async () => {
    await Promise.all(criticalQueries.map((query) => query.refetch()));
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Charities"
        title="Manage the impact side of your membership with the same clarity as billing or eligibility"
        description="Choose where future charity allocations should go, review your supported causes, and keep your personal giving story visible in one emotionally-led, impact-first space."
      />

      {!isOnline && hasCriticalData ? (
        <Alert tone="warning" title="Offline view">
          Charity browsing and your current impact history remain visible, but changing future
          allocations needs an active connection.
        </Alert>
      ) : null}

      {isInitialLoading ? <PageSectionSkeleton cards={4} rows={4} /> : null}

      {!isInitialLoading && hasBlockingError ? (
        <OperationalStatePanel
          action={<RetryButton onClick={() => void retryCharityQueries()} />}
          description="The charity catalog or your impact records could not be loaded from the backend."
          state="error"
          title="Charity data is temporarily unavailable"
        />
      ) : null}

      {!isInitialLoading && !hasBlockingError ? (
        <>
      <Alert tone="info" title="Future allocations only">
        Changing your charity preference affects future payments and contributions. Historical
        allocations already recorded by the backend remain immutable.
      </Alert>

      {selectionMutation.error ? (
        <Alert tone="danger" title="We could not update your charity preference">
          {getErrorMessage(selectionMutation.error)}
        </Alert>
      ) : null}

      {selectionSuccessMessage ? (
        <Alert tone="success" title="Preference updated">
          {selectionSuccessMessage}
        </Alert>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-surface-elevated/95">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Current charity
          </p>
          <h2 className="mt-4 font-display text-3xl text-foreground">
            {currentSelection?.name || "Not chosen"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {currentSelection
              ? "This cause will receive the charity allocation on future payments."
              : "Select a cause so future payments know where the impact share should flow."}
          </p>
        </Card>
        <Card className="bg-surface-elevated/95">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Total donated
          </p>
          <h2 className="mt-4 font-display text-3xl text-foreground">
            {impactSummary.totalDonatedMinor
              ? formatCurrency(impactSummary.totalDonatedMinor / 100)
              : "₹0"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Calculated from succeeded donation and contribution records currently returned by the
            backend.
          </p>
        </Card>
        <Card className="bg-surface-elevated/95">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Supported causes
          </p>
          <h2 className="mt-4 font-display text-3xl text-foreground">
            {impactSummary.selectedCharityCount}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Unique charities reflected across your current preference and succeeded contributions.
          </p>
        </Card>
        <Card className="bg-surface-elevated/95">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Contribution history
          </p>
          <h2 className="mt-4 font-display text-3xl text-foreground">
            {impactSummary.contributionCount}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Donation-linked records shown here are designed to stay traceable, not vague.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Selected causes
              </p>
              <h2 className="mt-2 font-display text-2xl text-foreground">
                Your current and supported charities
              </h2>
            </div>
            <Badge tone={currentSelection ? "success" : "warning"}>
              {currentSelection ? "Active selection" : "Selection needed"}
            </Badge>
          </div>

          {currentSelection ? (
            <div className="space-y-5">
              <CharityVisual
                label={currentSelection.profile.visualLabel}
                category={currentSelection.category}
                className={currentSelection.profile.visualClassName}
              />
              <div>
                <h3 className="font-display text-3xl text-foreground">{currentSelection.name}</h3>
                <p className="mt-3 text-sm leading-8 text-muted-foreground">
                  {currentSelection.profile.longDescription}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentSelection.impactTags.map((tag) => (
                  <Badge key={tag} tone="muted">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="rounded-3xl border border-border/70 bg-surface-soft/80 p-5">
                <p className="text-sm font-semibold text-foreground">Preference timing</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Effective from {formatDate(selectionQuery.data?.effectiveFrom)}.
                  {selectionQuery.data?.reason?.trim()
                    ? ` Latest reason: ${selectionQuery.data.reason}`
                    : " No change reason was recorded on the current selection."}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              eyebrow="No selection yet"
              title="Choose a cause for future payments"
              description="Your membership can still feel incomplete if the impact destination has not been chosen yet."
            />
          )}

          {impactSummary.selectedCharities.length > 1 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Supported across history</p>
              <div className="flex flex-wrap gap-2">
                {impactSummary.selectedCharities.map((charity) => (
                  <Badge key={charity.id} tone={charity.id === currentSelection?.id ? "success" : "info"}>
                    {charity.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Contribution history
              </p>
              <h2 className="mt-2 font-display text-2xl text-foreground">
                Recent personal impact records
              </h2>
            </div>
            <Badge tone="info">{recentDonations.length} shown</Badge>
          </div>

          {recentDonations.length ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Charity</TableHeaderCell>
                      <TableHeaderCell>Amount</TableHeaderCell>
                      <TableHeaderCell>Source</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Date</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {recentDonations.map((donation) => {
                      const charity = findCharityById(charities, donation.charityId);

                      return (
                        <TableRow key={donation.id}>
                          <TableCell>{charity?.name || donation.charityId}</TableCell>
                          <TableCell>{donation.amountMajor}</TableCell>
                          <TableCell>{toStatusLabel(donation.source)}</TableCell>
                          <TableCell>
                            <Badge tone={toStatusTone(donation.status)}>
                              {toStatusLabel(donation.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(donation.finalizedAt || donation.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {recentDonations.map((donation) => {
                  const charity = findCharityById(charities, donation.charityId);

                  return (
                    <div
                      key={donation.id}
                      className="rounded-3xl border border-border/70 bg-surface-soft/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">
                          {charity?.name || donation.charityId}
                        </p>
                        <Badge tone={toStatusTone(donation.status)}>
                          {toStatusLabel(donation.status)}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {donation.amountMajor} • {toStatusLabel(donation.source)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatDate(donation.finalizedAt || donation.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              Contribution history will appear here when the backend returns donation or payment
              linked records for your account.
            </p>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 rounded-[32px] border border-border/70 bg-surface-elevated/90 p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="space-y-3">
            <Label htmlFor="charity-management-search">Search causes</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="charity-management-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-11"
                placeholder="Search by mission, category, or impact tag"
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="selection-reason">Optional change note</Label>
            <Textarea
              id="selection-reason"
              value={selectionReason}
              onChange={(event) => setSelectionReason(event.target.value)}
              placeholder="Optional note about why you’re changing your future allocation"
              className="min-h-[48px]"
            />
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
          {filteredCharities.map((charity) => {
            const isSelected = currentSelection?.id === charity.id;

            return (
              <CharityCard
                key={charity.id}
                charity={charity}
                selected={isSelected}
                onSelect={
                  isSelected
                    ? undefined
                    : () => {
                        if (selectionMutation.isPending) {
                          return;
                        }

                        setSelectionSuccessMessage(null);
                        void selectionMutation.mutateAsync(charity.id);
                      }
                }
                selectLabel={
                  selectionMutation.isPending ? "Updating..." : "Use for future payments"
                }
                selectDisabled={selectionMutation.isPending || !isOnline}
              />
            );
          })}
        </div>

        {!filteredCharities.length ? (
          <EmptyState
            eyebrow="No matches"
            title="No charities matched these filters"
            description="Try another search term or return to All categories to explore the full impact catalog."
            actionLabel="Reset filters"
            onAction={() => {
              setSearchTerm("");
              setActiveCategory("All");
            }}
          />
        ) : null}
      </div>
        </>
      ) : null}
    </div>
  );
};
