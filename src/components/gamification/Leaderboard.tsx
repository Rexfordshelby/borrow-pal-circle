import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  rank: number;
  total_lends?: number;
  total_borrows?: number;
  total_referrals?: number;
  on_time_payments?: number;
  trust_score?: number;
}

export const Leaderboard = () => {
  const [lenders, setLenders] = useState<LeaderboardEntry[]>([]);
  const [borrowers, setBorrowers] = useState<LeaderboardEntry[]>([]);
  const [referrers, setReferrers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const [lendersRes, borrowersRes, referrersRes] = await Promise.all([
        supabase.from('leaderboard_top_lenders').select('*').limit(10),
        supabase.from('leaderboard_top_borrowers').select('*').limit(10),
        supabase.from('leaderboard_top_referrers').select('*').limit(10),
      ]);

      if (lendersRes.data) setLenders(lendersRes.data);
      if (borrowersRes.data) setBorrowers(borrowersRes.data);
      if (referrersRes.data) setReferrers(referrersRes.data);
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold">{rank}</span>;
    }
  };

  const renderLeaderboard = (entries: LeaderboardEntry[], statLabel: string) => (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.user_id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="flex-shrink-0">
            {getRankIcon(entry.rank)}
          </div>
          <Avatar className="w-10 h-10">
            <AvatarImage src={entry.avatar_url || undefined} />
            <AvatarFallback>{entry.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{entry.full_name || 'Anonymous'}</h4>
            <p className="text-sm text-muted-foreground">Level {entry.level}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-primary">
              {entry.total_lends || entry.total_borrows || entry.total_referrals || 0}
            </p>
            <p className="text-xs text-muted-foreground">{statLabel}</p>
          </div>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return <div className="text-center p-8">Loading leaderboards...</div>;
  }

  return (
    <Tabs defaultValue="lenders" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="lenders">Top Lenders</TabsTrigger>
        <TabsTrigger value="borrowers">Top Borrowers</TabsTrigger>
        <TabsTrigger value="referrers">Top Referrers</TabsTrigger>
      </TabsList>
      
      <TabsContent value="lenders" className="mt-4">
        {renderLeaderboard(lenders, "lends")}
      </TabsContent>
      
      <TabsContent value="borrowers" className="mt-4">
        {renderLeaderboard(borrowers, "borrows")}
      </TabsContent>
      
      <TabsContent value="referrers" className="mt-4">
        {renderLeaderboard(referrers, "referrals")}
      </TabsContent>
    </Tabs>
  );
};
