import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getUserProfile, updateUserProfile } from "../services/StakeholdersApi";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const emptyProfile = {
  firstName: '',
  lastName: '',
  profileImageUrl: '',
  biography: '',
  motto: ''
};

export function ProfilePage() {
  const { auth } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.user?.id) return;
      try {
        const response = await getUserProfile();
        if (response.data) {
          setProfile(response.data);
          setIsNewProfile(false);
        } else {
          setIsNewProfile(true);
        }
      } catch (err) {
        setError("Could not fetch profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [auth.user?.id]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await updateUserProfile(profile);
      setSuccess("Profile saved successfully!");
      setIsNewProfile(false);
    } catch (err) {
      setError("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNewProfile ? "Complete Your Profile" : "Edit Your Profile"}</CardTitle>
        <CardDescription>
          {isNewProfile 
            ? "Welcome! Please fill in your details to get started." 
            : "Update your personal information here."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={profile.firstName || ''} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={profile.lastName || ''} onChange={handleChange} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="biography">Biography</Label>
            <Textarea id="biography" name="biography" value={profile.biography || ''} onChange={handleChange} placeholder="Tell us a little bit about yourself" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="motto">Motto</Label>
            <Input id="motto" name="motto" value={profile.motto || ''} onChange={handleChange} placeholder="Your favorite travel quote" />
          </div>
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}