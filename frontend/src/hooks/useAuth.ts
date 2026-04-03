import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../services/api'
import type { User, RegisterData } from '../types'
import toast from 'react-hot-toast'

export function useAuth() {
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading,
    isError
  } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('No token')
      const res = await authApi.getMe()
      return res.data
    },
    retry: false,
    staleTime: 1000 * 60 * 10
  })

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await authApi.login(email, password)
      return res.data
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Erfolgreich angemeldet!')
    },
    onError: () => {
      toast.error('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.')
    }
  })

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await authApi.register(data)
      return res.data
    },
    onSuccess: async (_, variables) => {
      // Auto-login after register
      await loginMutation.mutateAsync({ email: variables.email, password: variables.password })
      toast.success('Konto erfolgreich erstellt!')
    },
    onError: () => {
      toast.error('Registrierung fehlgeschlagen.')
    }
  })

  const guestMutation = useMutation({
    mutationFn: async () => {
      const res = await authApi.guestSession()
      return res.data
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Gastmodus gestartet!')
    },
    onError: () => {
      toast.error('Gastanmeldung fehlgeschlagen.')
    }
  })

  const logout = () => {
    localStorage.removeItem('access_token')
    queryClient.clear()
    window.location.href = '/'
  }

  const isAuthenticated = !!user && !isError

  return {
    user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerLoading: registerMutation.isPending,
    guestLogin: guestMutation.mutateAsync,
    guestLoading: guestMutation.isPending,
    logout
  }
}
