# Admin Dashboard

A modern, production-ready admin dashboard built with React, TypeScript, and Tailwind CSS.

## Features

### Core Features
- **Dashboard Overview**: Real-time statistics and activity feed
- **Blog Manager**: Full-featured blog post editor with rich text support
- **HR Module**: Job posting management and applicant tracking
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Technical Features
- Collapsible sidebar navigation
- Data tables with search, sort, filter, and pagination
- Rich text editor (TipTap) with formatting, links, and images
- Modal dialogs and drawer components
- Toast notifications
- Reusable component architecture

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TipTap** - Rich text editing
- **React Router** - Navigation
- **Shadcn UI** - Component library
- **Lucide React** - Icons

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

## API Integration Guide

This dashboard uses sample data. To connect to real APIs:

### 1. Blog Posts API

Replace sample data in `src/pages/BlogManager.tsx`:

```typescript
// GET all posts
fetch('/api/blogs')
  .then(res => res.json())
  .then(data => setBlogs(data));

// POST new post
fetch('/api/blogs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title,
    content,
    author,
    status,
    tags
  })
});

// PUT update post
fetch(`/api/blogs/${id}`, {
  method: 'PUT',
  body: JSON.stringify(updatedPost)
});

// DELETE post
fetch(`/api/blogs/${id}`, { method: 'DELETE' });
```

**Expected API Response Format:**
```json
{
  "id": 1,
  "title": "Post Title",
  "author": "Author Name",
  "status": "published",
  "date": "2024-01-15",
  "tags": ["React", "Tutorial"],
  "content": "<p>HTML content</p>"
}
```

### 2. Jobs API

Replace sample data in `src/pages/Jobs.tsx`:

```typescript
// GET all jobs
fetch('/api/jobs')
  .then(res => res.json())
  .then(data => setJobs(data));

// POST new job
fetch('/api/jobs', {
  method: 'POST',
  body: JSON.stringify({
    title,
    department,
    location,
    type,
    description,
    qualifications
  })
});
```

**Expected API Response Format:**
```json
{
  "id": 1,
  "title": "Senior Frontend Developer",
  "department": "Engineering",
  "location": "Remote",
  "type": "Full-time",
  "applicants": 24,
  "status": "active",
  "date": "2024-01-15"
}
```

### 3. Applicants API

Replace sample data in `src/pages/Applicants.tsx`:

```typescript
// GET applicants for a job
fetch(`/api/jobs/${jobId}/applicants`)
  .then(res => res.json())
  .then(data => setApplicants(data));

// PUT update applicant status
fetch(`/api/applicants/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'interviewed' })
});

// GET applicant resume
fetch(`/api/applicants/${id}/resume`)
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  });
```

**Expected API Response Format:**
```json
{
  "id": 1,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "phone": "+1 234 567 8901",
  "job": "Senior Frontend Developer",
  "appliedDate": "2024-01-15",
  "status": "reviewing",
  "score": 8.5,
  "resumeUrl": "/resumes/alice.pdf"
}
```

## Component Documentation

### DataTable Component
Reusable table with built-in search, sort, filter, and pagination.

```typescript
import { DataTable, Column } from "@/components/DataTable";

const columns: Column<DataType>[] = [
  { key: "name", label: "Name", sortable: true },
  { 
    key: "status", 
    label: "Status",
    render: (value) => <Badge>{value}</Badge>
  }
];

<DataTable
  data={data}
  columns={columns}
  searchPlaceholder="Search..."
  onRowClick={(row) => handleClick(row)}
/>
```

### Rich Text Editor
TipTap-based WYSIWYG editor with formatting tools.

```typescript
import { RichTextEditor } from "@/components/RichTextEditor";

<RichTextEditor
  content={content}
  onChange={setContent}
  placeholder="Start writing..."
/>
```

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AdminLayout.tsx    # Main layout wrapper
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   └── Navbar.tsx         # Top navigation bar
│   ├── ui/                    # Shadcn UI components
│   ├── DataTable.tsx          # Reusable data table
│   └── RichTextEditor.tsx     # Rich text editor
├── pages/
│   ├── Dashboard.tsx          # Dashboard overview
│   ├── BlogManager.tsx        # Blog management
│   ├── Jobs.tsx               # Job postings
│   ├── Applicants.tsx         # Applicant tracking
│   └── Settings.tsx           # Settings page
├── lib/
│   └── utils.ts               # Utility functions
└── App.tsx                    # App router
```

## Customization

### Design System
Edit design tokens in `src/index.css` and `tailwind.config.ts`:

```css
:root {
  --primary: 217 91% 60%;
  --foreground: 220 13% 18%;
  /* ... */
}
```

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/components/layout/Sidebar.tsx`

## Testing

Unit tests can be added using Vitest and React Testing Library:

```typescript
// Example test skeleton
import { render, screen } from '@testing-library/react';
import Dashboard from './pages/Dashboard';

describe('Dashboard', () => {
  it('renders stats cards', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Blogs')).toBeInTheDocument();
  });
});
```

## Environment Variables

Create a `.env` file for API configuration:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_AUTH_TOKEN=your-auth-token
```

Access in code:
```typescript
const API_URL = process.env.REACT_APP_API_URL;
```

## Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Deploy the `dist` folder to any static hosting service.

## License

MIT
