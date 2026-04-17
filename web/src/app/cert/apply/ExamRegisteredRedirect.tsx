'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@/lib/api-client'

export default function ExamRegisteredRedirect() {
  const router = useRouter()
  const { accessToken, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading || !accessToken) return
    apiClient
      .get<{ success: boolean; data: { id: string; examId: string }[] }>(
        '/api/v1/users/me/exam-registrations',
        { token: accessToken }
      )
      .then((res) => {
        if (res.data.length > 0) {
          router.replace(`/exams/${res.data[res.data.length - 1].examId}`)
        }
      })
      .catch(() => {})
  }, [accessToken, isLoading, router])

  return null
}
