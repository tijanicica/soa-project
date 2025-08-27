import { useState, useEffect, useCallback } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
import { UserCard } from "../components/UserCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as followerService from "../services/FollowersApi";
import * as stakeholderService from "../services/StakeholdersApi";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

function UserList({ fetchUsers, onAction }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const userDtos = await fetchUsers();
        const userIds = userDtos.data.map((u) => u.userId);
        if (userIds.length > 0) {
          const profilesResponse = await stakeholderService.getUsersByIds(
            userIds
          );
          const usersMap = profilesResponse.data;
          const enrichedUsers = userIds.map((id) => ({
            id: usersMap[id]?.id,
            username: usersMap[id]?.username,
            // Ovde "izvlačimo" vrednost iz objekta
            firstName: usersMap[id]?.firstName?.String,
            profileImageUrl: usersMap[id]?.profileImageUrl?.String,
          }));
          setUsers(enrichedUsers);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, [fetchUsers]);

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
      </div>
    );

  if (users.length === 0)
    return (
      <p className="text-center text-muted-foreground p-8">No users found.</p>
    );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          isFollowing={onAction.followingIds.has(user.id)}
          onFollow={onAction.handleFollow}
          onUnfollow={onAction.handleUnfollow}
        />
      ))}
    </div>
  );
}

export function FollowingPage() {
  const [followingIds, setFollowingIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialFollowing = async () => {
      try {
        const response = await followerService.getMyFollowing();
        setFollowingIds(new Set(response.data.map((u) => u.userId)));
      } catch (error) {
        console.error("Failed to fetch initial following list:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialFollowing();
  }, []);

  const handleFollow = async (userId) => {
    await followerService.followUser(userId);
    setFollowingIds((prev) => new Set(prev).add(userId));
  };

  const handleUnfollow = async (userId) => {
    await followerService.unfollowUser(userId);
    setFollowingIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  // useCallback se koristi da se izbegne ponovno kreiranje funkcija pri svakom renderu
  const fetchFollowing = useCallback(
    () => followerService.getMyFollowing(),
    []
  );
  const fetchFollowers = useCallback(
    () => followerService.getMyFollowers(),
    []
  );

  const actions = { followingIds, handleFollow, handleUnfollow };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar />
      <main className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">My Network</h1>

        <Tabs defaultValue="following" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
          </TabsList>
          <TabsContent value="following" className="mt-6">
            <UserList fetchUsers={fetchFollowing} onAction={actions} />
          </TabsContent>
          <TabsContent value="followers" className="mt-6">
            <UserList fetchUsers={fetchFollowers} onAction={actions} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
