export interface Documentation {
  id: string;
  team_id: string;
  provider: string;
  owner: string;  // GitHub org/user
  repo: string;   // Repository name
  branch: string; // Branch name
  docs_path: string; // Path within repo
  title: string;
  description: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface CreateDocumentationRequest {
  team_id: string;
  url: string; // Full GitHub URL
  title: string;
  description?: string;
}

export interface UpdateDocumentationRequest {
  url?: string;
  title?: string;
  description?: string;
}

export interface DocumentationConfig {
  owner: string;
  repo: string;
  branch: string;
  docsPath: string;
  provider: string; 
}
