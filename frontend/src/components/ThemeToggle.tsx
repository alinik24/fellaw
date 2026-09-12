import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('nav.theme')}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer" aria-checked={theme === 'light'} role="menuitemradio">
          <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>{t('nav.themeLight')}</span>
          {theme === 'light' && <span className="ml-auto" aria-hidden="true">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer" aria-checked={theme === 'dark'} role="menuitemradio">
          <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>{t('nav.themeDark')}</span>
          {theme === 'dark' && <span className="ml-auto" aria-hidden="true">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer" aria-checked={theme === 'system'} role="menuitemradio">
          <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>{t('nav.themeSystem')}</span>
          {theme === 'system' && <span className="ml-auto" aria-hidden="true">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
