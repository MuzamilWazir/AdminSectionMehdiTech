import { useState } from "react";
import { DataTable, Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Applicant {
  id: number;
  name: string;
  email: string;
  phone: string;
  job: string;
  appliedDate: string;
  status: "applied" | "reviewing" | "interviewed" | "offered" | "rejected";
  score?: number;
}

const sampleApplicants: Applicant[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "+1 234 567 8901",
    job: "Senior Frontend Developer",
    appliedDate: "2024-01-15",
    status: "reviewing",
    score: 8.5,
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    phone: "+1 234 567 8902",
    job: "Senior Frontend Developer",
    appliedDate: "2024-01-18",
    status: "interviewed",
    score: 9.0,
  },
  {
    id: 3,
    name: "Carol White",
    email: "carol@example.com",
    phone: "+1 234 567 8903",
    job: "Product Manager",
    appliedDate: "2024-01-20",
    status: "applied",
  },
];

export default function Applicants() {
  const [applicants, setApplicants] = useState<Applicant[]>(sampleApplicants);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const statusColors: Record<Applicant["status"], string> = {
    applied: "secondary",
    reviewing: "default",
    interviewed: "default",
    offered: "default",
    rejected: "destructive",
  };

  const columns: Column<Applicant>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "job",
      label: "Position",
      sortable: true,
    },
    {
      key: "appliedDate",
      label: "Applied Date",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (value: Applicant["status"]) => (
        <Badge variant={statusColors[value] as any}>
          {value}
        </Badge>
      ),
    },
    {
      key: "score",
      label: "Score",
      render: (value) => value ? (
        <Badge variant="outline">{value}/10</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
  ];

  const handleRowClick = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsSheetOpen(true);
  };

  const handleStatusChange = (status: Applicant["status"]) => {
    if (selectedApplicant) {
      setApplicants(applicants.map(a =>
        a.id === selectedApplicant.id ? { ...a, status } : a
      ));
      setSelectedApplicant({ ...selectedApplicant, status });
      toast.success("Status updated");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Applicants</h1>
          <p className="text-muted-foreground">Review and manage job applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
        </div>
      </div>

      <DataTable
        data={applicants}
        columns={columns}
        searchPlaceholder="Search applicants..."
        onRowClick={handleRowClick}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedApplicant && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedApplicant.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Contact Information</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Email: {selectedApplicant.email}</p>
                    <p className="text-muted-foreground">Phone: {selectedApplicant.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">Application Details</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Position: {selectedApplicant.job}</p>
                    <p className="text-muted-foreground">Applied: {selectedApplicant.appliedDate}</p>
                    <p className="text-muted-foreground">
                      Status: <Badge variant={statusColors[selectedApplicant.status] as any}>
                        {selectedApplicant.status}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Change Status</Label>
                  <Select
                    value={selectedApplicant.status}
                    onValueChange={(value) => handleStatusChange(value as Applicant["status"])}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="reviewing">Under Review</SelectItem>
                      <SelectItem value="interviewed">Interviewed</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    className="mt-2"
                    rows={4}
                    placeholder="Add notes about this applicant..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download Resume
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Interview
                  </Button>
                </div>

                <Button className="w-full">
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
