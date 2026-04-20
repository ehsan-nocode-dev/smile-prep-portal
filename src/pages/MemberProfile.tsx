import { useParams } from "react-router-dom";
import { ProfileView } from "@/components/ProfileView";
import { BadgePortfolio } from "@/components/BadgePortfolio";
import { StatCard } from "@/components/StatCard";
import { useStore } from "@/lib/store";
import { Award, CheckCircle2, Star, Zap } from "lucide-react";
import { getLevelInfo, getUserTotalXp } from "@/lib/levels";

export default function MemberProfile() {
  const { memberId } = useParams<{ memberId: string }>();
  const { members, submissions, tasks } = useStore();
  const member = members.find((m) => m.id === memberId);

  if (!member) {
    return <div className="text-center py-12 text-muted-foreground">Member not found.</div>;
  }

  const mine = submissions.filter((s) => s.submittedById === member.id);
  const approved = mine.filter((s) => s.status === "Approved");
  const totalXp = getUserTotalXp(submissions, member.id);
  const level = getLevelInfo(totalXp).level;
  const badgesEarned = tasks.reduce((sum, t) => {
    const a = approved.filter((s) => s.taskId === t.id).reduce((n, s) => n + s.quantity, 0);
    return sum + t.badges.filter((b) => a >= b.tracks).length;
  }, 0);

  return (
    <ProfileView
      userId={member.id}
      showBack
      extraSection={
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <StatCard label="Approved Submissions" value={approved.length} tint="green" icon={<CheckCircle2 className="h-6 w-6" />} />
            <StatCard label="Total XP" value={totalXp} tint="yellow" valueClassName="text-xp" icon={<Zap className="h-6 w-6" />} />
            <StatCard label="Badges Earned" value={badgesEarned} tint="gray" icon={<Award className="h-6 w-6" />} />
            <StatCard label="Level" value={level} tint="purple" icon={<Star className="h-6 w-6" />} />
          </div>

          <BadgePortfolio tasks={tasks} submissions={submissions} userId={member.id} />
        </>
      }
    />
  );
}
