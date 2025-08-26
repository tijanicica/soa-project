import { useState, useEffect } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
import { BlogCard } from "../components/BlogCard";
import { AddNewBlogDialog } from "../components/AddNewBlogDialog";
import * as blogService from "../services/BlogApi";
import { Loader2 } from "lucide-react";

export function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);


  

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await blogService.getAllBlogs();
      setBlogs(response.data);
    } catch (err) {
      setError("Failed to fetch blogs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBlogs = () => {
    fetchBlogs(); // ili fetchBlogsAndAuthors
};

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleLikeToggle = async (blogId) => {
    try {
      const response = await blogService.toggleLike(blogId);
      // Ažuriramo stanje samo za blog koji je lajkovan
      setBlogs(
        blogs.map((blog) =>
          blog.id === blogId
            ? {
                ...blog,
                stats: { ...blog.stats, likesCount: response.data.likesCount },
              }
            : blog
        )
      );
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

 const handleAddComment = async (blogId, commentData) => {
    try {
      const response = await blogService.addComment(blogId, commentData);
      
      setBlogs(
        blogs.map((blog) =>
          blog.id === blogId
            ? { ...blog, stats: { ...blog.stats, commentsCount: blog.stats.commentsCount + 1 } }
            : blog
        )
      );
      return response.data; 
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error; 
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar />
      <main className="container mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Community Blogs</h1>
          <AddNewBlogDialog onBlogCreated={fetchBlogs} />
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
          </div>
        )}

        {error && <p className="text-center text-red-500">{error}</p>}

        {!isLoading && !error && (
          <div className="space-y-8">
            {blogs.length > 0 ? (
              blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  onLikeToggle={handleLikeToggle}
                  onAddComment={handleAddComment}
                  onBlogUpdated={refreshBlogs}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground">
                No blogs found. Be the first to create one!
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
