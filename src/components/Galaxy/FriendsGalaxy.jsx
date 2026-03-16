import React, { useState, useEffect } from 'react';
import { getOrCreateUserId } from '../../utils/inviteHelpers';
import { fetchFriends, fetchSharedResonance } from '../../utils/resonanceApi';
import { getCurrentWeekStart } from '../../utils/constellationApi';
import GalaxyView from './GalaxyView';
import './FriendsGalaxy.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

/**
 * 星系页：好友列表，点击好友进入双人星轨图
 */
function FriendsGalaxy({ onClose }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [resonanceData, setResonanceData] = useState(null);
  const [resonanceLoading, setResonanceLoading] = useState(false);

  const myUserId = getOrCreateUserId();

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

  const handleFriendClick = (friendId) => {
    if (!API_BASE || !myUserId || !friendId) return;
    setSelectedFriendId(friendId);
    setResonanceData(null);
    setResonanceLoading(true);
    const weekStart = getCurrentWeekStart();
    fetchSharedResonance(myUserId, friendId, weekStart).then((data) => {
      setResonanceData(data);
      setResonanceLoading(false);
    });
  };

  const handleCloseGalaxy = () => {
    setSelectedFriendId(null);
    setResonanceData(null);
  };

  if (selectedFriendId) {
    return (
      <GalaxyView
        data={resonanceData}
        friendDisplayName={selectedFriendId?.slice(0, 8) || '好友'}
        onClose={handleCloseGalaxy}
        loading={resonanceLoading}
      />
    );
  }

  return (
    <div className="friends-galaxy-backdrop" onClick={onClose}>
      <div className="friends-galaxy-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="friends-galaxy-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <h3 className="friends-galaxy-title">星系 · 双人星轨</h3>
        <p className="friends-galaxy-hint">点击好友，查看你们本周的星轨重叠与共鸣</p>
        {loading ? (
          <p className="friends-galaxy-loading">加载中…</p>
        ) : friends.length === 0 ? (
          <p className="friends-galaxy-empty">暂无好友，邀请好友一起记录拾光即可在此看到双人星轨</p>
        ) : (
          <ul className="friends-galaxy-list">
            {friends.map((friendId) => (
              <li key={friendId}>
                <button
                  type="button"
                  className="friends-galaxy-friend"
                  onClick={() => handleFriendClick(friendId)}
                >
                  <span className="friends-galaxy-avatar">
                    {friendId.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="friends-galaxy-name">{friendId.slice(0, 12)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FriendsGalaxy;
