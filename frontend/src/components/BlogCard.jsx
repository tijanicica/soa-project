import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Heart, MessageSquare, Send, Loader2, Edit, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { getCommentsForBlog } from "../services/BlogApi";
import { jwtDecode } from 'jwt-decode';
import { EditBlogDialog } from './EditBlogDialog'; 

// New Carousel imports
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// --- NEW HELPER COMPONENT: Avatar ---
// A simple avatar to show the first letter of the author's name (or just 'U' for 'User').
const Avatar = ({ authorId }) => (
  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
    U
  </div>
);

// --- RESTYLED COMPONENT: Comment ---
const Comment = ({ comment }) => (
  <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
    <Avatar authorId={comment.authorId} />
    <div className="flex-1">
      <div className="flex items-center gap-2 text-sm">
        <p className="font-semibold">User {comment.authorId}</p>
        <p className="text-xs text-muted-foreground">
          • {formatDistanceToNow(new Date(comment.creationTime), { addSuffix: true })}
        </p>
      </div>
      <p className="text-muted-foreground mt-1">{comment.text}</p>
    </div>
  </div>
);

export function BlogCard({ blog, onLikeToggle, onAddComment, onBlogUpdated }) {
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [areCommentsVisible, setAreCommentsVisible] = useState(false);

  // ===== Nova Logika: Provera vlasništva bloga =====
  const token = localStorage.getItem('jwtToken');
  const currentUser = token ? jwtDecode(token) : null;
  const isOwner = currentUser && currentUser.sub == blog.authorId;
   const wasEdited = new Date(blog.lastModifiedDate).getTime() > new Date(blog.creationDate).getTime() + 1000;

  // Funkcije handleCommentSubmit i fetchComments ostaju iste
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      const newComment = await onAddComment(blog.id, commentText);
      if (newComment) {
        setComments(prevComments => [newComment, ...prevComments]);
      }
    } finally {
      setCommentText("");
      setIsCommenting(false);
    }
  };

  const fetchComments = async () => {
    if (comments.length > 0) return;
    setIsLoadingComments(true);
    try {
      const response = await getCommentsForBlog(blog.id);
      setComments(response.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  return (
    <Card className="bg-card overflow-hidden">
      <CardHeader className="pb-4">
        {/* Carousel for images */}
        {blog.imageUrls && blog.imageUrls.length > 0 && (
          <div className="relative mb-4 -mx-6 -mt-6">
            {blog.imageUrls.length > 1 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {blog.imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={url}
                        alt={`${blog.title} - image ${index + 1}`}
                        className="w-full h-64 object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1-2 -translate-y-1/2" />
                <CarouselNext className="absolute right-4 top-1-2 -translate-y-1/2" />
              </Carousel>
            ) : (
              <img
                src={blog.imageUrls[0]}
                alt={blog.title}
                className="w-full h-64 object-cover"
              />
            )}
          </div>
        )}

        {/* ===== Novi Deo: Flex kontejner za naslov i Edit dugme ===== */}
        <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-2xl font-bold">{blog.title}</CardTitle>
            
            {/* "Edit" dugme se prikazuje samo ako je korisnik vlasnik */}
           {isOwner && (
    // ===== POČETAK IZMENE =====
                <div onClick={() => console.log("Opening edit dialog for Post ID:", blog.id)}>
                    <EditBlogDialog 
                    blog={blog} 
                    onBlogUpdated={onBlogUpdated}
                    trigger={
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full flex-shrink-0"
                            // Uklonili smo onClick odavde
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    }
                    />
                </div>
            )}
        </div>
        
       <p className="text-sm text-muted-foreground flex items-center flex-wrap">
          <span>Posted by User {blog.authorId}</span>
          <span className="mx-1.5">•</span>
          <span>{formatDistanceToNow(new Date(blog.creationDate), { addSuffix: true })}</span>
          
          {/* Uslovno prikazujemo "edited" poruku */}
          {wasEdited && (
            <>
              <span className="mx-1.5">•</span>
              <span className="flex items-center text-xs italic opacity-75">
                edited {formatDistanceToNow(new Date(blog.lastModifiedDate), { addSuffix: true })}
                <Clock className="h-3 w-3 ml-1" />
              </span>
            </>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{blog.descriptionMarkdown}</ReactMarkdown>
        </div>
      </CardContent>
      {/* Footer i komentari ostaju isti */}
      <CardFooter className="flex flex-col items-start gap-4">
        <Collapsible onOpenChange={setAreCommentsVisible} className="w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLikeToggle(blog.id)}
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              <span>{blog.stats.likesCount}</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  if (!areCommentsVisible) fetchComments();
                }}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{blog.stats.commentsCount}</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="w-full pt-4">
            <div className="space-y-4 rounded-lg bg-muted p-4">
              <h4 className="font-semibold text-base">Comments</h4>
              <form onSubmit={handleCommentSubmit} className="flex gap-2 w-full">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="resize-none"
                  rows={1}
                />
                <Button type="submit" size="icon" disabled={isCommenting}>
                  {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>

              <div className="space-y-2">
                {isLoadingComments ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <Comment key={comment.id} comment={comment} />
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">Be the first to comment!</p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  );
}