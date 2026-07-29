import React from 'react';
import { ThemeSection } from './sections/ThemeSection.tsx';
import { LanguageSection } from './sections/LanguageSection.tsx';
import { DateTimeSection } from './sections/DateTimeSection.tsx';
import { NotificationSection } from './sections/NotificationSection.tsx';

export const SettingsTab: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 max-h-[calc(90vh-12rem)] overflow-y-auto pr-1">
      <ThemeSection />
      <LanguageSection />
      <DateTimeSection />
      <NotificationSection />
      <div className="pb-2" />
    </div>
  );
};

export default SettingsTab;
