import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  MessageCircle, 
  ShoppingBag, 
  User,
  Wrench,
  Bell
} from 'lucide-react';

interface NavigationBarProps {
  unreadCount?: number;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ unreadCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-card border-t sticky bottom-0 z-50 card-shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          <Button
            variant={isActive('/home') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/home')}
            className="flex flex-col items-center space-y-1 px-3 py-2 h-auto"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Items</span>
          </Button>

          <Button
            variant={isActive('/services') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/services')}
            className="flex flex-col items-center space-y-1 px-3 py-2 h-auto"
          >
            <Wrench className="w-5 h-5" />
            <span className="text-xs">Services</span>
          </Button>

          <Button
            variant={isActive('/chat') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/chat')}
            className="flex flex-col items-center space-y-1 px-3 py-2 h-auto relative"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Chat</span>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>

          <Button
            variant={isActive('/orders') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/orders')}
            className="flex flex-col items-center space-y-1 px-3 py-2 h-auto"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs">Orders</span>
          </Button>

          <Button
            variant={isActive('/notifications') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/notifications')}
            className="flex flex-col items-center space-y-1 px-3 py-2 h-auto"
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Alerts</span>
          </Button>

          <Button
            variant={isActive('/profile') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center space-y-1 px-3 py-2 h-auto"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;