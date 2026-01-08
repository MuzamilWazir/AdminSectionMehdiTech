import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Briefcase, Users, Activity } from "lucide-react";

const stats = [
  {
    title: "Total Blogs",
    value: "247",
    change: "+12% from last month",
    icon: FileText,
    color: "text-primary",
  },
  {
    title: "Active Jobs",
    value: "18",
    change: "+3 new this week",
    icon: Briefcase,
    color: "text-success",
  },
  {
    title: "Pending Applicants",
    value: "92",
    change: "+27 from last week",
    icon: Users,
    color: "text-warning",
  },
  {
    title: "Recent Activity",
    value: "1,429",
    change: "+8% from yesterday",
    icon: Activity,
    color: "text-info",
  },
];

const recentActivity = [
  {
    action: "New blog post published",
    user: "John Doe",
    time: "2 hours ago",
  },
  {
    action: "Job posting updated",
    user: "Jane Smith",
    time: "4 hours ago",
  },
  {
    action: "New applicant received",
    user: "System",
    time: "6 hours ago",
  },
  {
    action: "Blog draft saved",
    user: "Mike Johnson",
    time: "8 hours ago",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">by {activity.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
