import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  author: number;
  author_name: string;
  author_email: string;
  status: "draft" | "published";
  tags: string[];
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

export default function BlogManager() {
  const { tokens, isLoggedIn } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Partial<BlogPost>>({});
  const [editorContent, setEditorContent] = useState("");
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

  // Fetch blogs
  const fetchBlogs = async () => {
    if (!isLoggedIn || !tokens?.access) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/blogs`, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBlogs(data);
      } else {
        toast.error("Failed to fetch blogs");
      }
    } catch (error) {
      toast.error("Network error while fetching blogs");
    } finally {
      setLoading(false);
    }
  };

  // Create or update blog
  const saveBlog = async () => {
    if (!tokens?.access) return;

    setSaving(true);
    try {
      const method = currentBlog.id ? 'PUT' : 'POST';
      const url = currentBlog.id
        ? `${import.meta.env.VITE_API_BASE_URL}/blogs/${currentBlog.id}`
        : `${import.meta.env.VITE_API_BASE_URL}/blogs`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Blog ${currentBlog.id ? 'updated' : 'created'} successfully`);
        setIsEditorOpen(false);
        resetForm();
        fetchBlogs();
      } else {
        toast.error(`Failed to ${currentBlog.id ? 'update' : 'create'} blog`);
      }
    } catch (error) {
      toast.error("Network error while saving blog");
    } finally {
      setSaving(false);
    }
  };

  // Delete blog
  const deleteBlog = async (id: number) => {
    if (!tokens?.access) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      });

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

  // Publish/Draft blog
  const toggleBlogStatus = async (id: number, status: "publish" | "draft") => {
    if (!tokens?.access) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/blogs/${id}/${status}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
        },
      });

      if (response.ok) {
        toast.success(`Blog ${status} successfully`);
        fetchBlogs();
      } else {
        toast.error(`Failed to ${status} blog`);
      }
    } catch (error) {
      toast.error("Network error while updating blog status");
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
    setEditorContent("");
    setCurrentBlog({});
  };

  const handleEdit = (blog: BlogPost) => {
    setCurrentBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      status: blog.status,
      tags: blog.tags,
      meta_title: blog.meta_title,
      meta_description: blog.meta_description,
    });
    setEditorContent(blog.content);
    setIsEditorOpen(true);
  };

  useEffect(() => {
    fetchBlogs();
  }, [isLoggedIn, tokens]);

  const columns: Column<BlogPost>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
    },
    {
      key: "author_name",
      label: "Author",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge variant={value === "published" ? "default" : "secondary"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "tags",
      label: "Tags",
      render: (tags: string[]) => (
        <div className="flex gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(row);
            }}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === "draft" ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleBlogStatus(row.id, "publish");
              }}
              title="Publish"
              className="text-green-600"
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleBlogStatus(row.id, "draft");
              }}
              title="Move to Draft"
              className="text-orange-600"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              deleteBlog(row.id);
            }}
            className="text-destructive"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handlePreview = (blog: BlogPost) => {
    setPreviewContent(blog.content);
    setIsPreviewOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Please log in to access this page.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading blogs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Manager</h1>
          <p className="text-muted-foreground">Manage your blog posts and content</p>
        </div>
        <Dialog open={isEditorOpen} onOpenChange={(open) => {
          setIsEditorOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setIsEditorOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
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
                  placeholder="Post title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="post-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div>
                <Label>Content</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Write your blog post..."
                />
              </div>
              <div>
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  placeholder="SEO title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="meta-description">Meta Description</Label>
                <Input
                  id="meta-description"
                  placeholder="SEO description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => saveBlog()} disabled={saving}>
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => {
                    setFormData({ ...formData, status: "published" });
                    saveBlog();
                  }} 
                  disabled={saving}
                >
                  {saving ? "Publishing..." : "Publish"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
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
