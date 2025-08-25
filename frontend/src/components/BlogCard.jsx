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
import { Heart, MessageSquare, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";

export function BlogCard({ blog, onLikeToggle, onAddComment }) {
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsCommenting(true);
    onAddComment(blog.id, commentText).finally(() => {
      setCommentText("");
      setIsCommenting(false);
    });
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
        <p className="text-sm text-muted-foreground">
          Posted by User {blog.authorId} •{" "}
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
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{blog.stats.commentsCount}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 -ml-20">
              {/* Note: This part is simplified. A real app would fetch and display comments. */}
              <form
                onSubmit={handleCommentSubmit}
                className="flex gap-2 w-full max-w-md p-4 bg-muted rounded-lg"
              >
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="resize-none"
                />
                <Button type="submit" size="icon" disabled={isCommenting}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardFooter>
    </Card>
  );
}
