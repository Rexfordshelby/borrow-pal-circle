import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XPProgress } from "@/components/gamification/XPProgress";
import { BadgeDisplay } from "@/components/gamification/BadgeDisplay";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { Loader2 } from "lucide-react";

export default function Gamification() {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      
      setUser(currentUser);

      // Fetch user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (stats) {
        setUserStats(stats);
      } else {
        // Create initial stats if they don't exist
        const { data: newStats } = await supabase
          .from('user_stats')
          .insert({ user_id: currentUser.id, xp: 0, level: 1 })
          .select()
          .single();
        setUserStats(newStats);
      }

      // Fetch badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('earned_at', { ascending: false });

      setBadges(userBadges || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Gamification</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Track your achievements and level up!</CardDescription>
        </CardHeader>
        <CardContent>
          {userStats && (
            <XPProgress currentXP={userStats.xp} level={userStats.level} />
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{userStats?.total_lends || 0}</p>
              <p className="text-sm text-muted-foreground">Total Lends</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{userStats?.total_borrows || 0}</p>
              <p className="text-sm text-muted-foreground">Total Borrows</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{userStats?.streak_days || 0}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{badges.length}</p>
              <p className="text-sm text-muted-foreground">Badges Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="badges">My Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Badges</CardTitle>
              <CardDescription>
                Unlock badges by completing activities and reaching milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BadgeDisplay badges={badges} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Leaderboards</CardTitle>
              <CardDescription>
                See how you rank against other BorrowPal users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Leaderboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
