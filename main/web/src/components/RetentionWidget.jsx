import React, { useEffect, useState } from "react";
import { ACHIEVEMENTS, checkAchievements, getNextAchievementInPhase, getEarnedAchievements, ONBOARDING_PHASES } from "../lib/achievements";

const COLORS = {
  panel: "#101D31",
  border: "#1A2B44",
  accent: "#21C8FF",
  text: "#E6F1FF",
  textDim: "#93A8C3",
  badge: "#00D68F",
  streak: "#FFB020",
};

export default function RetentionWidget({ userStats }) {
  const [earned, setEarned] = useState({});
  const [next, setNext] = useState(null);
  const [earnedList, setEarnedList] = useState([]);

  useEffect(() => {
    if (userStats) {
      const earnedAchievements = checkAchievements(userStats);
      setEarned(earnedAchievements);
      setEarnedList(getEarnedAchievements(earnedAchievements));
      // Find next achievement in current onboarding phase
      const currentPhase = ONBOARDING_PHASES.find(p => !earnedAchievements[p.achievement.id]) || ONBOARDING_PHASES[ONBOARDING_PHASES.length-1];
      setNext(getNextAchievementInPhase(currentPhase.id, earnedAchievements));
    }
  }, [userStats]);

  // Add notification effect for new achievements
  useEffect(() => {
    if (userStats && earnedList.length > 0) {
      // Show a notification for the most recently earned achievement
      const last = earnedList[earnedList.length - 1];
      if (last && window?.Notification && Notification.permission === "granted") {
        new Notification("Achievement Unlocked!", {
          body: `${last.name}: ${last.description}`,
          icon: "/badge.png"
        });
      }
    }
  }, [earnedList, userStats]);

  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: 18, marginTop: 8 }}>
      <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Your Progress</div>
      <div style={{ color: COLORS.textDim, fontSize: 13, marginBottom: 10 }}>Achievements & Next Steps</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {earnedList.length === 0 && <span style={{ color: COLORS.textDim }}>No badges yet. Start trading or generate a signal!</span>}
        {earnedList.map(a => (
          <span key={a.id} title={a.description} style={{ fontSize: 22, borderRadius: 8, background: COLORS.badge, color: "#04111F", padding: "4px 10px", fontWeight: 700 }}>{a.icon} {a.name}</span>
        ))}
      </div>
      {userStats?.streakDays ? (
        <div style={{ color: COLORS.streak, fontWeight: 600, fontSize: 14, marginBottom: 8 }}>🔥 {userStats.streakDays} day streak</div>
      ) : null}
      {next ? (
        <div style={{ color: COLORS.text, fontSize: 14, marginTop: 8 }}>
          <strong>Next:</strong> {next.name} <span style={{ color: COLORS.textDim }}>({next.description})</span>
        </div>
      ) : null}
      <div style={{ color: COLORS.textDim, fontSize: 12, marginTop: 10 }}>
        Tips: Complete onboarding, try paper trading, and generate your first AI signal to unlock badges and credits.
      </div>
    </div>
  );
}
