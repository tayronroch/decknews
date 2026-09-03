export interface Post {
  id: string
  title: string
  slug: string
  content: string
  published: boolean
  authorId: string
  createdAt: Date
  updatedAt: Date
}
