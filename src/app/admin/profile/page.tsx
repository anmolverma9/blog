'use strict';

import ProfileClient from './profile-client';

export const metadata = {
  title: 'My Profile',
  description: 'Edit your admin profile, bio, and account password.',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
