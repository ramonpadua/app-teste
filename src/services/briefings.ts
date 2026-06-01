import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Briefing extends RecordModel {
  title: string
  meeting_date: string
  content: string
  input_type: 'text' | 'audio'
  user: string
  audio_file?: string
}

export const getBriefings = () =>
  pb.collection<Briefing>('briefings').getFullList({ sort: '-meeting_date' })

export const getBriefing = (id: string) => pb.collection<Briefing>('briefings').getOne(id)

export const createBriefing = (data: Partial<Briefing> | FormData) =>
  pb.collection<Briefing>('briefings').create(data)

export const updateBriefing = (id: string, data: Partial<Briefing> | FormData) =>
  pb.collection<Briefing>('briefings').update(id, data)

export const deleteBriefing = (id: string) => pb.collection<Briefing>('briefings').delete(id)
