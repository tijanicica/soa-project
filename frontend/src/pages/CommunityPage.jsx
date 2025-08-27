import { useState, useEffect } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
import { UserCard } from "../components/UserCard";
import * as followerService from "../services/FollowersApi";
import * as stakeholderService from "../services/StakeholdersApi";
import { Loader2 } from "lucide-react";

export function CommunityPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Dobavi koga trenutno pratim
        const followingResponse = await followerService.getMyFollowing();
        const initialFollowingIds = new Set(
          followingResponse.data.map((u) => u.userId)
        );
        setFollowingIds(initialFollowingIds);

        // 2. Dobavi preporuke (samo ID-jevi)
        const recommendationsResponse =
          await followerService.getRecommendations();
        const recommendationIds = recommendationsResponse.data.map(
          (u) => u.userId
        );

        if (recommendationIds.length > 0) {
          // 3. Dobavi pune profile za preporučene korisnike
          const usersResponse = await stakeholderService.getUsersByIds(
            recommendationIds
          );
          const usersMap = usersResponse.data;

          const enrichedRecommendations = recommendationIds.map((id) => ({
            id: usersMap[id]?.id,
            username: usersMap[id]?.username,
            firstName: usersMap[id]?.firstName?.String, // Go šalje NullString
            profileImageUrl: usersMap[id]?.profileImageUrl?.String,
          }));
          setRecommendations(enrichedRecommendations);
        }
      } catch (error) {
        console.error("Failed to fetch community data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar />
      <main className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Community Hub
        </h1>
        <p className="text-muted-foreground mb-8">
          Discover and connect with other travelers.
        </p>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            People you might know
          </h2>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFollowing={followingIds.has(user.id)}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground p-8">
              No recommendations for you at the moment. Start following people
              to get suggestions!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
