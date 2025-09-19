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

    // Tačka 2.1: Omogućiti korisnicima da zaprate druge korisnike
    public async Task FollowUserAsync(long followerId, long followedId)
    {
        await using var session = _driver.AsyncSession();
        await session.ExecuteWriteAsync(async tx =>
        {
            // MERGE osigurava da se čvorovi i veza kreiraju samo ako ne postoje
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

    // Tačka 2.3: Preporuke za praćenje ("prijatelji prijatelja")
    
    public async Task<IEnumerable<UserDto>> GetFollowRecommendationsAsync(long userId)
    {
        await using var session = _driver.AsyncSession();
        return await session.ExecuteReadAsync(async tx =>
        {
            // Korak 1: Proveravamo da li korisnik prati bar jednu osobu.
            var checkQuery = @"
            RETURN EXISTS( (:User {userId: $userId})-[:FOLLOWS]->() )";
        
            var checkResult = await tx.RunAsync(checkQuery, new { userId });
            var isFollowingAnyone = (await checkResult.SingleAsync())[0].As<bool>();

            string recommendationsQuery;
        
            if (isFollowingAnyone)
            {
                // Korisnik već nekoga prati, koristimo logiku "pratioci pratioca".
                recommendationsQuery = @"
                MATCH (me:User {userId: $userId})-[:FOLLOWS]->(friend)-[:FOLLOWS]->(recommendation)
                WHERE NOT (me)-[:FOLLOWS]->(recommendation) AND me <> recommendation
                RETURN DISTINCT recommendation.userId AS UserId
                LIMIT 10";
            }
            else
            {
                // Korisnik je nov, preporučujemo sve korisnike sa ulogom 'tourist'.
                // OVAJ UPIT SADA RADI ISPRAVNO JER ČVOROVI IMAJU 'role' PROPERTY!
                recommendationsQuery = @"
                MATCH (tourist:User {role: 'tourist'})
                WHERE tourist.userId <> $userId
                RETURN tourist.userId AS UserId
                LIMIT 20";
            }

            // Izvršavamo odabrani upit.
            var result = await tx.RunAsync(recommendationsQuery, new { userId });
            return await result.ToListAsync(record => new UserDto { UserId = record["UserId"].As<long>() });
        });
    }

    // Pomoćna funkcija za Tačku 2.2: Provera da li korisnik prati drugog
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