import React, { useEffect, useState } from "react";
import { NeuralHubPage } from "../features/neural-hub/index.js";
import '../theme.css';
import { useTheme } from '../ThemeProvider.jsx';
import { OnboardingModal } from '../components/OnboardingModal.jsx';

export default function AppShell() {
  const { mode } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
    if (!localStorage.getItem('tradehax_onboarded')) {
      setShowOnboarding(true);
    }
  }, [mode]);
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('tradehax_onboarded', 'true');
  };
  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <NeuralHubPage />
    </>
  );
}
