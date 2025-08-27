import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Preuzimamo Avatar komponentu koju smo već napravili
const Avatar = ({ author }) => {
  if (!author) return null;
  const initial = author.firstName
    ? author.firstName[0]
    : author.username
    ? author.username[0]
    : "U";

  return (
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0">
      {author.profileImageUrl ? (
        <img
          src={author.profileImageUrl}
          alt={author.username}
          className="h-full w-full object-cover rounded-full"
        />
      ) : (
        <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">
          {initial.toUpperCase()}
        </span>
      )}
    </div>
  );
};

export function UserCard({ user, isFollowing, onFollow, onUnfollow }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    await onFollow(user.id);
    setIsLoading(false);
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    await onUnfollow(user.id);
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar author={user} />
        <div>
          <CardTitle>{user.firstName || user.username}</CardTitle>
          <CardDescription>@{user.username}</CardDescription>
        </div>
      </CardHeader>
      <CardFooter>
        {isFollowing ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleUnfollow}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unfollow
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleFollow}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Follow
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
