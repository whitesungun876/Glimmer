import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getOrCreateUserId, getOrCreateInviteCode, buildInviteLink } from '../../utils/inviteHelpers';
import { fetchInviteCode } from '../../utils/constellationApi';
import { fetchFriends, fetchSharedResonance } from '../../utils/resonanceApi';
import { getCurrentWeekStart } from '../../utils/constellationApi';
import { vizJsonToSvgString } from '../../utils/vizToSvg';
import GalaxyView from './GalaxyView';
import './GalaxyScreen.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

// 散落位置：网格 + 固定偏移，保证布局稳定且带漂浮感
function useScatteredPositions(count, cols = 3) {
  return React.useMemo(() => {
    const positions = [];
    const offsets = [2, -3, 4, -2, 3, -4, 1, -1, 5, -5, 2, -2];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const o = offsets[i % offsets.length];
      const baseX = 18 + (col * 32) + (o % 3) * 3;
      const baseY = 36 + (row * 20) + (o % 2) * 4;
      positions.push({ left: `${baseX}%`, top: `${baseY}%` });
    }
    return positions;
  }, [count, cols]);
}

/**
 * Galaxy 屏：邀请 QR 卡片 + 散落好友 + 点击好友弹出迷你星图 + Resonance 打开双人星轨（带混合）
 */
function GalaxyScreen() {
  const myUserId = getOrCreateUserId();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [resonanceData, setResonanceData] = useState(null);
  const [resonanceLoading, setResonanceLoading] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [showFullResonance, setShowFullResonance] = useState(false);

  const positions = useScatteredPositions(friends.length);

  useEffect(() => {
    if (!API_BASE || !myUserId) {
      setFriends([]);
      setLoading(false);
      return;
    }
    fetchFriends(myUserId).then((list) => {
      setFriends(list);
      setLoading(false);
    });
  }, [myUserId]);

  const loadInviteCode = () => {
    if (!myUserId) return;
    setInviteLoading(true);
    if (API_BASE) {
      fetchInviteCode(API_BASE, myUserId).then((code) => {
        setInviteCode(code ?? getOrCreateInviteCode());
        setInviteLoading(false);
      });
    } else {
      setInviteCode(getOrCreateInviteCode());
      setInviteLoading(false);
    }
  };

  const handleFriendClick = (friendId) => {
    if (!API_BASE || !myUserId || !friendId) return;
    setSelectedFriendId(friendId);
    setResonanceData(null);
    setResonanceLoading(true);
    setShowMiniMap(true);
    setShowFullResonance(false);
    const weekStart = getCurrentWeekStart();
    fetchSharedResonance(myUserId, friendId, weekStart).then((data) => {
      setResonanceData(data);
      setResonanceLoading(false);
    });
  };

  const handleCloseMiniMap = () => {
    setShowMiniMap(false);
    setSelectedFriendId(null);
    setResonanceData(null);
  };

  const handleOpenResonance = () => {
    setShowMiniMap(false);
    setShowFullResonance(true);
  };

  const handleCloseFullResonance = () => {
    setShowFullResonance(false);
    setSelectedFriendId(null);
    setResonanceData(null);
  };

  const inviteLink = inviteCode ? buildInviteLink(inviteCode) : '';
  const friendViz = resonanceData?.user_b?.viz_json;
  const miniConstellationSvg = friendViz ? vizJsonToSvgString(friendViz) : '';

  if (showFullResonance && resonanceData) {
    return (
      <GalaxyView
        data={resonanceData}
        friendDisplayName={selectedFriendId?.slice(0, 8) || '好友'}
        onClose={handleCloseFullResonance}
        loading={false}
        useBlendMode
      />
    );
  }

  return (
    <div className="galaxy-screen">
      {/* 顶部：Galaxy Invite 卡片 */}
      <section className="galaxy-screen-invite">
        <button
          type="button"
          className="galaxy-invite-card"
          onClick={loadInviteCode}
          disabled={inviteLoading}
        >
          {inviteLoading ? (
            <span className="galaxy-invite-loading">生成中…</span>
          ) : inviteLink ? (
            <>
              <span className="galaxy-invite-label">Galaxy Invite</span>
              <div className="galaxy-invite-qr">
                <QRCodeSVG value={inviteLink} size={80} level="M" includeMargin={false} />
              </div>
              <span className="galaxy-invite-hint">扫码加入星系</span>
            </>
          ) : (
            <>
              <span className="galaxy-invite-label">Galaxy Invite</span>
              <span className="galaxy-invite-tap">点击生成邀请二维码</span>
            </>
          )}
        </button>
      </section>

      {/* 中央：散落好友图标 */}
      <section className="galaxy-screen-friends">
        {loading ? (
          <p className="galaxy-screen-loading">加载好友中…</p>
        ) : friends.length === 0 ? (
          <p className="galaxy-screen-empty">暂无好友，邀请好友一起记录即可在此看到双人星轨</p>
        ) : (
          <div className="galaxy-screen-friends-scatter">
            {friends.map((friendId, i) => (
              <button
                key={friendId}
                type="button"
                className="galaxy-screen-friend-icon"
                style={positions[i]}
                onClick={() => handleFriendClick(friendId)}
                title={friendId}
              >
                <span className="galaxy-screen-friend-avatar">
                  {friendId.slice(0, 1).toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 迷你星图弹层：仅好友星座，无文字日志 */}
      {showMiniMap && (
        <div className="galaxy-mini-map-backdrop" onClick={handleCloseMiniMap}>
          <div className="galaxy-mini-map-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="galaxy-mini-map-close"
              onClick={handleCloseMiniMap}
              aria-label="关闭"
            >
              ×
            </button>
            <h4 className="galaxy-mini-map-title">
              {selectedFriendId?.slice(0, 12)} 的本周星图
            </h4>
            {resonanceLoading ? (
              <p className="galaxy-mini-map-loading">加载中…</p>
            ) : miniConstellationSvg ? (
              <div
                className="galaxy-mini-map-svg"
                dangerouslySetInnerHTML={{ __html: miniConstellationSvg }}
              />
            ) : (
              <p className="galaxy-mini-map-empty">暂无本周星轨数据</p>
            )}
            {resonanceData && (
              <button
                type="button"
                className="galaxy-mini-map-resonance-btn"
                onClick={handleOpenResonance}
              >
                双人星轨 · Resonance
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GalaxyScreen;
