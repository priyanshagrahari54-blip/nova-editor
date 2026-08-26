export default function handler(_request: unknown, response: { status: (code: number) => { json: (value: unknown) => void } }) {
  response.status(200).json({ status: 'ok', service: 'nova-api', timestamp: new Date().toISOString() })
}
