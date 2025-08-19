import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ParticipantStats from "@/components/participants/participant-stats";
import ParticipantList from "@/components/participants/participant-list";

export default function Participants() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/participant-stats'],
    queryFn: api.getParticipantStats,
  });

  const { data: participants, isLoading: participantsLoading } = useQuery({
    queryKey: ['/api/participants-list'],
    queryFn: api.getParticipantsList,
  });

  return (
    <div className="space-y-6">
      <ParticipantStats stats={stats} isLoading={statsLoading} />
      <ParticipantList 
        participants={participants || []} 
        isLoading={participantsLoading} 
      />
    </div>
  );
}
