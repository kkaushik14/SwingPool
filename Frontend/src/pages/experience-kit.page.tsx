import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Modal,
  SectionHeading,
  Skeleton,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabPanel
} from "@/components";

export const ExperienceKitPage = () => {
  const [tab, setTab] = useState("components");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Experience Kit"
        title="The frontend design system foundation"
        description="This page keeps the visual system tangible: buttons, badges, alerts, tables, drawers, modals, tabs, steppers, skeletons, and empty states all live here for quick reuse."
        action={<Badge tone="accent">Light + Dark ready</Badge>}
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        options={[
          { value: "components", label: "Components" },
          { value: "states", label: "States" },
          { value: "surfaces", label: "Surfaces" }
        ]}
      />

      {tab === "components" ? (
        <TabPanel>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="font-display text-2xl text-foreground">Buttons & badges</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="coral">Coral</Button>
                <Badge tone="success">Verified</Badge>
                <Badge tone="warning">Grace period</Badge>
                <Badge tone="danger">Failed</Badge>
              </div>
            </Card>
            <Card>
              <h3 className="font-display text-2xl text-foreground">Modal & drawer</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => setModalOpen(true)}>Open modal</Button>
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                  Open drawer
                </Button>
              </div>
            </Card>
          </div>
        </TabPanel>
      ) : null}

      {tab === "states" ? (
        <TabPanel>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h3 className="font-display text-2xl text-foreground">Alerts</h3>
              <div className="mt-5 space-y-3">
                <Alert tone="success" title="Subscription ready">Profile verification and eligibility are aligned.</Alert>
                <Alert tone="warning" title="Grace period active">Renewal failed and needs attention within the configured window.</Alert>
                <Alert tone="danger" title="Payment issue">The backend source of truth still shows a failed or expired payment state.</Alert>
              </div>
            </Card>
            <Card>
              <h3 className="font-display text-2xl text-foreground">Skeletons & empty states</h3>
              <div className="mt-5 space-y-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-20 w-full" />
                <EmptyState
                  eyebrow="Empty state"
                  title="No rows yet"
                  description="The system supports graceful fallbacks while backend data is still sparse or local setup is incomplete."
                />
              </div>
            </Card>
          </div>
        </TabPanel>
      ) : null}

      {tab === "surfaces" ? (
        <TabPanel>
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <h3 className="font-display text-2xl text-foreground">Table surface</h3>
              <Table className="mt-5">
                <TableHead>
                  <tr>
                    <TableHeaderCell>Column</TableHeaderCell>
                    <TableHeaderCell>Use</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Alerts</TableCell>
                    <TableCell>Operational messaging</TableCell>
                    <TableCell>Ready</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Drawer</TableCell>
                    <TableCell>Mobile navigation & side tasks</TableCell>
                    <TableCell>Ready</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
            <Card>
              <h3 className="font-display text-2xl text-foreground">Stepper surface</h3>
              <div className="mt-5">
                <Stepper
                  steps={[
                    { title: "Register", description: "Create secure access.", state: "complete" },
                    { title: "Verify profile", description: "Complete and submit required profile details.", state: "current" },
                    { title: "Activate subscription", description: "Proceed only after eligibility is green.", state: "upcoming" }
                  ]}
                />
              </div>
            </Card>
          </div>
        </TabPanel>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal style"
        description="Use this for confirmations, previews, and focused tasks."
        footer={<Button onClick={() => setModalOpen(false)}>Close modal</Button>}
      >
        <p className="text-sm text-muted-foreground">Rounded corners, layered surfaces, and soft shadows keep dialogs warm and premium.</p>
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Drawer style">
        <p className="text-sm text-muted-foreground">Drawers power mobile navigation and secondary workflows without overwhelming the page.</p>
      </Drawer>
    </div>
  );
};
