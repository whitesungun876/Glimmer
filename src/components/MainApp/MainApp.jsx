import React, { useState, useEffect, useRef, useCallback } from 'react';
import MorningRoutine from './MorningRoutine';
import EveningRoutine from './EveningRoutine';
import Welcome from './Welcome';
import GalaxyScreen from '../Galaxy/GalaxyScreen';
import ShareCardModal from '../Share/ShareCardModal';
import ValidationPopup from '../Validation/ValidationPopup';
import { getOrCreateUserId } from '../../utils/inviteHelpers';
import { fetchWeeklyConstellation, fetchInviteCode } from '../../utils/constellationApi';
import { vizJsonToSvgString } from '../../utils/vizToSvg';
import {
  fetchPendingValidationRequests,
  confirmValidation,
  skipValidation,
} from '../../utils/validationApi';
import { fetchPendingEnergy, markEnergySeen } from '../../utils/energyApi';
import EnergyReceived from '../Energy/EnergyReceived';
import SparkView from '../DailySpark/SparkView';
import { checkAndFireReminders } from '../../utils/reminderHelpers';

const API_BASE = process.env.REACT_APP_API_URL || '';

function MainApp({ userData }) {
  const [theme, setTheme] = useState('dawn');
  const [showWelcome, setShowWelcome] = useState(true);
  const [mode, setMode] = useState(null); // 'morning' or 'evening'
  const [stars, setStars] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [constellationSvg, setConstellationSvg] = useState(null);
  const [shareInviteCode, setShareInviteCode] = useState(null);
  const [validationRequest, setValidationRequest] = useState(null);
  const [validationQueue, setValidationQueue] = useState([]);
  const [screenIndex, setScreenIndex] = useState(0); // 0 = Home, 1 = Galaxy
  const [hasUnreadLightUps, setHasUnreadLightUps] = useState(false); // 好友未读「点亮」红点
  const [pendingEnergy, setPendingEnergy] = useState([]);
  const [showEnergyReceived, setShowEnergyReceived] = useState(false);
  const [viewSparkId, setViewSparkId] = useState(null);
  const galaxyScrollRef = useRef(null);
  const scrollLockRef = useRef(false);

  // URL 带 ?spark_id=xxx 时展示好友的 Daily Spark 点亮页
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('spark_id');
    if (id) setViewSparkId(id);
  }, []);

  const handleCloseSparkView = () => {
    setViewSparkId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('spark_id');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  // 根据时间设置主题
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) {
        setTheme('dawn'); // 晨曦金
      } else if (hour >= 11 && hour < 18) {
        setTheme('noon'); // 午后蓝
      } else {
        setTheme('night'); // 月光紫
      }
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, []);

  // 提醒：每分钟检查是否到达设定时间，若已授权则发送浏览器通知
  useEffect(() => {
    checkAndFireReminders();
    const t = setInterval(checkAndFireReminders, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // 夜晚模式生成星星
  useEffect(() => {
    if (theme === 'night') {
      const newStars = [];
      for (let i = 0; i < 50; i++) {
        newStars.push({
          id: i,
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          delay: Math.random() * 3 + 's',
          duration: (Math.random() * 2 + 2) + 's'
        });
      }
      setStars(newStars);
    } else {
      setStars([]);
    }
  }, [theme]);

  // 创建水波纹效果
  const createRipple = (e) => {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    e.currentTarget.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 2000);
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    setShowWelcome(false);
  };

  const handleComplete = () => {
    setMode(null);
    setShowWelcome(true);
  };

  // 进入主页时拉取待处理的天赋互证请求（好友 B 看到“A 本周展现了极强的[共情力]，你认同吗？”）
  useEffect(() => {
    if (!API_BASE) return;
    const userId = getOrCreateUserId();
    if (!userId) return;
    fetchPendingValidationRequests(userId).then((requests) => {
      if (requests.length > 0) {
        setValidationRequest(requests[0]);
        setValidationQueue(requests.slice(1));
      } else {
        setValidationRequest(null);
        setValidationQueue([]);
      }
    });
  }, [showWelcome]);

  // 进入主页时拉取未读能量投射；若有则全屏流星 + 提示“[好友名] 为你的星空投掷了一枚萤火，愿你今夜好梦。”
  useEffect(() => {
    if (!API_BASE) return;
    const userId = getOrCreateUserId();
    if (!userId) return;
    fetchPendingEnergy(userId).then((projections) => {
      if (projections && projections.length > 0) {
        setPendingEnergy(projections);
        setShowEnergyReceived(true);
      } else {
        setPendingEnergy([]);
        setShowEnergyReceived(false);
      }
    });
  }, [showWelcome]);

  // 预留：拉取好友未读「点亮」数量，用于星系 Tab 红点（API 就绪后接入）
  useEffect(() => {
    if (!API_BASE || !getOrCreateUserId()) return;
    setHasUnreadLightUps(false);
  }, [screenIndex]);

  const handleEnergyReceivedClose = async () => {
    const userId = getOrCreateUserId();
    const ids = pendingEnergy.map((p) => p.id).filter(Boolean);
    if (userId && ids.length > 0) {
      await markEnergySeen(userId, ids);
    }
    setShowEnergyReceived(false);
    setPendingEnergy([]);
  };

  const goToGalaxyPanel = useCallback((index) => {
    const el = galaxyScrollRef.current;
    if (!el) return;
    scrollLockRef.current = true;
    setScreenIndex(index);
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    setTimeout(() => { scrollLockRef.current = false; }, 400);
  }, []);

  const handleGalaxyScroll = useCallback(() => {
    if (scrollLockRef.current) return;
    const el = galaxyScrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const index = Math.round(el.scrollLeft / width);
    setScreenIndex(index);
  }, []);

  const handleValidationConfirm = async (requestId) => {
    await confirmValidation(requestId);
    setValidationRequest(validationQueue[0] ?? null);
    setValidationQueue((q) => q.slice(1));
  };

  const handleValidationSkip = async (requestId) => {
    await skipValidation(requestId);
    setValidationRequest(validationQueue[0] ?? null);
    setValidationQueue((q) => q.slice(1));
  };

  // 打开分享弹层时拉取本周星座图（Phase 3 viz_json → SVG）及后端邀请码
  useEffect(() => {
    if (!showShareModal) {
      setConstellationSvg(null);
      setShareInviteCode(null);
      return;
    }
    const userId = getOrCreateUserId();
    if (API_BASE) {
      Promise.all([
        fetchWeeklyConstellation(API_BASE, userId),
        fetchInviteCode(API_BASE, userId),
      ]).then(([constellationData, code]) => {
        if (constellationData?.viz_json) setConstellationSvg(vizJsonToSvgString(constellationData.viz_json));
        else setConstellationSvg(null);
        setShareInviteCode(code ?? null);
      }).catch(() => {
        setConstellationSvg(null);
        setShareInviteCode(null);
      });
    } else {
      setConstellationSvg(null);
      setShareInviteCode(null);
    }
  }, [showShareModal]);

  const isGalaxySpace = mode === null;
  const bgStyle = isGalaxySpace
    ? {
        background: screenIndex === 0
          ? 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)'
          : 'linear-gradient(180deg, #0F0F1A 0%, #050505 100%)',
      }
    : undefined;

  return (
    <div
      className={`app-container ${theme} ${isGalaxySpace ? 'galaxy-space-root' : ''}`}
      style={bgStyle}
      onClick={createRipple}
    >
      {/* 背景光晕 */}
      <div className="glow"></div>
      <div className="glow"></div>
      <div className="glow"></div>

      {/* 星光效果（仅夜晚） */}
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            animationDelay: star.delay,
            animationDuration: star.duration
          }}
        />
      ))}

      {/* 主内容 */}
      <div className={`main-content ${isGalaxySpace ? 'galaxy-space-main' : ''}`}>
        {isGalaxySpace ? (
          <>
            <div className="galaxy-space-tabs">
              <button
                type="button"
                className={`galaxy-space-tab ${screenIndex === 0 ? 'active' : ''}`}
                onClick={() => goToGalaxyPanel(0)}
              >
                拾光
              </button>
              <button
                type="button"
                className={`galaxy-space-tab ${screenIndex === 1 ? 'active' : ''}`}
                onClick={() => goToGalaxyPanel(1)}
              >
                <span className="galaxy-space-tab-dot-wrap">
                  星系
                  {hasUnreadLightUps && <span className="galaxy-dot" aria-hidden />}
                </span>
              </button>
            </div>
            <div
              ref={galaxyScrollRef}
              className="galaxy-space-scroll"
              onScroll={handleGalaxyScroll}
            >
              <div className="galaxy-space-panels">
                <div className="galaxy-space-panel galaxy-space-panel-home">
                  <Welcome
                    userData={userData}
                    theme={theme}
                    onModeSelect={handleModeSelect}
                    onOpenShare={() => setShowShareModal(true)}
                    onSwitchToGalaxy={() => goToGalaxyPanel(1)}
                  />
                </div>
                <div className="galaxy-space-panel galaxy-space-panel-galaxy">
                  <GalaxyScreen />
                </div>
              </div>
            </div>
          </>
        ) : null}

        {validationRequest && (
          <ValidationPopup
            request={validationRequest}
            onConfirm={handleValidationConfirm}
            onSkip={handleValidationSkip}
            onClose={() => {
              setValidationRequest(validationQueue[0] ?? null);
              setValidationQueue(validationQueue.slice(1));
            }}
          />
        )}

        {showEnergyReceived && pendingEnergy.length > 0 && (
          <EnergyReceived
            projections={pendingEnergy}
            onClose={handleEnergyReceivedClose}
          />
        )}

        {viewSparkId && (
          <SparkView sparkId={viewSparkId} onClose={handleCloseSparkView} />
        )}

        {showShareModal && (
          <ShareCardModal
            userData={userData}
            constellationSvg={constellationSvg}
            inviteCode={shareInviteCode}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {mode === 'morning' && (
          <div className="routine-screen" aria-hidden="false">
            <MorningRoutine
              userData={userData}
              theme={theme}
              onComplete={handleComplete}
            />
          </div>
        )}

        {mode === 'evening' && (
          <div className="routine-screen" aria-hidden="false">
            <EveningRoutine
              userData={userData}
              theme={theme}
              onComplete={handleComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MainApp;
