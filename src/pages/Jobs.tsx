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
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  applicants: number;
  status: "active" | "closed";
  date: string;
}

const sampleJobs: Job[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    applicants: 24,
    status: "active",
    date: "2024-01-15",
  },
  {
    id: 2,
    title: "Product Manager",
    department: "Product",
    location: "New York",
    type: "Full-time",
    applicants: 18,
    status: "active",
    date: "2024-01-20",
  },
  {
    id: 3,
    title: "UX Designer",
    department: "Design",
    location: "Hybrid",
    type: "Contract",
    applicants: 12,
    status: "closed",
    date: "2024-01-10",
  },
];
const API_URL = import.meta.env.VITE_API_URL;
export default function Jobs() {
  const { tokens, isLoggedIn } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<Partial<Job>>({});
  const [jobDescription, setJobDescription] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch jobs from API (mocked here)

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};

      // Add auth header only if token exists
      if (tokens?.access) {
        headers.Authorization = `Bearer ${tokens.access}`;
      }

      const res = await fetch(`${API_URL}/jobs/`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Fetched blogs:", data);

      // Handle different response structures
      if (Array.isArray(data)) {
        setJobs(data);
      } else if (data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };
  useState(() => {
    fetchJobs();
  });
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
      key: "type",
      label: "Type",
    },
    {
      key: "applicants",
      label: "Applicants",
      sortable: true,
      render: (value) => <Badge variant="secondary">{value}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge variant={value === "active" ? "default" : "secondary"}>
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
              handleDelete(row.id);
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

  const handlePreview = (job: Job) => {
    setPreviewContent(`
      <h1>${job.title}</h1>
      <div style="margin: 1rem 0;">
        <p><strong>Department:</strong> ${job.department}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Type:</strong> ${job.type}</p>
        <p><strong>Applicants:</strong> ${job.applicants}</p>
      </div>
      <hr style="margin: 1.5rem 0;"/>
      <h2>Job Description</h2>
      <div>Sample job description content would go here...</div>
    `);
    setIsPreviewOpen(true);
  };

  const handleEdit = (job: Job) => {
    setCurrentJob(job);
    setJobDescription(""); // In real app, load saved description
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setJobs(jobs.filter((j) => j.id !== id));
    toast.success("Job posting deleted");
  };

  const handleSave = () => {
    toast.success("Job posting saved");
    setIsDialogOpen(false);
  };

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
                setCurrentJob({});
                setJobDescription("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentJob.id ? "Edit Job" : "Create New Job"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Senior Frontend Developer"
                  defaultValue={currentJob.title}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g. Engineering"
                    defaultValue={currentJob.department}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select defaultValue={currentJob.location || "remote"}>
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
                  <Select defaultValue={currentJob.type || "full-time"}>
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
                  <Input id="salary" placeholder="e.g. $80k - $120k" />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Job Description</Label>
                <RichTextEditor
                  content={jobDescription}
                  onChange={setJobDescription}
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
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
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
