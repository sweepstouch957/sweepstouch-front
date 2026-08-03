'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { TaskDetail } from 'src/components/application-ui/content-shells/tasks/task-detail';

function Page(): React.JSX.Element {
  const { taskId } = useParams<{ taskId: string }>();
  return <TaskDetail taskId={taskId} />;
}

export default Page;
