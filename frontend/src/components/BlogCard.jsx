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
import { Heart, MessageSquare, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
// Putanja je ispravljena na osnovu prethodne greške
import { getCommentsForBlog } from "../services/BlogApi"; 

// Mala pomoćna komponenta za prikazivanje pojedinačnog komentara
const Comment = ({ comment }) => (
  <div className="text-sm p-2 bg-background rounded-lg mb-2">
    {/* ===== IZMENA #1: Prikazujemo ID autora komentara ===== */}
    <p className="font-semibold">Korisnik {comment.authorId}</p>
    <p>{comment.text}</p>
    
    {/* ===== IZMENA #2: Koristimo `creationTime` za datum komentara ===== */}
    <p className="text-xs text-muted-foreground mt-1">
      {formatDistanceToNow(new Date(comment.creationTime), { addSuffix: true })}
    </p>
  </div>
);


export function BlogCard({ blog, onLikeToggle, onAddComment }) {
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [areCommentsVisible, setAreCommentsVisible] = useState(false);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
        const newComment = await onAddComment(blog.id, commentText);
        if (newComment) {
            // Kada backend ne vraća username, moramo ručno da dodamo authorId
            // na osnovu onoga ko je ulogovan, ali za sada ovo radi.
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
      console.error("Greška pri preuzimanju komentara:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };


  return (
    <Card className="bg-card">
      <CardHeader>
        {blog.imageUrls && blog.imageUrls.length > 0 && (
          <img
            src={blog.imageUrls[0]}
            alt={blog.title}
            className="w-full h-64 object-cover rounded-t-lg mb-4"
          />
        )}
        <CardTitle className="text-2xl font-bold">{blog.title}</CardTitle>

        {/* ===== IZMENA #3: Prikazujemo ID autora bloga ===== */}
        <p className="text-sm text-muted-foreground">
          Postavio Korisnik {blog.authorId} •{" "}
          {formatDistanceToNow(new Date(blog.creationDate), {
            addSuffix: true,
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{blog.descriptionMarkdown}</ReactMarkdown>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLikeToggle(blog.id)}
            className="flex items-center gap-2"
          >
            <Heart className="h-4 w-4" />
            <span>{blog.stats.likesCount}</span>
          </Button>
          <Collapsible onOpenChange={setAreCommentsVisible}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  if (!areCommentsVisible) {
                    fetchComments();
                  }
                }}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{blog.stats.commentsCount}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 -ml-20 w-full max-w-md">
              <div className="p-4 bg-muted rounded-lg">
                <form
                  onSubmit={handleCommentSubmit}
                  className="flex gap-2 w-full mb-4"
                >
                  <Textarea
                    placeholder="Napišite komentar..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="resize-none"
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
                        <p className="text-sm text-center text-muted-foreground">Nema komentara.</p>
                    )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardFooter>
    </Card>
  );
}