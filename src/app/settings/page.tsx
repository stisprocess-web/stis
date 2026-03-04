/**
 * @module app/settings/page
 * Business settings — company info, roles, integrations, and compliance.
 */

import { PageHeader } from "@/components/page-header";
import { SettingsClient } from "@/components/settings-client";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Company configuration, access roles, integrations, and compliance management."
      />
      <SettingsClient />
    </div>
  );
}
