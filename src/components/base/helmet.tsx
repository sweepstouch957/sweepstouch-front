import Head from 'next/head';

import type { FC } from 'react';

interface HelmetProps {
  heading?: string;
}

export const Helmet: FC<HelmetProps> = (props) => {
  const { heading } = props;

  const pageTitle = heading ? heading + ' - UIFort' : 'React UI Kit and Admin Dashboard Template';

  return (
    <Head>
      <title>{pageTitle}</title>
    </Head>
  );
};


