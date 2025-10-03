# Background Coding Agent

This coding agent is built with AI SDK 5, Vercel AI Gateway, and Vercel Sandbox. It can read and modify GitHub repositories.

## Environment Variables

- `VERCEL_OIDC_TOKEN` - For AI Gateway and Sandbox (this will be automatically added when you run `vercel dev`)
- `GOOGLE_GENERATIVE_AI_API_KEY` - (optional) If using gemini directly instead of Vercel's AI Gateway
- `GITHUB_TOKEN` - GitHub personal access token

## Usage

```bash
curl -X POST https://your-deployment.vercel.app/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Add a contributing section to the readme",
    "repoUrl": "https://github.com/{GITHUB_USER}/{REPO_NAME}/"
  }'
```

Parameters:

- `prompt` - What you want the agent to do
- `repoUrl` - GitHub repository URL
