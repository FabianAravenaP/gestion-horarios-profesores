import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import AdminDashboard from './AdminDashboard'
import TeacherDashboard from './TeacherDashboard'

function Dashboard() {
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current session immediately (don't rely on INITIAL_SESSION event
    // which may fire before this listener is registered)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        window.location.href = '/'
        return
      }
      fetchUserRole(session.user)
    })

    // Listen only for future state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/'
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) fetchUserRole(session.user)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [])

  async function fetchUserRole(user) {
    try {
      const { data: profile, error } = await supabase
        .from('profesores')
        .select('rol')
        .eq('email', user.email)
        .single()
      
      if (error) throw error
      setRole(profile.rol)
    } catch (error) {
      console.error('Error fetching role:', error.message)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      opacity: 0.6,
      fontSize: '1rem'
    }}>
      <div style={{ fontSize: '2rem' }}>⏳</div>
      Cargando...
    </div>
  )

  return (
    <>
      {role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <TeacherDashboard />
      )}
    </>
  )
}

export default Dashboard
