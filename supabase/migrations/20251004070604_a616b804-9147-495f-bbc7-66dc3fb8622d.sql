-- Add more gamification badges and improve the badge system

-- First, let's add new badge categories to the enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_category') THEN
    CREATE TYPE badge_category AS ENUM ('borrowing', 'lending', 'community', 'referral', 'streak', 'special');
  ELSE
    -- Add new categories if they don't exist
    BEGIN
      ALTER TYPE badge_category ADD VALUE IF NOT EXISTS 'speed';
      ALTER TYPE badge_category ADD VALUE IF NOT EXISTS 'quality';
      ALTER TYPE badge_category ADD VALUE IF NOT EXISTS 'seasonal';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Enhanced badge checking function with more badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_stats RECORD;
  v_total_transactions INTEGER;
BEGIN
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate total transactions
  v_total_transactions := v_stats.total_borrows + v_stats.total_lends;
  
  -- BORROWING BADGES
  IF v_stats.total_borrows >= 1 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Rookie Borrower', 'borrowing', 'Completed your first borrow', '🎯', 'common')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_borrows >= 5 AND v_stats.on_time_payments >= 5 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Reliable Borrower', 'borrowing', '5 on-time payments', '⭐', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_borrows >= 10 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Active Borrower', 'borrowing', '10+ items borrowed', '📦', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_borrows >= 20 AND v_stats.on_time_payments >= 18 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Trusted Borrower', 'borrowing', '20+ borrows with 90% on-time', '💎', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_borrows >= 50 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Master Borrower', 'borrowing', '50+ successful borrows', '👑', 'epic')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- LENDING BADGES
  IF v_stats.total_lends >= 1 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Helpful Lender', 'lending', 'Completed your first lend', '🤝', 'common')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_lends >= 5 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Kind Neighbor', 'lending', 'Helped 5 people', '🏘️', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_lends >= 10 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Community Lender', 'lending', 'Helped 10+ people', '🏆', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_lends >= 25 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Generous Soul', 'lending', '25+ successful lends', '💝', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_lends >= 50 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Legendary Lender', 'lending', 'True community hero - 50+ lends', '👑', 'legendary')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_lends >= 100 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Sharing Champion', 'lending', 'Amazing! 100+ lends', '🌟', 'legendary')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- COMMUNITY BADGES
  IF v_total_transactions >= 10 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Active Member', 'community', '10+ total transactions', '🔥', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_total_transactions >= 50 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Community Pillar', 'community', '50+ total transactions', '⚡', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- REFERRAL BADGES
  IF v_stats.total_referrals >= 1 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Friend Bringer', 'referral', 'Invited your first friend', '👋', 'common')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_referrals >= 3 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Connector', 'referral', 'Invited 3 friends', '🔗', 'common')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_referrals >= 5 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Network Builder', 'referral', 'Invited 5 friends', '🌐', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_referrals >= 10 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Ambassador', 'referral', 'Brought 10+ people to BorrowPal', '🌟', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_referrals >= 25 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Super Ambassador', 'referral', '25+ referrals - incredible!', '💫', 'epic')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- STREAK BADGES
  IF v_stats.streak_days >= 3 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, '3-Day Streak', 'streak', '3 consecutive days', '🔥', 'common')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.streak_days >= 7 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Weekly Streak', 'streak', '7-day activity streak', '🔥', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.streak_days >= 14 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Two Week Warrior', 'streak', '14-day streak', '⚡', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.streak_days >= 30 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Monthly Master', 'streak', '30-day streak - incredible!', '⚡', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.streak_days >= 60 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Commitment King', 'streak', '60-day streak!', '👑', 'epic')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.streak_days >= 100 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Century Streak', 'streak', '100 days! Unstoppable!', '💯', 'legendary')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- LEVEL-BASED BADGES
  IF v_stats.level >= 5 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Getting Started', 'special', 'Reached level 5', '🌱', 'common')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.level >= 10 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Rising Star', 'special', 'Reached level 10', '✨', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.level >= 25 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Elite Member', 'special', 'Reached level 25', '💫', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.level >= 50 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Legend', 'special', 'Level 50 - Ultimate achievement', '🎖️', 'legendary')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.level >= 75 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Master of BorrowPal', 'special', 'Level 75 - Legendary!', '🏅', 'legendary')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.level >= 100 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Century Club', 'special', 'Level 100 - Ultimate Legend!', '🔱', 'legendary')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- TRUST SCORE BADGES
  IF v_stats.trust_score >= 80 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Trustworthy', 'special', 'Trust score above 80', '🛡️', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.trust_score >= 95 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Highly Trusted', 'special', 'Trust score above 95', '💯', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
END;
$function$;