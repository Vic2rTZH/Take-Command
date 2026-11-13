export type Highlight = { title: string; text: string };

export type ResourceStatus = "draft" | "coming_soon" | "published";

export type Resource = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  quote: string | null;
  description: string;
  highlights: Highlight[];
  pages: number | null;
  minutes: number | null;
  cover_url: string | null;
  file_path: string | null;
  status: ResourceStatus;
  sort: number;
};

export type Overview = {
  totals: Totals;
  previous: Totals;
  daily: ({ day: string } & Totals)[];
  by_resource: { slug: string; title: string; status: ResourceStatus; views: number; signups: number; downloads: number }[];
  referrers: { host: string; views: number }[];
  recent: { email: string; name: string | null; newsletter: boolean; resource: string; created_at: string; downloaded_at: string | null }[];
};

export type Totals = { views: number; visitors: number; signups: number; downloads: number };
