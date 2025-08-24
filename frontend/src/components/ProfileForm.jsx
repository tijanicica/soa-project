import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { getUserProfile, updateUserProfile, uploadProfileImage } from "../services/StakeholdersApi";
import { Loader2, Camera, CheckCircle, AlertCircle } from "lucide-react";

// Definišemo prazno stanje za našu formu na frontendu.
const emptyProfileState = {
  firstName: '',
  lastName: '',
  profileImageUrl: '',
  biography: '',
  motto: ''
};

export function ProfileForm() {
  const [profile, setProfile] = useState(emptyProfileState);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getUserProfile();
        if (response.data) {
          const backendProfile = response.data;
          const frontendProfile = {
            firstName: backendProfile.firstName.Valid ? backendProfile.firstName.String : '',
            lastName: backendProfile.lastName.Valid ? backendProfile.lastName.String : '',
            profileImageUrl: backendProfile.profileImageUrl.Valid ? backendProfile.profileImageUrl.String : '',
            biography: backendProfile.biography.Valid ? backendProfile.biography.String : '',
            motto: backendProfile.motto.Valid ? backendProfile.motto.String : ''
          };
          setProfile(frontendProfile);
          if (frontendProfile.profileImageUrl) {
            setPreview(frontendProfile.profileImageUrl);
          }
          setIsNewProfile(false);
        } else {
          setIsNewProfile(true);
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError("Could not fetch profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let finalImageUrl = profile.profileImageUrl;

      if (selectedFile) {
        const uploadResponse = await uploadProfileImage(selectedFile);
        finalImageUrl = uploadResponse.data.imageUrl;
      }
      
      const profileToSave = { ...profile, profileImageUrl: finalImageUrl };
      
      const payload = {
        FirstName: { String: profileToSave.firstName, Valid: profileToSave.firstName !== '' },
        LastName: { String: profileToSave.lastName, Valid: profileToSave.lastName !== '' },
        ProfileImageURL: { String: finalImageUrl, Valid: finalImageUrl !== '' },
        Biography: { String: profileToSave.biography, Valid: profileToSave.biography !== '' },
        Motto: { String: profileToSave.motto, Valid: profileToSave.motto !== '' },
      };
      
      await updateUserProfile(payload);
      
      setSuccess("Profile saved successfully!");
      setProfile(profileToSave);
      setPreview(finalImageUrl);
      setSelectedFile(null);
      setIsNewProfile(false);

      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      console.error("Saving profile error:", err);
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error && isNewProfile) return <p className="text-red-500">{error}</p>;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>
            This is how others will see you on the site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* --- SEKCIJA ZA SLIKU I IME --- */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              
              <Dialog>
                <DialogTrigger asChild disabled={!preview}>
                  <img 
                    src={preview || `https://ui-avatars.com/api/?name=${profile.firstName || '?'}+${profile.lastName || '?'}&background=cbf0f8&color=0891b2&size=128`} 
                    alt="Profile Preview" 
                    className={`h-32 w-32 rounded-full object-cover border-4 border-white shadow-md ${preview ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                  />
                </DialogTrigger>
                <DialogContent className="p-0 border-0 max-w-lg bg-transparent">
                   <img 
                    src={preview} 
                    alt="Profile Full" 
                    className="w-full h-auto rounded-lg shadow-2xl"
                  />
                </DialogContent>
              </Dialog>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp"
              />
              <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                className="absolute bottom-0 right-0 rounded-full h-9 w-9 bg-white hover:bg-slate-100 shadow"
                onClick={() => fileInputRef.current.click()}
              >
                <Camera className="h-5 w-5 text-slate-600" />
                <span className="sr-only">Change photo</span>
              </Button>
            </div>
            <div className="grid gap-2 flex-1 w-full">
              <Label htmlFor="firstName">Full Name</Label>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input id="firstName" name="firstName" placeholder="First Name" value={profile.firstName || ''} onChange={handleChange} />
                <Input id="lastName" name="lastName" placeholder="Last Name" value={profile.lastName || ''} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* --- SEKCIJA ZA BIOGRAFIJU I MOTO --- */}
          <div className="grid gap-2">
            <Label htmlFor="biography">Biography</Label>
            <Textarea id="biography" name="biography" value={profile.biography || ''} onChange={handleChange} placeholder="Tell us a little bit about yourself..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="motto">Motto</Label>
            <Input id="motto" name="motto" value={profile.motto || ''} onChange={handleChange} placeholder="Your favorite travel quote..." />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between items-center">
          <div className="text-sm h-5">
            {success && (
              <span className="text-green-600 flex items-center gap-2 animate-pulse">
                <CheckCircle className="h-4 w-4" /> {success}
              </span>
            )}
            {error && (
               <span className="text-red-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </span>
            )}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}