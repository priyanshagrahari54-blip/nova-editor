type Request = { query?: { repo?: string } }
type Response = { status: (code: number) => { json: (value: unknown) => void }; setHeader: (key: string, value: string) => void }

export default async function handler(request: Request, response: Response) {
  const repo = request.query?.repo
  if (!repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    response.status(400).json({ error: 'Pass a public repository as owner/repository.' })
    return
  }
  try {
    const upstream = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=10`, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Nova-Workspace' } })
    if (!upstream.ok) { response.status(upstream.status).json({ error: 'GitHub could not return issues for this repository.' }); return }
    const data = await upstream.json() as Array<{ number: number; title: string; labels: Array<{ name: string }>; pull_request?: unknown }>
    const issues = data.filter(item => !item.pull_request).map(item => ({ id: item.number, title: item.title, label: item.labels[0]?.name ?? 'unlabeled', priority: 'Normal', status: 'Open' }))
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    response.status(200).json({ repo, issues })
  } catch {
    response.status(502).json({ error: 'Unable to contact the GitHub API. Please try again.' })
  }
}
