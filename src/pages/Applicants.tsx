import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/Loading";

interface Applicant {
  id: string;
  user_id: string;
  job_id: string;
  user_email: string;
  applicant_name: string;
  phone_number?: string;
  resume_url?: string;
  status: "Applied" | "Reviewing" | "Interviewed" | "Offered" | "Rejected";
  applied_at: string;
  jobs?: {
    title: string;
    department?: string;
    salary_range?: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL;

export default function Applicants() {
  const { tokens, isLoggedIn } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notes, setNotes] = useState("");

  const statusColors: Record<Applicant["status"], string> = {
    Applied: "secondary",
    Reviewing: "default",
    Interviewed: "default",
    Offered: "default",
    Rejected: "destructive",
  };

  // Fetch all applications
  const fetchApplicants = async () => {
    try {
      setLoading(true);
      
      const headers: Record<string, string> = {};
      if (tokens?.access) {
        headers.Authorization = `Bearer ${tokens.access}`;
      }

     
      const res = await fetch(`${API_URL}/jobapply/my_applications`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Fetched applicants:", data);

      // Adjust based on your API response structure
      if (Array.isArray(data)) {
        setApplicants(data);
      } else if (data.applications && Array.isArray(data.applications)) {
        setApplicants(data.applications);
      } else {
        setApplicants([]);
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
      toast.error("Failed to load applicants");
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchApplicants();
    }
  }, [isLoggedIn]);

  const handleStatusChange = async (status: Applicant["status"]) => {
    if (!selectedApplicant || !tokens?.access) {
      toast.error("Please login to continue");
      return;
    }

    setUpdatingStatus(true);

    try {
      const res = await fetch(
        `${API_URL}/jobapply/applications/${selectedApplicant.id}/status?status=${status}`,
        {
          
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tokens.access}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update status");
      }

      // Update local state
      setApplicants(
        applicants.map((a) =>
          a.id === selectedApplicant.id ? { ...a, status } : a
        )
      );
      setSelectedApplicant({ ...selectedApplicant, status });
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Update status error:", error);
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownloadResume = () => {
    if (selectedApplicant?.resume_url) {
      window.open(selectedApplicant.resume_url, "_blank");
    } else {
      toast.error("No resume available");
    }
  };

  const handleSendEmail = () => {
    if (selectedApplicant?.user_email) {
      window.location.href = `mailto:${selectedApplicant.user_email}`;
    }
  };

  const columns: Column<Applicant>[] = [
    {
      key: "applicant_name",
      label: "Name",
      sortable: true,
    },
    {
      key: "user_email",
      label: "Email",
    },
    {
      key: "jobs",
      label: "Position",
      sortable: true,
      render: (_, row) => row.jobs?.title || "N/A",
    },
    {
      key: "applied_at",
      label: "Applied Date",
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: "status",
      label: "Status",
      render: (value: Applicant["status"]) => (
        <Badge variant={statusColors[value] as any}>{value}</Badge>
      ),
    },
    {
      key: "phone_number",
      label: "Phone",
      render: (value) =>
        value ? (
          <span>{value}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  const handleRowClick = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setNotes("");
    setIsSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading message="Loading applicants..." />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Please login to view applicants
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Applicants</h1>
          <p className="text-muted-foreground">
            Review and manage job applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchApplicants()}>
            Refresh
          </Button>
        </div>
      </div>

      {applicants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No applications found.
        </div>
      ) : (
        <DataTable
          data={applicants}
          columns={columns}
          searchPlaceholder="Search applicants..."
          onRowClick={handleRowClick}
        />
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedApplicant && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedApplicant.applicant_name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    Contact Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Email: {selectedApplicant.user_email}
                    </p>
                    <p className="text-muted-foreground">
                      Phone: {selectedApplicant.phone_number || "Not provided"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    Application Details
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Position: {selectedApplicant.jobs?.title || "N/A"}
                    </p>
                    {selectedApplicant.jobs?.department && (
                      <p className="text-muted-foreground">
                        Department: {selectedApplicant.jobs.department}
                      </p>
                    )}
                    {selectedApplicant.jobs?.salary_range && (
                      <p className="text-muted-foreground">
                        Salary Range: {selectedApplicant.jobs.salary_range}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Applied:{" "}
                      {new Date(
                        selectedApplicant.applied_at
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground">
                      Status:{" "}
                      <Badge
                        variant={statusColors[selectedApplicant.status] as any}
                      >
                        {selectedApplicant.status}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Change Status</Label>
                  <Select
                    value={selectedApplicant.status}
                    onValueChange={(value) =>
                      handleStatusChange(value as Applicant["status"])
                    }
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Reviewing">Under Review</SelectItem>
                      <SelectItem value="Interviewed">Interviewed</SelectItem>
                      <SelectItem value="Offered">Offered</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingStatus && (
                    <p className="text-sm text-blue-600 mt-1">Updating...</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    className="mt-2"
                    rows={4}
                    placeholder="Add notes about this applicant..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDownloadResume}
                    disabled={!selectedApplicant.resume_url}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Resume
                  </Button>
                </div>

                <Button className="w-full" onClick={handleSendEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}