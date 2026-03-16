import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding/Onboarding';
import MainApp from './components/MainApp/MainApp';
import {
  getInviteCodeFromUrl,
  setPendingInviteCode,
  getOrCreateUserId,
  acceptInviteAfterRegister,
} from './utils/inviteHelpers';
import './styles/onboarding.css';
import './styles/main.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [userData, setUserData] = useState(null);

  // 检查是否已完成 Onboarding
  useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      setUserData(JSON.parse(savedUserData));
      setOnboardingComplete(true);
    }
  }, []);

  // 动态链接：进入时解析 invite_code 并暂存
  useEffect(() => {
    const code = getInviteCodeFromUrl();
    if (code) setPendingInviteCode(code);
  }, []);

  const handleOnboardingComplete = async (data) => {
    setUserData(data);
    setOnboardingComplete(true);
    localStorage.setItem('userData', JSON.stringify(data));
    const userId = getOrCreateUserId();
    await acceptInviteAfterRegister(userId, API_BASE);
  };

  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Onboarding 完成后显示主应用界面
  return <MainApp userData={userData} />;
}

export default App;
