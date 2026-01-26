import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Plus, Edit, Eye, Trash2, Upload } from "lucide-react";
import Loading from "@/components/Loading";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  category: string;
  thumbnail?: string;
  created_at: string;
  created_by?: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function BlogManager() {
  const { tokens, isLoggedIn } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    author: "Admin",
  });

  // Function to upload image to Cloudinary
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image_file", file);

    const res = await fetch(`${API_URL}/blogs/uploadimage`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Image upload failed");
    }

    const data = await res.json();
    return data.url;
  };

  // Handle thumbnail selection and upload
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnail(file);
    setUploadingThumbnail(true);

    try {
      const url = await uploadImageToCloudinary(file);
      setThumbnailUrl(url);
      toast.success("Thumbnail uploaded successfully");
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      toast.error("Failed to upload thumbnail");
      setThumbnail(null);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      const headers: Record<string, string> = {};

      if (tokens?.access) {
        headers.Authorization = `Bearer ${tokens.access}`;
      }

      const res = await fetch(`${API_URL}/blogs/`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Fetched blogs:", data);

      if (Array.isArray(data)) {
        setBlogs(data);
      } else if (data.blogs && Array.isArray(data.blogs)) {
        setBlogs(data.blogs);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to load blogs");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const saveBlog = async () => {
    if (!tokens?.access) {
      toast.error("Please login to continue");
      return;
    }

    if (!formData.title || !formData.content) {
      toast.error("Title and Content are required");
      return;
    }

    setSaving(true);

    try {
      if (currentBlog) {
        /* ---------- UPDATE (Expects JSON) ---------- */
        const payload = {
          title: formData.title,
          content: formData.content,
          image_url: thumbnailUrl || currentBlog.thumbnail || "",
          internal_urls: [],
          author: formData.author,
          tags_list: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          category: formData.category || "General",
        };

        const res = await fetch(`${API_URL}/blogs/${currentBlog.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Update failed");
        }

        toast.success("Blog updated successfully");
      } else {
        /* ---------- CREATE (Expects FormData) ---------- */
        const data = new FormData();
        data.append("title", formData.title);
        data.append("content", formData.content);
        data.append("author", formData.author);
        data.append("tags", formData.tags);
        data.append("category", formData.category || "General");

        // Add thumbnail if uploaded
        if (thumbnail) {
          data.append("image", thumbnail);
        }

        console.log("Creating blog with data:", {
          title: formData.title,
          author: formData.author,
          category: formData.category,
          tags: formData.tags,
          hasThumbnail: !!thumbnail,
          thumbnailUrl: thumbnailUrl,
        });

        const res = await fetch(`${API_URL}/blogs/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
          body: data,
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          let errorMessage = "Failed to create blog";

          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const result = await res.json();
        console.log("Blog created:", result);
        toast.success("Blog created successfully");
      }

      resetForm();
      setIsEditorOpen(false);
      fetchBlogs();
    } catch (error) {
      console.error("Save blog error:", error);
      toast.error(error instanceof Error ? error.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!tokens?.access) {
      toast.error("Please login to continue");
      return;
    }

    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      const res = await fetch(`${API_URL}/blogs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens.access}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Delete failed");
      }

      toast.success("Blog deleted successfully");
      fetchBlogs();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "",
      tags: "",
      author: "Admin",
    });
    setThumbnail(null);
    setThumbnailUrl("");
    setCurrentBlog(null);
  };

  const handleEdit = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      category: blog.category,
      tags: blog.tags ? blog.tags.join(", ") : "",
      author: blog.author || "Admin",
    });
    setThumbnail(null);
    setThumbnailUrl(blog.thumbnail || "");
    setIsEditorOpen(true);
  };

  const handleNewBlog = () => {
    resetForm();
    setIsEditorOpen(true);
  };

  const columns: Column<BlogPost>[] = [
    { key: "title", label: "Title" },
    { key: "author", label: "Author" },
    { key: "category", label: "Category" },
    {
      key: "tags",
      label: "Tags",
      render: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {row.tags?.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {tag}
            </span>
          ))}
          {row.tags?.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{row.tags.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setPreviewContent(row.content);
              setIsPreviewOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteBlog(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading message="Loading blogs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blog Manager</h1>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewBlog}>
              <Plus className="mr-2 h-4 w-4" /> New Blog
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentBlog ? "Edit Blog" : "Create Blog"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter blog title"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">
                    Author <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    placeholder="Enter author name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., Technology, Lifestyle"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Tags (comma separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="e.g., react, javascript, tutorial"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Thumbnail</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={uploadingThumbnail}
                />
                {uploadingThumbnail && (
                  <p className="text-sm text-blue-600 flex items-center gap-2">
                    <Upload className="h-4 w-4 animate-pulse" />
                    Uploading thumbnail...
                  </p>
                )}
                {thumbnailUrl && (
                  <div className="mt-2">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      className="max-w-xs rounded-md border"
                    />
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Thumbnail uploaded
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-bold">
                  Content <span className="text-red-500">*</span>
                </Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Click the image icon in the toolbar to upload and insert images directly into your content
                </p>
              </div>
              <Button onClick={saveBlog} disabled={saving || uploadingThumbnail} className="w-full">
                {saving
                  ? currentBlog
                    ? "Updating..."
                    : "Creating..."
                  : currentBlog
                    ? "Update Blog"
                    : "Create Blog"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No blogs found. Create your first blog!
        </div>
      ) : (
        <DataTable data={blogs} columns={columns} />
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Blog Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] p-4">
            <div
              className="prose prose-slate max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}