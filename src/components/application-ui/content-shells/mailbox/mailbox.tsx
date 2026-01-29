import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { Box, Divider, Theme, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useRef } from 'react';
import { ButtonIcon } from 'src/components/base/styles/button-icon';
import { useSearchParams } from 'src/hooks/use-search-params';
// ✅ zustand store (tu archivo)
import useMailStore, { closeSidebar, getTags, openSidebar, runMailThunk } from 'src/slices/mailbox';
import { MailboxResults } from './results';
import { MailboxSidebar } from './sidebar';
import { MailboxSingle } from './single';

const Component = () => {
  const { tags, sidebarOpen } = useMailStore((state) => ({
    tags: state.tags,
    sidebarOpen: state.sidebarOpen,
  }));

  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const theme = useTheme();
  const pageRef = useRef<HTMLDivElement | null>(null);

  const searchParams = useSearchParams();
  const mailId = (searchParams.get('mailId') as string) || '';
  const tag = (searchParams.get('tag') as string) || '';

  useEffect(() => {
    // ✅ igual que dispatch(getTags())
    runMailThunk(getTags());
  }, []);

  const handleDrawerToggle = (): void => {
    if (sidebarOpen) {
      runMailThunk(closeSidebar());
    } else {
      runMailThunk(openSidebar());
    }
  };

  const handleCloseSidebar = () => {
    runMailThunk(closeSidebar());
  };

  const handleOpenSidebar = () => {
    runMailThunk(openSidebar());
  };

  return (
    <Box
      display="flex"
      flex={1}
      position="relative"
      zIndex={2}
      ref={pageRef}
      overflow="hidden"
    >
      <MailboxSidebar
        tag={tag}
        onClose={handleCloseSidebar}
        onOpen={handleOpenSidebar}
        open={sidebarOpen}
        parentContainer={pageRef.current}
        tags={tags}
      />

      <Box
        flex={1}
        position="relative"
        zIndex={5}
        overflow="hidden"
        sx={{
          transition: sidebarOpen
            ? theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              })
            : theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
        }}
      >
        {!lgUp && (
          <>
            <ButtonIcon
              variant="outlined"
              color="secondary"
              sx={{
                mx: { xs: 2, sm: 3 },
                my: 2,
                color: 'primary.main',
              }}
              onClick={handleDrawerToggle}
              size="small"
            >
              <MenuRoundedIcon />
            </ButtonIcon>
            <Divider />
          </>
        )}

        {mailId ? (
          <MailboxSingle
            tag={tag}
            mailId={mailId}
          />
        ) : (
          <MailboxResults tag={tag} />
        )}
      </Box>
    </Box>
  );
};

export default Component;
