using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration; // <-- Dodao sam ovaj using, za svaki slučaj

namespace tour_service.Controllers
{

    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = "guide")]
    public class FilesController : ControllerBase
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _minioPublicEndpoint;

        public FilesController(IAmazonS3 s3Client, IConfiguration configuration)
        {
            _s3Client = s3Client;
            _bucketName = configuration["Minio:BucketName"];
            _minioPublicEndpoint = "http://localhost:9000";
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("File not selected.");

            var key = $"{Guid.NewGuid()}-{file.FileName}";
            var putRequest = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                InputStream = file.OpenReadStream(),
                ContentType = file.ContentType,
                CannedACL = S3CannedACL.PublicRead
            };

            await _s3Client.PutObjectAsync(putRequest);
            var imageUrl = $"{_minioPublicEndpoint}/{_bucketName}/{key}";
            return Ok(new { imageUrl });
        }
    }
}