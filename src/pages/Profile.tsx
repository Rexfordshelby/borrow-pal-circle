import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Camera, 
  Edit, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Settings,
  Package,
  Clock
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  location: string;
  phone: string;
  avatar_url: string;
  rating: number;
  total_ratings: number;
}

interface UserItem {
  id: string;
  title: string;
  description: string;
  daily_rate: number;
  image_url: string;
  condition: string;
  is_available: boolean;
  created_at: string;
  categories?: {
    name: string;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    phone: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchUserItems();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          bio: data.bio || '',
          location: data.location || '',
          phone: data.phone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserItems = async () => {
    try {
      // First fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Error fetching user items:', itemsError);
        return;
      }

      // Then fetch categories for each item
      const itemsWithCategories = [];
      for (const item of itemsData || []) {
        let categoryData = null;
        if (item.category_id) {
          const { data: category } = await supabase
            .from('categories')
            .select('name')
            .eq('id', item.category_id)
            .single();
          categoryData = category;
        }
        
        itemsWithCategories.push({
          ...item,
          categories: categoryData
        });
      }

      setUserItems(itemsWithCategories);

    } catch (error) {
      console.error('Error fetching user items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...editForm,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 card-shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="fade-in">
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-2xl">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 w-8 h-8"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold">
                          {profile?.full_name || 'User Profile'}
                        </h1>
                        <p className="text-muted-foreground">{user?.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                      </Button>
                    </div>

                    {profile?.rating && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {profile.rating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({profile.total_ratings || 0} reviews)
                        </span>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {profile?.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{user?.email}</span>
                      </div>
                    </div>

                    {profile?.bio && (
                      <p className="mt-4 text-sm">{profile.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="slide-up">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell others about yourself..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Your city or area"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="hero"
                      onClick={handleUpdateProfile}
                      className="flex-1"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <div className="slide-up">
            <Tabs defaultValue="listings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="listings">My Listings</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="listings" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    My Items ({userItems.length})
                  </h2>
                  <Button
                    variant="hero"
                    onClick={() => navigate('/add-listing')}
                    className="flex items-center space-x-2"
                  >
                    <Package className="w-4 h-4" />
                    <span>Add Item</span>
                  </Button>
                </div>

                {userItems.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No items yet</h3>
                    <p className="text-muted-foreground">
                      Start sharing by adding your first item
                    </p>
                    <Button
                      variant="hero"
                      onClick={() => navigate('/add-listing')}
                    >
                      Add Your First Item
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userItems.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer interactive-hover card-shadow"
                        onClick={() => navigate(`/item/${item.id}`)}
                      >
                        <div className="aspect-video relative overflow-hidden rounded-t-lg">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Camera className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <Badge
                            variant={item.is_available ? "success" : "secondary"}
                            className="absolute top-2 right-2"
                          >
                            {item.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-primary">
                                ${item.daily_rate}/day
                              </span>
                            </div>
                            
                            {item.categories && (
                              <Badge variant="secondary" className="text-xs">
                                {item.categories.name}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-6">
                <Card className="card-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Account Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <h3 className="font-medium">Password</h3>
                        <p className="text-sm text-muted-foreground">••••••••</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Change
                      </Button>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <h3 className="font-medium">Notifications</h3>
                        <p className="text-sm text-muted-foreground">Manage your preferences</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>

                    <div className="pt-4">
                      <Button
                        variant="destructive"
                        onClick={signOut}
                        className="w-full"
                      >
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;