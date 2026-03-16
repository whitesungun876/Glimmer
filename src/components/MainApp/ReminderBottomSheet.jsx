import React, { useState, useEffect } from 'react';
import { getReminderSettings, saveReminderSettings } from '../../utils/reminderHelpers';

function ReminderBottomSheet({ open, onClose, onSaved }) {
  const [morningEnabled, setMorningEnabled] = useState(false);
  const [morningTime, setMorningTime] = useState('07:30');
  const [eveningEnabled, setEveningEnabled] = useState(false);
  const [eveningTime, setEveningTime] = useState('21:00');

  useEffect(() => {
    if (open) {
      const s = getReminderSettings();
      setMorningEnabled(s.morningEnabled);
      setMorningTime(s.morningTime);
      setEveningEnabled(s.eveningEnabled);
      setEveningTime(s.eveningTime);
    }
  }, [open]);

  const handleSave = () => {
    saveReminderSettings({
      morningEnabled,
      morningTime,
      eveningEnabled,
      eveningTime,
    });
    onSaved?.({ morningEnabled, morningTime, eveningEnabled, eveningTime });
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="reminder-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="reminder-sheet" role="dialog" aria-label="提醒设置">
        <div className="reminder-sheet-handle" />
        <h3 className="reminder-sheet-title">微光邀约提醒</h3>

        <div className="reminder-sheet-row">
          <div className="reminder-sheet-label">
            <span className="reminder-sheet-icon">☀️</span>
            <span>晨间提醒</span>
          </div>
          <label className="reminder-sheet-switch">
            <input
              type="checkbox"
              checked={morningEnabled}
              onChange={(e) => setMorningEnabled(e.target.checked)}
            />
            <span className="reminder-sheet-slider" />
          </label>
        </div>
        {morningEnabled && (
          <div className="reminder-sheet-row reminder-sheet-time-row">
            <span className="reminder-sheet-time-label">提醒时间</span>
            <input
              type="time"
              className="reminder-sheet-time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
            />
          </div>
        )}

        <div className="reminder-sheet-row">
          <div className="reminder-sheet-label">
            <span className="reminder-sheet-icon">🌙</span>
            <span>晚间提醒</span>
          </div>
          <label className="reminder-sheet-switch">
            <input
              type="checkbox"
              checked={eveningEnabled}
              onChange={(e) => setEveningEnabled(e.target.checked)}
            />
            <span className="reminder-sheet-slider" />
          </label>
        </div>
        {eveningEnabled && (
          <div className="reminder-sheet-row reminder-sheet-time-row">
            <span className="reminder-sheet-time-label">提醒时间</span>
            <input
              type="time"
              className="reminder-sheet-time"
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
            />
          </div>
        )}

        <button className="reminder-sheet-save" onClick={handleSave}>
          保存
        </button>
      </div>
    </>
  );
}

export default ReminderBottomSheet;
