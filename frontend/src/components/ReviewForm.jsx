// Novi fajl: frontend/src/components/ReviewForm.jsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Star, ImagePlus } from 'lucide-react';
import { addReview, uploadTourImage } from '../services/TourApi.js';

// Komponenta za prikaz zvezdica
function StarRating({ rating, setRating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-8 w-8 cursor-pointer transition-colors ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
}

export function ReviewForm({ open, onOpenChange, tour, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]); // današnji datum kao podrazumevani
  const [images, setImages] = useState([]); // Niz fajlova
  const [imagePreviews, setImagePreviews] = useState([]); // Niz URL-ova za prikaz
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
      
      const previewsArray = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...previewsArray]);
    }
  };

  const handleSubmit = async () => {
    if (!comment) {
      setError('Please leave a comment.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Prvo uploaduj sve slike
      const imageUrls = [];
      for (const imageFile of images) {
        const response = await uploadTourImage(imageFile);
        imageUrls.push(response.imageUrl);
      }

      // 2. Pripremi podatke za recenziju
      const reviewData = {
        rating: rating,
        comment: comment,
        visitDate: visitDate,
        imageUrls: imageUrls
      };

      // 3. Pošalji recenziju
      await addReview(tour.id, reviewData);
      
      // Resetuj formu i zatvori dijalog
      onOpenChange(false);
      onReviewSubmitted(); // Obavesti roditelja da je recenzija dodata

    } catch (err) {
      setError(err.response?.data || "Failed to submit review. You may have already reviewed this tour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Review for "{tour.name}"</DialogTitle>
          <DialogDescription>
            Share your experience to help other tourists.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className='space-y-1'>
            <Label>Your Rating</Label>
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="comment">Your Comment</Label>
            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?" />
          </div>
           <div className="space-y-1">
            <Label htmlFor="visitDate">Date of Visit</Label>
            <Input id="visitDate" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Add Photos</Label>
            <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                    <img key={index} src={preview} className="h-24 w-full object-cover rounded-md" alt="Review preview"/>
                ))}
                <label className="flex flex-col items-center justify-center h-24 w-full border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50">
                    <ImagePlus className="h-8 w-8 text-slate-400"/>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange}/>
                </label>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}