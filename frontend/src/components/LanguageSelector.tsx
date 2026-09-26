import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('nav.language')}>
          <Globe className="h-[1.2rem] w-[1.2rem]" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('en')} className="cursor-pointer" aria-checked={language === 'en'} role="menuitemradio">
          <span>English</span>
          {language === 'en' && <span className="ml-auto" aria-hidden="true">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('de')} className="cursor-pointer" aria-checked={language === 'de'} role="menuitemradio">
          <span>Deutsch</span>
          {language === 'de' && <span className="ml-auto" aria-hidden="true">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
