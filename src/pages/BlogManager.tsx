import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  id: string; // Changed to string to match Supabase UUIDs
  title: string;
  slug: string;
  content: string;
  author: string;
  status: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  created_at: string;
  thumbnail?: string;
}

export default function BlogManager() {
  const { tokens, isLoggedIn } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Partial<BlogPost>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    status: "draft" as "draft" | "published",
    tags: [] as string[],
    meta_title: "",
    meta_description: "",
  });

  // Fetch blogs logic
  const fetchBlogs = async () => {
    if (!isLoggedIn || !tokens?.access) {
      setLoading(false);
      return;
    }

    try {
      // Added trailing slash to match FastAPI router
      const response = await fetch(`${import.meta.env.VITE_API_URL}/blogs/`, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns { "blogs": [...] }, so we access .blogs
        setBlogs(data.blogs || []);
      } else {
        toast.error("Failed to fetch blogs");
      }
    } catch (error) {
      toast.error("Network error while fetching blogs");
    } finally {
      setLoading(false);
    }
  };

  // Create or update blog logic
  const saveBlog = async () => {
    if (!tokens?.access) return;

    setSaving(true);
    try {
      const isUpdate = !!currentBlog.id;
      const url = isUpdate
        ? `${import.meta.env.VITE_API_URL}/blogs/${currentBlog.id}`
        : `${import.meta.env.VITE_API_URL}/blogs/`;

      if (isUpdate) {
        // PUT logic: Backend expects a JSON dict
        const updatePayload = {
          title: formData.title,
          content: formData.content,
          image_url: currentBlog.thumbnail || "",
          internal_urls: [],
          "user.user.id": "",
          author: "Admin",
          tags_list: formData.tags,
          category: formData.slug || "General",
        };

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(updatePayload),
        });

        if (response.ok) {
          toast.success("Blog updated successfully");
          setIsEditorOpen(false);
          fetchBlogs();
        } else {
          toast.error("Failed to update blog");
        }
      } else {
        // POST logic: Backend expects FormData (Multipart)
        const data = new FormData();
        data.append("title", formData.title);
        data.append("content", formData.content);
        data.append("author", "Admin");
        data.append("tags", formData.tags.join(","));
        data.append("category", formData.slug || "General");

        // Since your UI doesn't have a file picker yet,
        // we send an empty blob to satisfy the 'image' requirement
        const emptyFile = new File([""], "placeholder.jpg", {
          type: "image/jpeg",
        });
        data.append("image", emptyFile);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
          body: data,
        });

        if (response.ok) {
          toast.success("Blog created successfully");
          setIsEditorOpen(false);
          resetForm();
          fetchBlogs();
        } else {
          const errorData = await response.json();
          toast.error(errorData.detail || "Failed to create blog");
        }
      }
    } catch (error) {
      toast.error("Network error while saving blog");
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async (id: string) => {
    if (!tokens?.access) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/blogs/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Blog deleted successfully");
        fetchBlogs();
      } else {
        toast.error("Failed to delete blog");
      }
    } catch (error) {
      toast.error("Network error while deleting blog");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      status: "draft",
      tags: [],
      meta_title: "",
      meta_description: "",
    });
    setCurrentBlog({});
  };

  const handleEdit = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug || "",
      content: blog.content,
      status: (blog.status as any) || "draft",
      tags: blog.tags || [],
      meta_title: blog.meta_title || "",
      meta_description: blog.meta_description || "",
    });
    setIsEditorOpen(true);
  };

  const handlePreview = (blog: BlogPost) => {
    setPreviewContent(blog.content);
    setIsPreviewOpen(true);
  };

  useEffect(() => {
    fetchBlogs();
  }, [isLoggedIn, tokens]);

  const columns: Column<BlogPost>[] = [
    { key: "title", label: "Title", sortable: true },
    { key: "author", label: "Author", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge variant={value === "published" ? "default" : "secondary"}>
          {value || "draft"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "N/A"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePreview(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteBlog(row.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Manager</h1>
          <p className="text-muted-foreground">Manage your blog posts</p>
        </div>
        <Dialog
          open={isEditorOpen}
          onOpenChange={(open) => {
            setIsEditorOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEditorOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentBlog.id ? "Edit Post" : "Create New Post"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="slug">Category (Slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Content</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => saveBlog()} disabled={saving}>
                  {saving ? "Saving..." : "Save Blog"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={blogs}
        columns={columns}
        searchPlaceholder="Search blog posts..."
      />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Blog Post Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh] pr-4">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
