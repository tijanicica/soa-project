namespace followers_service.Services;
using followers_service.Models;
using Neo4j.Driver;


public class FollowerService : IFollowerService
{
    private readonly IDriver _driver;

    public FollowerService(IDriver driver)
    {
        _driver = driver;
    }

    public async Task FollowUserAsync(long followerId, long followedId)
    {
        await using var session = _driver.AsyncSession();
        await session.ExecuteWriteAsync(async tx =>
        {
            var query = @"
                MERGE (follower:User {userId: $followerId})
                MERGE (followed:User {userId: $followedId})
                MERGE (follower)-[:FOLLOWS]->(followed)";
            
            await tx.RunAsync(query, new { followerId, followedId });
        });
    }

    public async Task UnfollowUserAsync(long followerId, long followedId)
    {
        await using var session = _driver.AsyncSession();
        await session.ExecuteWriteAsync(async tx =>
        {
            var query = @"
                MATCH (follower:User {userId: $followerId})-[r:FOLLOWS]->(followed:User {userId: $followedId})
                DELETE r";
            
            await tx.RunAsync(query, new { followerId, followedId });
        });
    }

    public async Task<IEnumerable<UserDto>> GetFollowingAsync(long userId)
    {
        await using var session = _driver.AsyncSession();
        return await session.ExecuteReadAsync(async tx =>
        {
            var query = @"
                MATCH (u:User {userId: $userId})-[:FOLLOWS]->(following)
                RETURN following.userId AS UserId";
            
            var result = await tx.RunAsync(query, new { userId });
            return await result.ToListAsync(record => new UserDto { UserId = record["UserId"].As<long>() });
        });
    }

    public async Task<IEnumerable<UserDto>> GetFollowersAsync(long userId)
    {
        await using var session = _driver.AsyncSession();
        return await session.ExecuteReadAsync(async tx =>
        {
            var query = @"
                MATCH (follower)-[:FOLLOWS]->(u:User {userId: $userId})
                RETURN follower.userId AS UserId";
            
            var result = await tx.RunAsync(query, new { userId });
            return await result.ToListAsync(record => new UserDto { UserId = record["UserId"].As<long>() });
        });
    }


    public async Task<IEnumerable<UserDto>> GetFollowRecommendationsAsync(long userId)
    {
        await using var session = _driver.AsyncSession();
        return await session.ExecuteReadAsync(async tx =>
        {
            // ako prati bar jednu osobu pratioci pratioca, ako ne svi useri koji imaju ulogu turiste
            var checkQuery = @"
            RETURN EXISTS( (:User {userId: $userId})-[:FOLLOWS]->() )";
        
            var checkResult = await tx.RunAsync(checkQuery, new { userId });
            var isFollowingAnyone = (await checkResult.SingleAsync())[0].As<bool>();

            string recommendationsQuery;
        
            if (isFollowingAnyone)
            {
                // korisnik prati nekoga
                recommendationsQuery = @"
                MATCH (me:User {userId: $userId})-[:FOLLOWS]->(friend)-[:FOLLOWS]->(recommendation)
                WHERE NOT (me)-[:FOLLOWS]->(recommendation) AND me <> recommendation
                RETURN DISTINCT recommendation.userId AS UserId
                LIMIT 10";
            }
            else
            {
                // korisnik je nov
                recommendationsQuery = @"
                MATCH (tourist:User {role: 'tourist'})
                WHERE tourist.userId <> $userId
                RETURN tourist.userId AS UserId
                LIMIT 20";
            }

            var result = await tx.RunAsync(recommendationsQuery, new { userId });
            return await result.ToListAsync(record => new UserDto { UserId = record["UserId"].As<long>() });
        });
    }

    // da li korisnik prati drugog korisnika
    public async Task<bool> IsFollowingAsync(long followerId, long followedId)
    {
        await using var session = _driver.AsyncSession();
        return await session.ExecuteReadAsync(async tx =>
        {
            var query = @"
                RETURN EXISTS( (:User {userId: $followerId})-[:FOLLOWS]->(:User {userId: $followedId}) )";
            
            var result = await tx.RunAsync(query, new { followerId, followedId });
            var record = await result.SingleAsync();
            return record[0].As<bool>();
        });
    }
}