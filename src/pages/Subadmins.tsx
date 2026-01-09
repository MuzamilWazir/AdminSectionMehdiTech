import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subadmin {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: number;
  access_pages: string[];
  date_joined: string;
}

export default function Subadmins() {
  const { tokens, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [subadmins, setSubadmins] = useState<Subadmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    access_pages: [] as string[],
  });

  const handleAccessPageToggle = (page: string) => {
    setFormData((prev) => ({
      ...prev,
      access_pages: prev.access_pages.includes(page)
        ? prev.access_pages.filter((p) => p !== page)
        : [...prev.access_pages, page],
    }));
  };

  // Fetch subadmins
  const fetchSubadmins = async () => {
    if (!tokens?.access) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/subadmins`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubadmins(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch subadmins",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching subadmins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create subadmin
  const createSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/subadmin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens?.access}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subadmin created successfully",
        });
        setFormData({
          email: "",
          first_name: "",
          last_name: "",
          password: "",
          access_pages: [],
        });
        setIsCreateDialogOpen(false);
        fetchSubadmins(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create subadmin",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while creating subadmin",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Delete subadmin
  const deleteSubadmin = async (id: number) => {
    setDeleting(id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/subadmin/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokens?.access}`,
          },
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subadmin deleted successfully",
        });
        fetchSubadmins(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to delete subadmin",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while deleting subadmin",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    if (isLoggedIn && tokens?.access) {
      fetchSubadmins();
    } else if (!isLoggedIn) {
      setLoading(false);
    }
  }, [isLoggedIn, tokens]);

  {
    /**  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Please log in to access this page.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading subadmins...</div>
      </div>
    );
  }
 */
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manage Subadmins
          </h1>
          <p className="text-muted-foreground">
            Create and manage subadmin accounts with different access levels.
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Subadmin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Subadmin</DialogTitle>
            </DialogHeader>
            <form onSubmit={createSubadmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-3">
                <Label>Page Access</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="blogs"
                      checked={formData.access_pages.includes("blogs")}
                      onCheckedChange={() => handleAccessPageToggle("blogs")}
                    />
                    <label
                      htmlFor="blogs"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Blogs Management
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="jobs"
                      checked={formData.access_pages.includes("jobs")}
                      onCheckedChange={() => handleAccessPageToggle("jobs")}
                    />
                    <label
                      htmlFor="jobs"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Jobs Management
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="applicants"
                      checked={formData.access_pages.includes("applicants")}
                      onCheckedChange={() =>
                        handleAccessPageToggle("applicants")
                      }
                    />
                    <label
                      htmlFor="applicants"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Applicants Management
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Subadmin"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subadmins ({subadmins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {subadmins.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No subadmins yet</h3>
              <p className="text-muted-foreground">
                Get started by creating your first subadmin account.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access Pages</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subadmins.map((subadmin) => (
                  <TableRow key={subadmin.id}>
                    <TableCell className="font-medium">
                      {subadmin.first_name} {subadmin.last_name}
                    </TableCell>
                    <TableCell>{subadmin.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Subadmin
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {subadmin.access_pages.length > 0 ? (
                          subadmin.access_pages.map((page) => (
                            <span
                              key={page}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {page}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No access
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(subadmin.date_joined).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subadmin</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              {subadmin.first_name} {subadmin.last_name}? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSubadmin(subadmin.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleting === subadmin.id}
                            >
                              {deleting === subadmin.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
