import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Loader2 } from "lucide-react";
import * as blogService from "../services/BlogApi";

export function AddNewBlogDialog({ onBlogCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("descriptionMarkdown", description);
    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
    }

    try {
      await blogService.createBlog(formData);
      onBlogCreated(); // Osveži listu blogova
      setOpen(false); // Zatvori dijalog
      // Resetuj polja
      setTitle("");
      setDescription("");
      setImages(null);
    } catch (err) {
      setError("Failed to create blog. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>Add New Blog</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Blog Post</DialogTitle>
          <DialogDescription>
            Share your travel experiences with the community.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="add-blog-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Write your blog post here. Markdown is supported."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 min-h-[150px]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="images" className="text-right">
                Images
              </Label>
              <Input
                id="images"
                type="file"
                multiple
                onChange={(e) => setImages(e.target.files)}
                className="col-span-3"
              />
            </div>
          </div>
        </form>
        {error && (
          <p className="text-sm text-red-500 text-center mb-4">{error}</p>
        )}
        <DialogFooter>
          <Button type="submit" form="add-blog-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
