export function isApiDocumentationEnabled(nodeEnv: string): boolean {
  return nodeEnv === 'development'
}
