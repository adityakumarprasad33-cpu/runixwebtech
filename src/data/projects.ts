export interface Project {
  slug: string;
  title: string;
  category: string;
  featured: boolean;
  status: string;
  year: number;
  summary: string;
  description: string;
  problem_solved: string;
  stack: string[];
  tags: string[];
  live_url?: string;
  github_url?: string;
  thumbnail: string;
}

export const projects: Project[] = [];
