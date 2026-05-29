import { supabase } from './supabase'
import type { Notification } from '../types'

export interface CreateNotificationInput {
  user_id: string
  type: Notification['type']
  title: string
  message?: string
  link?: string
}

export async function createNotification(input: CreateNotificationInput) {
  const { error } = await supabase.from('notifications').insert({
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    link: input.link ?? null,
    read: false,
  })
  if (error) {
    console.error('Failed to create notification:', error)
  }
}

export async function createNotificationsForAdmins(
  inputs: Omit<CreateNotificationInput, 'user_id'>[]
) {
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id')
    .in('role', ['admin', 'operator'])

  if (!profiles || profiles.length === 0) return

  const notifications = profiles.flatMap((p) =>
    inputs.map((input) => ({
      user_id: p.id,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      read: false,
    }))
  )

  const { error } = await supabase.from('notifications').insert(notifications)
  if (error) {
    console.error('Failed to create bulk notifications:', error)
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  if (error) throw error
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) {
    console.error('Failed to get unread count:', error)
    return 0
  }
  return count ?? 0
}
