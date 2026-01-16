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
import { Plus, Edit, Eye, Trash2 } from "lucide-react";
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

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    author: "Admin", // Matches backend 'author' requirement
  });

  const fetchBlogs = async () => {
    if (!tokens?.access) return;
    try {
      const res = await fetch(`${API_URL}/blogs/`, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBlogs(Array.isArray(data) ? data : data.blogs ?? []);
    } catch {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchBlogs();
  }, [isLoggedIn]);

  const saveBlog = async () => {
    if (!tokens?.access) return;

    // Validation
    if (!formData.title || !formData.content || !formData.category) {
      toast.error("Title, Content, and Category are required");
      return;
    }

    setSaving(true);

    try {
      if (currentBlog) {
        /* ---------- UPDATE (PUT - Expects JSON) ---------- */
        const payload = {
          title: formData.title,
          content: formData.content,
          image_url: currentBlog.thumbnail || null,
          internal_urls: [],
          "user.user.id": currentBlog.id,
          author: formData.author,
          tags_list: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          category: formData.category,
        };

        const res = await fetch(`${API_URL}/blogs/${currentBlog.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Update failed");
        toast.success("Blog updated");
      } else {
        /* ---------- CREATE (POST - Expects FormData) ---------- */
        const data = new FormData();

        // These MUST match the backend function parameters exactly
        data.append("title", formData.title);
        data.append("content", formData.content);
        data.append("author", formData.author);
        data.append("tags", formData.tags || ""); // Send as raw string for backend .split(",")
        data.append("category", formData.category);

        // Optional image field
        if (thumbnail) {
          data.append("image", thumbnail);
        }

        const res = await fetch(`${API_URL}/blogs/`, {
          method: "POST",
          headers: {
            // IMPORTANT: Do NOT set Content-Type here.
            // The browser will automatically set it to multipart/form-data with a boundary.
            Authorization: `Bearer ${tokens.access}`,
          },
          body: data,
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("Backend Error:", errorData);
          throw new Error("Creation failed");
        }
        toast.success("Blog created successfully");
      }

      resetForm();
      setIsEditorOpen(false);
      fetchBlogs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`${API_URL}/blogs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens?.access}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Blog deleted");
      fetchBlogs();
    } catch {
      toast.error("Delete failed");
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
    setCurrentBlog(null);
  };

  const handleEdit = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      category: blog.category,
      tags: Array.isArray(blog.tags) ? blog.tags.join(",") : "",
      author: blog.author || "Admin",
    });
    setIsEditorOpen(true);
  };

  const columns: Column<BlogPost>[] = [
    { key: "title", label: "Title" },
    { key: "author", label: "Author" },
    { key: "category", label: "Category" },
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
            className="text-destructive"
            onClick={() => deleteBlog(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blog Manager</h1>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> New Blog
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {currentBlog ? "Edit Blog" : "Create Blog"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={formData.tags}
                    placeholder="tech, news, update"
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Thumbnail (Optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>
              <Button onClick={saveBlog} disabled={saving} className="w-full">
                {saving
                  ? "Processing..."
                  : currentBlog
                  ? "Update Blog"
                  : "Create Blog"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable data={blogs} columns={columns} />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <ScrollArea className="h-[70vh] p-4">
            <div
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
