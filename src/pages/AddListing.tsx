import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  MapPin, 
  DollarSign,
  Package,
  CheckCircle
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const listingType = searchParams.get('type') || 'item'; // 'item' or 'service'
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    daily_rate: '',
    deposit_amount: '',
    condition: 'good',
    location: '',
    hourly_rate: '',
    duration_hours: '1',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const bucketName = listingType === 'service' ? 'service-photos' : 'item-photos';
      const filePath = `${bucketName}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);

    try {
      let imageUrl = '';
      
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      if (listingType === 'service') {
        const { error } = await supabase
          .from('services')
          .insert({
            title: formData.title,
            description: formData.description,
            category_id: formData.category_id || null,
            hourly_rate: parseFloat(formData.hourly_rate),
            duration_hours: parseInt(formData.duration_hours),
            location: formData.location,
            image_url: imageUrl || null,
            provider_id: user.id,
            is_available: true
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('items')
          .insert({
            title: formData.title,
            description: formData.description,
            category_id: formData.category_id || null,
            daily_rate: parseFloat(formData.daily_rate),
            deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
            condition: formData.condition,
            location: formData.location,
            image_url: imageUrl || null,
            owner_id: user.id,
            is_available: true
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Your ${listingType} has been listed successfully!`,
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 card-shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-xl font-semibold">
            Add New {listingType === 'service' ? 'Service' : 'Item'}
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="fade-in">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Item Details</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 slide-up">
            {/* Image Upload */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Photos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full h-48 object-cover rounded-lg mx-auto"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview('');
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            Upload {listingType} photos
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Add photos to help others see your {listingType}
                          </p>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="max-w-xs mx-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    {listingType === 'service' ? 'Service' : 'Item'} Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={listingType === 'service' 
                      ? "e.g., Professional Photography" 
                      : "e.g., Professional Camera"
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={listingType === 'service' 
                      ? "Describe your service, what's included, and your experience..."
                      : "Describe your item, its features, and any special instructions..."
                    }
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {listingType === 'item' && (
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Like New</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing & Location */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Pricing & Location</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {listingType === 'service' ? (
                  <>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate (USD) *</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        How much do you want to charge per hour?
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="duration_hours">Minimum Duration (Hours)</Label>
                      <Input
                        id="duration_hours"
                        type="number"
                        min="1"
                        value={formData.duration_hours}
                        onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                        placeholder="1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum hours required for booking
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="daily_rate">Daily Rate (USD) *</Label>
                      <Input
                        id="daily_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.daily_rate}
                        onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        How much do you want to charge per day?
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="deposit_amount">Security Deposit (Optional)</Label>
                      <Input
                        id="deposit_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                        placeholder="0.00"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Optional security deposit to protect your item
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Downtown San Francisco"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    General area where the item can be picked up
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="hero"
                disabled={loading || !formData.title || 
                  (!formData.daily_rate && !formData.hourly_rate) || !formData.location}
                className="flex-1"
              >
                {loading ? "Creating..." : 
                  `List ${listingType === 'service' ? 'Service' : 'Item'}`}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddListing;