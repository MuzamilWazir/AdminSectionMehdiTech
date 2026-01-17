import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import Loader from "@/components/loader";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  applicants?: number;
  status: "draft" | "live" | "closed";
  emp_type: string;
  job_des: string;
  qualifications: string;
  salary_range: string;
  created_at?: string;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function Jobs() {
  const { tokens, isLoggedIn } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<Partial<Job> | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    department: "",
    emp_type: "full-time",
    job_des: "",
    qualifications: "",
    salary_range: "",
    location: "remote",
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};

      if (tokens?.access) {
        headers.Authorization = `Bearer ${tokens.access}`;
      }

      const res = await fetch(`${API_URL}/jobs/jobs`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Fetched jobs:", data);

      // Transform backend data to frontend format
      let jobsData = Array.isArray(data) ? data : (data.jobs || []);
      
      // Map backend fields to frontend fields
      const transformedJobs = jobsData.map((job: any) => ({
        id: job.id,
        title: job.title,
        department: job.department || "",
        location: job.location || "remote",
        applicants: job.applicants || 0,
        status: job.status || "draft",
        emp_type: job.employment_type || job.emp_type || "full-time",
        job_des: job.job_description || job.job_des || "",
        qualifications: job.qualifications || "",
        salary_range: job.salary_range || "",
        created_at: job.created_at || ""
      }));

      setJobs(transformedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id: number) => {
    if (!tokens?.access) {
      toast.error("Please login to continue");
      return;
    }

    if (!confirm("Are you sure you want to delete this Job?")) return;

    try {
      const res = await fetch(`${API_URL}/jobs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens.access}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Delete failed");
      }

      toast.success("Job deleted successfully");
      fetchJobs();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const saveJob = async () => {
    if (!tokens?.access) {
      toast.error("Please login to continue");
      return;
    }

    if (!formData.title || !formData.job_des) {
      toast.error("Title and Description are required");
      return;
    }

    setSaving(true);

    try {
      // Prepare payload for both CREATE and UPDATE
      const jobPayload = {
        title: formData.title,
        department: formData.department,
        emp_type: formData.emp_type,
        job_des: formData.job_des,
        qualifications: formData.qualifications,
        salary_range: formData.salary_range,
        location: formData.location,
      };

      console.log("Saving job with payload:", jobPayload);

      if (currentJob?.id) {
        // UPDATE
        const res = await fetch(`${API_URL}/jobs/${currentJob.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(jobPayload),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Update failed");
        }

        toast.success("Job updated successfully");
      } else {
        // CREATE - Use JSON instead of FormData
        const res = await fetch(`${API_URL}/jobs/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access}`,
          },
          body: JSON.stringify(jobPayload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          let errorMessage = "Failed to create Job";

          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const result = await res.json();
        console.log("Job created:", result);
        toast.success("Job created successfully");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchJobs();
    } catch (error) {
      console.error("Save Job error:", error);
      toast.error(error instanceof Error ? error.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      emp_type: "full-time",
      job_des: "",
      qualifications: "",
      salary_range: "",
      location: "remote",
    });
    setCurrentJob(null);
  };

  const handleEdit = (job: Job) => {
    setCurrentJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      emp_type: job.emp_type,
      job_des: job.job_des,
      qualifications: job.qualifications,
      salary_range: job.salary_range,
      location: job.location,
    });
    setIsDialogOpen(true);
  };

  const handlePreview = (job: Job) => {
    setPreviewContent(`
      <h1>${job.title}</h1>
      <div style="margin: 1rem 0;">
        <p><strong>Department:</strong> ${job.department}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Type:</strong> ${job.emp_type}</p>
        <p><strong>Salary Range:</strong> ${job.salary_range || "Not specified"}</p>
        <p><strong>Qualifications:</strong> ${job.qualifications}</p>
      </div>
      <hr style="margin: 1.5rem 0;"/>
      <h2>Job Description</h2>
      <div>${job.job_des}</div>
    `);
    setIsPreviewOpen(true);
  };

  useEffect(() => {
    fetchJobs();
  }, [isLoggedIn, tokens?.access]);

  const columns: Column<Job>[] = [
    {
      key: "title",
      label: "Job Title",
      sortable: true,
    },
    {
      key: "department",
      label: "Department",
      sortable: true,
    },
    {
      key: "location",
      label: "Location",
    },
    {
      key: "emp_type",
      label: "Type",
    },
    {
      key: "applicants",
      label: "Applicants",
      sortable: true,
      render: (value) => <Badge>{value ?? 0}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge variant={value === "live" ? "default" : "secondary"}>
          {value}
        </Badge>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              deleteJob(row.id);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader message="Loading Jobs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Posts</h1>
          <p className="text-muted-foreground">
            Manage job postings and recruitment
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setCurrentJob(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentJob?.id ? "Edit Job" : "Create New Job"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Senior Frontend Developer"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g. Engineering"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(val) =>
                      setFormData({ ...formData, location: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Employment Type</Label>
                  <Select
                    value={formData.emp_type}
                    onValueChange={(val) =>
                      setFormData({ ...formData, emp_type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    placeholder="e.g. $80k - $120k"
                    value={formData.salary_range}
                    onChange={(e) =>
                      setFormData({ ...formData, salary_range: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Job Description</Label>
                <RichTextEditor
                  content={formData.job_des}
                  onChange={(val) => setFormData({ ...formData, job_des: val })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  rows={3}
                  placeholder="List required qualifications..."
                  value={formData.qualifications}
                  onChange={(e) =>
                    setFormData({ ...formData, qualifications: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveJob} disabled={saving}>
                  {saving
                    ? currentJob?.id
                      ? "Updating..."
                      : "Creating..."
                    : currentJob?.id
                      ? "Update Job"
                      : "Create Job"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={jobs}
        columns={columns}
        searchPlaceholder="Search jobs..."
      />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Job Posting Preview</DialogTitle>
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