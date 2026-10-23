import { useEffect } from "react";
import { useChallenges } from "@/contexts/ChallengesContext";
import { useCelebration } from "@/contexts/CelebrationContext";
import { useStore } from "@/lib/store";

/** Shows the Team Goal celebration to a contributor the next time they're in the staff portal. */
export function ChallengeWinWatcher() {
  const { currentUserId } = useStore();
  const { unseenWins, markWinSeen } = useChallenges();
  const { celebrate } = useCelebration();
  const first = unseenWins(currentUserId)[0];

  useEffect(() => {
    if (!first) return;
    markWinSeen(first.challenge.id, currentUserId);
    celebrate("team_goal_complete", { amount: first.amount, challengeName: first.challenge.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first?.challenge.id, currentUserId]);

  return null;
}
