'use client';

import { Box, Card, CardActionArea, Container, Divider, Stack, Typography } from '@mui/material';
import { Breakpoint } from '@mui/system';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ApplicationUiDatepickerBasic from 'src/components/application-ui/datepicker/basic/basic';
import ApplicationUiDatepickerInline from 'src/components/application-ui/datepicker/inline/inline';
import ApplicationUiDatepickerLandscape from 'src/components/application-ui/datepicker/landscape/landscape';
import ApplicationUiDatepickerMobile from 'src/components/application-ui/datepicker/mobile/mobile';
import ApplicationUiDatepickerViews from 'src/components/application-ui/datepicker/views/views';
import { Helmet } from 'src/components/base/helmet';
import MarketingPageTitle from 'src/components/website/page-title';
import { MarketingLayout as Layout } from 'src/layouts/marketing';

const components: {
  element: JSX.Element;
  sourceCode?: string;
  title: string;
  isComplex: string;
  size: string;
  description: string;
  height: string;
  category: string;
}[] = [
  {
    element: <ApplicationUiDatepickerBasic />,
    title: 'Basic',
    isComplex: 'false',
    size: 'md',
    description: 'Simple and efficient design for straightforward date selection.',
    height: '536px',
    category: 'datepicker',
  },
  {
    element: <ApplicationUiDatepickerInline />,
    title: 'Inline',
    isComplex: 'false',
    size: 'xs',
    description: 'Always-visible calendar for embedding directly within content layouts.',
    height: '',
    category: 'datepicker',
  },
  {
    element: <ApplicationUiDatepickerLandscape />,
    title: 'Landscape',
    isComplex: 'false',
    size: 'sm',
    description: 'Wider view suitable for landscape orientations and broader displays.',
    height: '',
    category: 'datepicker',
  },
  {
    element: <ApplicationUiDatepickerMobile />,
    title: 'Mobile',
    isComplex: 'false',
    size: 'xs',
    description: 'Mobile-optimized with a touch-friendly interface for smaller screens.',
    height: '584px',
    category: 'datepicker',
  },
  {
    element: <ApplicationUiDatepickerViews />,
    title: 'Views',
    isComplex: 'false',
    size: 'md',
    description: 'Multiple view options for flexible date navigation and selection.',
    height: '574px',
    category: 'datepicker',
  },
];
const Page = () => {
  const {
    t,
  }: {
    t: any;
  } = useTranslation();
  const pageTitle = 'Datepicker';
  const pageDescription =
    'Implement our datepicker component for a userFriendly calendar interface, allowing easy date selection and navigation.';
  const formatTitle = (title: string) => {
    return title.replace(/([A-Z])/g, ' $1');
  };
  const pageTitleDisplay = formatTitle(pageTitle);
  function generateSrcPath(title: string, category?: string): string {
    const processString = (str: string) => {
      return str
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase()
        .replace(/[\s]+/g, '-');
    };
    const processedTitle = processString(title);
    let processedCategory = category && processString(category);
    return `/src/components/application-ui/${processedTitle}/${processedCategory}/`;
  }
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    toast.success('Component path copied to clipboard');
  };
  return (
    <>
      <Helmet heading={t(pageTitleDisplay)} />
      <MarketingPageTitle
        title={t(pageTitleDisplay)}
        subheading={t(pageDescription)}
      />
      <Box
        py={{
          xs: 2,
          md: 3,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Container maxWidth="xl">
            <Stack
              spacing={{
                xs: 3,
                sm: 4,
                md: 5,
              }}
              divider={<Divider />}
            >
              {components.map((component) => (
                <Card
                  key={component.title}
                  elevation={0}
                  variant="outlined"
                  sx={{
                    borderWidth: 2,
                    boxShadow: (theme) => `0 0 0 6px ${theme.palette.divider}`,
                    borderColor: (theme) =>
                      theme.palette.mode === 'dark' ? 'neutral.700' : 'neutral.500',
                    pb:
                      (component.size as Breakpoint) !== 'xl'
                        ? {
                            xs: 2,
                            sm: 3,
                          }
                        : undefined,
                  }}
                >
                  <Box
                    p={{
                      xs: 2,
                      sm: 3,
                    }}
                    mb={
                      (component.size as Breakpoint) !== 'xl'
                        ? {
                            xs: 2,
                            sm: 3,
                          }
                        : undefined
                    }
                    sx={{
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Typography variant="h4">{formatTitle(component.title)}</Typography>
                    {component.description && (
                      <Typography
                        variant="h5"
                        fontWeight={400}
                        color="text.secondary"
                      >
                        {component.description}
                      </Typography>
                    )}
                    <Box
                      mt={{
                        xs: 1,
                        sm: 2,
                      }}
                      display="flex"
                    >
                      <Card
                        elevation={0}
                        variant="outlined"
                      >
                        <CopyToClipboard
                          text={generateSrcPath(component.category, component.title)}
                          onCopy={handleCopy}
                        >
                          <CardActionArea
                            sx={{
                              py: 1,
                              px: 1.5,
                            }}
                          >
                            <Typography
                              variant="h6"
                              component="span"
                            >
                              {generateSrcPath(component.category, component.title)}
                            </Typography>
                          </CardActionArea>
                        </CopyToClipboard>
                      </Card>
                    </Box>
                  </Box>
                  <Container
                    disableGutters
                    maxWidth={component.size as Breakpoint}
                  >
                    {component.element}
                  </Container>
                </Card>
              ))}
            </Stack>
          </Container>
        </LocalizationProvider>
      </Box>
    </>
  );
};
export default Page;
