'use client';

import EditSweepstake from '@/components/application-ui/content-shells/sweepstakes/edit-sweepstake';
import { useParams } from 'next/navigation';
import React from 'react';

function Page(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  return <EditSweepstake id={id} />;
}

export default Page;
