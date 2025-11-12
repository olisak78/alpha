# GitHub Docs Feature

A comprehensive documentation viewer that fetches and displays Markdown files from GitHub repositories.

## Features

✅ **Sidebar Navigation** - Tree view of docs folder structure with expandable directories
✅ **GitHub-Style Markdown** - Full GFM support with syntax highlighting
✅ **Dark Mode** - Full dark mode support matching the application theme
✅ **Table of Contents** - Auto-generated from markdown headers, sticky on right side
✅ **Client-Side Search** - Fuzzy search through file names and paths using Fuse.js
✅ **React Query Caching** - Smart caching (5-10 min) to reduce API calls
✅ **Responsive Layout** - Mobile-friendly with collapsible sidebars
✅ **Code Blocks** - Syntax highlighting with copy button

## Architecture

### Frontend Components

```
src/features/docs/
├── DocsPage.tsx                    # Main container component
├── components/
│   ├── DocsSidebar.tsx            # Left sidebar with file tree
│   ├── DocsContent.tsx            # Markdown renderer with GitHub styling
│   ├── DocsTableOfContents.tsx    # Right sidebar with heading links
│   └── DocsSearch.tsx             # Search input component
└── README.md                      # This file
```

### Services & Hooks

```
src/services/githubDocsApi.ts      # GitHub API client (backend proxy)
src/hooks/api/useDocs.ts           # React Query hooks
```

## Configuration

Edit `src/services/githubDocsApi.ts` to configure:

```typescript
export const DOCS_CONFIG = {
  owner: "SAP",              // GitHub organization/user
  repo: "your-docs-repo",    // Repository name - UPDATE THIS
  branch: "main",            // Branch name
  docsPath: "docs",          // Path to docs folder
};
```

## Backend Requirements

⚠️ **IMPORTANT**: The frontend expects backend proxy endpoints for GitHub API calls.

### Required Endpoints

#### 1. Get Repository Contents

```
GET /api/v1/github/repos/:owner/:repo/contents/:path?ref=:branch
```

**Purpose**: Fetch directory listing or file content from GitHub
**Headers Required**:
- `credentials: include` (for authentication)

**Response for Directory**:
```json
[
  {
    "name": "getting-started.md",
    "path": "docs/getting-started.md",
    "sha": "abc123",
    "size": 1234,
    "url": "https://api.github.com/...",
    "html_url": "https://github.com/...",
    "type": "file",
    "download_url": "https://raw.githubusercontent.com/..."
  }
]
```

**Response for File**:
```json
{
  "name": "README.md",
  "path": "docs/README.md",
  "content": "IyBHZXR0aW5nIFN0YXJ0ZWQ=",  // Base64 encoded
  "encoding": "base64",
  "size": 1234,
  "type": "file"
}
```

### Backend Implementation Guide (Go)

Add to your backend's GitHub proxy handler:

```go
// Handler for GitHub API proxy
func (h *Handler) GetGitHubContent(w http.ResponseWriter, r *http.Request) {
    // Extract path parameters
    owner := chi.URLParam(r, "owner")
    repo := chi.URLParam(r, "repo")
    path := chi.URLParam(r, "path")
    branch := r.URL.Query().Get("ref")

    // Get user's GitHub token from session
    token := getGitHubTokenFromSession(r)

    // Make request to GitHub API
    url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s?ref=%s",
                       owner, repo, path, branch)

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer " + token)
    req.Header.Set("Accept", "application/vnd.github.v3+json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer resp.Body.Close()

    // Forward response
    body, _ := io.ReadAll(resp.Body)
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(resp.StatusCode)
    w.Write(body)
}
```

Add route:
```go
r.Get("/api/v1/github/repos/{owner}/{repo}/contents/*", h.GetGitHubContent)
```

## Usage

The Docs tab is automatically added to the AI Arena page. Users can:

1. Navigate through the folder structure in the left sidebar
2. Search for specific docs using the search bar
3. Read markdown content in the center with GitHub styling
4. Use the table of contents on the right to jump to sections
5. Copy code blocks with the copy button

## Styling

The component uses:
- Tailwind CSS for layout and utilities
- Prism.js (`prism-tomorrow.css`) for syntax highlighting
- GitHub-inspired prose styles for markdown
- Dark mode support via `dark:` classes

## Dependencies

```json
{
  "react-markdown": "^9.x",
  "remark-gfm": "^4.x",
  "rehype-prism-plus": "^2.x",
  "rehype-slug": "^6.x",
  "fuse.js": "^7.x",
  "@tanstack/react-query": "^5.x"
}
```

## Future Enhancements

- [ ] Edit docs in GitHub directly from UI
- [ ] Support multiple repositories
- [ ] Advanced search with content indexing
- [ ] Bookmarks/favorites
- [ ] Version/branch selector
- [ ] Diff view for comparing versions
- [ ] Offline mode with service worker
