export interface ConversationRepository {
  getAll(): Promise<Array<any>>
  get(id: string): Promise<any | null>
  create(): Promise<string>
  update(id: string, data: Partial<any>): Promise<void>
  delete(id: string): Promise<void>
}