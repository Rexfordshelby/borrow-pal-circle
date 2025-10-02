-- Add gamification enhancements and fix payment flow

-- Create badge types enum
CREATE TYPE public.badge_category AS ENUM ('borrowing', 'lending', 'community', 'streak', 'special', 'referral');

-- Enhance user_badges table
ALTER TABLE public.user_badges DROP COLUMN IF EXISTS badge_type;
ALTER TABLE public.user_badges ADD COLUMN badge_category public.badge_category NOT NULL DEFAULT 'community';
ALTER TABLE public.user_badges ADD COLUMN badge_description text;
ALTER TABLE public.user_badges ADD COLUMN badge_icon text;
ALTER TABLE public.user_badges ADD COLUMN rarity text DEFAULT 'common';

-- Create leaderboard views
CREATE OR REPLACE VIEW public.leaderboard_top_lenders AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  us.level,
  us.xp,
  us.total_lends,
  us.trust_score,
  p.rating,
  ROW_NUMBER() OVER (ORDER BY us.total_lends DESC, us.trust_score DESC) as rank
FROM public.profiles p
JOIN public.user_stats us ON p.user_id = us.user_id
WHERE us.total_lends > 0
ORDER BY us.total_lends DESC, us.trust_score DESC
LIMIT 100;

CREATE OR REPLACE VIEW public.leaderboard_top_borrowers AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  us.level,
  us.xp,
  us.total_borrows,
  us.on_time_payments,
  us.trust_score,
  ROW_NUMBER() OVER (ORDER BY us.on_time_payments DESC, us.trust_score DESC) as rank
FROM public.profiles p
JOIN public.user_stats us ON p.user_id = us.user_id
WHERE us.total_borrows > 0
ORDER BY us.on_time_payments DESC, us.trust_score DESC
LIMIT 100;

CREATE OR REPLACE VIEW public.leaderboard_top_referrers AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  us.level,
  us.xp,
  us.total_referrals,
  ROW_NUMBER() OVER (ORDER BY us.total_referrals DESC) as rank
FROM public.profiles p
JOIN public.user_stats us ON p.user_id = us.user_id
WHERE us.total_referrals > 0
ORDER BY us.total_referrals DESC
LIMIT 100;

-- Function to award badges based on achievements
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats RECORD;
BEGIN
  -- Get user stats
  SELECT * INTO v_stats FROM user_stats WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Borrowing badges
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
  
  IF v_stats.total_borrows >= 20 AND v_stats.on_time_payments >= 18 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Trusted Borrower', 'borrowing', '20+ borrows with 90% on-time', '💎', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- Lending badges
  IF v_stats.total_lends >= 1 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Helpful Lender', 'lending', 'Completed your first lend', '🤝', 'common')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_lends >= 10 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Community Lender', 'lending', 'Helped 10+ people', '🏆', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_lends >= 50 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Legendary Lender', 'lending', 'True community hero - 50+ lends', '👑', 'legendary')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- Referral badges
  IF v_stats.total_referrals >= 3 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Connector', 'referral', 'Invited 3 friends', '🔗', 'common')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.total_referrals >= 10 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Ambassador', 'referral', 'Brought 10+ people to BorrowPal', '🌟', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- Streak badges
  IF v_stats.streak_days >= 7 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Weekly Streak', 'streak', '7-day activity streak', '🔥', 'uncommon')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  IF v_stats.streak_days >= 30 THEN
    INSERT INTO user_badges (user_id, badge_name, badge_category, badge_description, badge_icon, rarity)
    VALUES (p_user_id, 'Monthly Master', 'streak', '30-day streak - incredible!', '⚡', 'rare')
    ON CONFLICT (user_id, badge_name) DO NOTHING;
  END IF;
  
  -- Level-based badges
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
  
END;
$$;

-- Update award_xp function to also check badges
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_xp_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_xp INTEGER;
  v_new_xp INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current stats
  SELECT xp, level INTO v_current_xp, v_current_level
  FROM user_stats
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create stats if they don't exist
    INSERT INTO user_stats (user_id, xp, level)
    VALUES (p_user_id, p_xp_amount, FLOOR(p_xp_amount / 100) + 1);
    PERFORM check_and_award_badges(p_user_id);
    RETURN;
  END IF;
  
  -- Calculate new XP and level
  v_new_xp := v_current_xp + p_xp_amount;
  v_new_level := FLOOR(v_new_xp / 100) + 1;
  
  -- Update stats
  UPDATE user_stats
  SET xp = v_new_xp,
      level = v_new_level,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Check for new badges
  PERFORM check_and_award_badges(p_user_id);
END;
$$;

-- Update order completion triggers to award more specific XP
CREATE OR REPLACE FUNCTION public.award_order_completion_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF TG_TABLE_NAME = 'lending_transactions' THEN
      -- Award XP and update stats
      PERFORM award_xp(NEW.lender_id, 50);
      PERFORM award_xp(NEW.borrower_id, 50);
      
      -- Update transaction counts
      UPDATE user_stats 
      SET total_lends = total_lends + 1,
          last_activity_date = CURRENT_DATE,
          updated_at = now()
      WHERE user_id = NEW.lender_id;
      
      UPDATE user_stats 
      SET total_borrows = total_borrows + 1,
          on_time_payments = on_time_payments + CASE 
            WHEN NEW.actual_return_date <= NEW.due_date THEN 1 
            ELSE 0 
          END,
          last_activity_date = CURRENT_DATE,
          updated_at = now()
      WHERE user_id = NEW.borrower_id;
      
    ELSIF TG_TABLE_NAME = 'service_bookings' THEN
      PERFORM award_xp(NEW.provider_id, 50);
      PERFORM award_xp(NEW.customer_id, 50);
      
      UPDATE user_stats 
      SET total_lends = total_lends + 1,
          last_activity_date = CURRENT_DATE,
          updated_at = now()
      WHERE user_id = NEW.provider_id;
      
      UPDATE user_stats 
      SET total_borrows = total_borrows + 1,
          last_activity_date = CURRENT_DATE,
          updated_at = now()
      WHERE user_id = NEW.customer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant access to leaderboard views
GRANT SELECT ON public.leaderboard_top_lenders TO authenticated;
GRANT SELECT ON public.leaderboard_top_borrowers TO authenticated;
GRANT SELECT ON public.leaderboard_top_referrers TO authenticated;

-- Enable RLS on leaderboard views (they're views so they inherit from base tables)

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_stats_leaderboard ON public.user_stats(total_lends DESC, total_borrows DESC, total_referrals DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_category ON public.user_badges(badge_category, user_id);