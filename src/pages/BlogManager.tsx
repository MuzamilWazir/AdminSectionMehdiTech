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
  });

  /* ================= FETCH BLOGS ================= */

  const fetchBlogs = async () => {
    if (!tokens?.access) return;

    try {
      const res = await fetch(`${API_URL}/blogs/`, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      // Ensure we extract the array from the {"blogs": [...]} wrapper
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

  /* ================= CREATE / UPDATE ================= */

  const saveBlog = async () => {
    if (!tokens?.access) return;

    if (!formData.title || !formData.content) {
      toast.error("Title and content are required");
      return;
    }

    setSaving(true);

    try {
      if (currentBlog) {
        /* ---------- UPDATE (Expects JSON) ---------- */
        // Mapping keys exactly as the backend dict lookup requires
        const payload = {
          title: formData.title,
          content: formData.content,
          image_url: currentBlog.thumbnail || null,
          internal_urls: [],
          "user.user.id": currentBlog.id, // Backend looks for this literal key string
          author: "Admin",
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

        if (!res.ok) throw new Error();
        toast.success("Blog updated successfully");
      } else {
        /* ---------- CREATE (Expects FormData) ---------- */
        const data = new FormData();
        data.append("title", formData.title);
        data.append("content", formData.content);
        data.append("author", "Admin");
        data.append("tags", formData.tags);
        data.append("category", formData.category || "General");

        // Image is optional: only append if selected
        if (thumbnail) {
          data.append("image", thumbnail);
        }

        const res = await fetch(`${API_URL}/blogs/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.access}`,
            // Do NOT set Content-Type header for FormData; browser handles it
          },
          body: data,
        });

        if (!res.ok) throw new Error();
        toast.success("Blog created successfully");
      }

      resetForm();
      setIsEditorOpen(false);
      fetchBlogs();
    } catch {
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */

  const deleteBlog = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/blogs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens?.access}`,
        },
      });

      if (!res.ok) throw new Error();
      toast.success("Blog deleted");
      fetchBlogs();
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ================= HELPERS ================= */

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "",
      tags: "",
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
      tags: blog.tags ? blog.tags.join(",") : "",
    });
    setIsEditorOpen(true);
  };

  /* ================= TABLE ================= */

  const columns: Column<BlogPost>[] = [
    { key: "title", label: "Title" },
    { key: "author", label: "Author" },
    {
      key: "created_at",
      label: "Date",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "N/A"),
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
              <div>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Thumbnail (Optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label>Content</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>

              <Button onClick={saveBlog} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Blog"}
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
