import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import { FC, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const LanguageFlag: FC<{ countryCode: string; size?: number }> = ({ countryCode, size = 20 }) => {
  const code = (countryCode || '').toUpperCase();
  
  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '50%' }}
    >
      <defs>
        <clipPath id={`clip-${code}`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${code})`}>
        {code === 'US' && (
          <>
            <rect width="100" height="100" fill="#fff" />
            <g fill="#b22234">
              <rect y="0" width="100" height="7.7" />
              <rect y="15.4" width="100" height="7.7" />
              <rect y="30.8" width="100" height="7.7" />
              <rect y="46.2" width="100" height="7.7" />
              <rect y="61.5" width="100" height="7.7" />
              <rect y="76.9" width="100" height="7.7" />
              <rect y="92.3" width="100" height="7.7" />
            </g>
            <rect width="45" height="53.8" fill="#3c3b6e" />
            <g fill="#fff">
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="20" cy="8" r="1.5" />
              <circle cx="32" cy="8" r="1.5" />
              <circle cx="14" cy="18" r="1.5" />
              <circle cx="26" cy="18" r="1.5" />
              <circle cx="38" cy="18" r="1.5" />
              <circle cx="8" cy="28" r="1.5" />
              <circle cx="20" cy="28" r="1.5" />
              <circle cx="32" cy="28" r="1.5" />
              <circle cx="14" cy="38" r="1.5" />
              <circle cx="26" cy="38" r="1.5" />
              <circle cx="38" cy="38" r="1.5" />
              <circle cx="8" cy="46" r="1.5" />
              <circle cx="20" cy="46" r="1.5" />
              <circle cx="32" cy="46" r="1.5" />
            </g>
          </>
        )}
        {code === 'ES' && (
          <>
            <rect width="100" height="100" fill="#c60b1e" />
            <rect y="25" width="100" height="50" fill="#ffc400" />
            <circle cx="35" cy="50" r="12" fill="#c60b1e" opacity="0.85" />
            <circle cx="35" cy="50" r="8" fill="#ffc400" />
          </>
        )}
        {code === 'DE' && (
          <>
            <rect width="100" height="33.3" fill="#000" />
            <rect y="33.3" width="100" height="33.3" fill="#dd0000" />
            <rect y="66.6" width="100" height="33.4" fill="#ffce00" />
          </>
        )}
        {code === 'FR' && (
          <>
            <rect width="33.3" height="100" fill="#002395" />
            <rect x="33.3" width="33.3" height="100" fill="#fff" />
            <rect x="66.6" width="33.4" height="100" fill="#ed2939" />
          </>
        )}
        {code === 'AE' && (
          <>
            <rect width="100" height="100" fill="#000" />
            <rect width="100" height="66.6" fill="#fff" />
            <rect width="100" height="33.3" fill="#00732f" />
            <rect width="25" height="100" fill="#ff0000" />
          </>
        )}
        {code === 'CN' && (
          <>
            <rect width="100" height="100" fill="#ee1c25" />
            <path d="M25,35L17,40L20,30L12,24L22,24L25,14L28,24L38,24L30,30L33,40Z" fill="#ffff00" />
            <circle cx="42" cy="18" r="3" fill="#ffff00" />
            <circle cx="48" cy="26" r="3" fill="#ffff00" />
            <circle cx="48" cy="38" r="3" fill="#ffff00" />
            <circle cx="42" cy="46" r="3" fill="#ffff00" />
          </>
        )}
      </g>
    </svg>
  );
};

type Language = 'en' | 'es' | 'de' | 'fr' | 'ae' | 'cn';

type LanguageOptions = {
  [key in Language]: {
    icon: string;
    label: string;
  };
};

const languages: Record<Language, string> = {
  en: 'US',
  es: 'ES',
  de: 'DE',
  fr: 'FR',
  ae: 'AE',
  cn: 'CN',
};

const languageOptions: LanguageOptions = {
  en: {
    icon: 'US',
    label: 'English',
  },
  es: {
    icon: 'ES',
    label: 'Spanish',
  },
  de: {
    icon: 'DE',
    label: 'German',
  },
  fr: {
    icon: 'FR',
    label: 'French',
  },
  ae: {
    icon: 'AE',
    label: 'Arabic',
  },
  cn: {
    icon: 'CN',
    label: 'Chinese',
  },
};

interface LanguageDropdownProps {
  color?: 'inherit' | 'primary' | 'secondary' | 'warning' | 'info' | 'success' | 'error';
  sx?: object;
}

const LanguageDropdown: FC<LanguageDropdownProps> = ({ color = 'inherit', sx = {} }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { t } = useTranslation();
  const { i18n } = useTranslation();

  const flag = languages[i18n.language as Language];

  const handleChange = useCallback(
    async (language: Language): Promise<void> => {
      await i18n.changeLanguage(language);
      const message = t('Language changed to English');
      toast.success(message, {
        position: 'bottom-center',
      });
      handleClose();
    },
    [i18n, t]
  );

  return (
    <>
      <Tooltip
        arrow
        title={t('Switch Language')}
      >
        <IconButton
          id="language-button"
          color={color}
          aria-controls={open ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          sx={{
            ...sx,
          }}
        >
          <LanguageFlag
            countryCode={flag}
            size={22}
          />
        </IconButton>
      </Tooltip>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        {(Object.keys(languageOptions) as Language[]).map((language) => {
          const option = languageOptions[language];
          return (
            <MenuItem
              onClick={() => handleChange(language)}
              key={language}
              selected={i18n.language === language}
            >
              <ListItemIcon>
                <LanguageFlag
                  countryCode={option.icon}
                  size={24}
                />
              </ListItemIcon>
              <ListItemText
                sx={{
                  pl: 1,
                }}
                primary={option.label}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default LanguageDropdown;
