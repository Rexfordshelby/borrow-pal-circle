import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BadgeItem {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_category: string;
  rarity: string;
  earned_at: string;
}

interface BadgeDisplayProps {
  badges: BadgeItem[];
}

const rarityColors = {
  common: "bg-slate-500",
  uncommon: "bg-green-500",
  rare: "bg-blue-500",
  legendary: "bg-purple-500",
};

export const BadgeDisplay = ({ badges }: BadgeDisplayProps) => {
  const sortedBadges = [...badges].sort((a, b) => {
    const rarityOrder = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
    return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - 
           (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0);
  });

  if (badges.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          No badges earned yet. Start borrowing or lending to unlock achievements!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sortedBadges.map((badge) => (
        <Card
          key={badge.id}
          className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="text-4xl mb-2">{badge.badge_icon}</div>
          <h3 className="font-semibold text-sm mb-1">{badge.badge_name}</h3>
          <p className="text-xs text-muted-foreground mb-2">
            {badge.badge_description}
          </p>
          <Badge 
            variant="secondary" 
            className={`text-xs ${rarityColors[badge.rarity as keyof typeof rarityColors]}`}
          >
            {badge.rarity}
          </Badge>
        </Card>
      ))}
    </div>
  );
};
