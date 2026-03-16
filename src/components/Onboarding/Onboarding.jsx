import React, { useState } from 'react';
import PureWelcomeScreen from './PureWelcomeScreen';
import ScienceBackingScreen from './ScienceBackingScreen';
import GrowthCurveScreen from './GrowthCurveScreen';
import FeatureJourneyScreen from './FeatureJourneyScreen';
import GoalContractScreen from './GoalContractScreen';

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    goal: '', // 30 天目标：stop_rumination | find_light | affirm_self | ease_anxiety | deep_awareness
  });

  const handleGoalContractSubmit = ({ name, goal }) => {
    const newUserData = { ...userData, name, goal };
    setUserData(newUserData);
    onComplete(newUserData);
  };

  return (
    <div className="app-container onboarding-container">
      {/* 萤火虫背景光点 */}
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>

      {/* 欢迎页 → 科学背书 → 对比曲线 → 功能介绍 → 目标设定与心理契约 */}
      {step === 0 && <PureWelcomeScreen onNext={() => setStep(1)} />}
      {step === 1 && <ScienceBackingScreen onNext={() => setStep(2)} />}
      {step === 2 && <GrowthCurveScreen onNext={() => setStep(3)} />}
      {step === 3 && <FeatureJourneyScreen onNext={() => setStep(4)} />}
      {step === 4 && <GoalContractScreen onComplete={handleGoalContractSubmit} />}
    </div>
  );
}

export default Onboarding;

