'use strict';

import SettingsClient from './settings-client';

export const metadata = {
  title: 'System Settings',
  description: 'Manage website settings, Google Analytics codes, and custom script injections.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
