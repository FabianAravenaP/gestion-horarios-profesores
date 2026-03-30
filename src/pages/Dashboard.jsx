import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import AdminDashboard from './AdminDashboard'
import TeacherDashboard from './TeacherDashboard'
import { logActivity } from '../services/activity'

function Dashboard() {
  const [role, setRole] = useState('profesor') // Default to 'profesor' for immediate render
  const [sessionUser, setSessionUser] = useState(null)
  const [hasChecked, setHasChecked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setSessionUser(session.user)
          fetchUserRole(session.user)
        } else {
          // No session - let's try getUser for more reliability on some browsers
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setSessionUser(user)
            fetchUserRole(user)
          } else {
            navigate('/')
          }
        }
      } catch (err) {
        console.error('Initial check failed:', err)
        navigate('/')
      } finally {
        setHasChecked(true)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/')
      } else if (session?.user) {
        setSessionUser(session.user)
        fetchUserRole(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  useEffect(() => {
    // Log entry once everything is ready - Exclude admins
    if (sessionUser && role && hasChecked && role !== 'admin') {
      logActivity(sessionUser.id, 'ingreso_plataforma', { role })
    }
  }, [sessionUser?.id, role, hasChecked])

  async function fetchUserRole(user) {
    try {
      const { data: profile } = await supabase
        .from('profesores')
        .select('rol')
        .ilike('email', user.email)
        .maybeSingle()
      
      if (profile?.rol) {
        setRole(profile.rol)
      }
    } catch (err) {
      console.error('Role fetch failed:', err)
    }
  }

  // If we haven't even checked if there's a user, show minimalist loading
  if (!hasChecked && !sessionUser) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ opacity: 0.5 }}>Iniciando...</div>
    </div>
  )

  return (
    <>
      {role === 'admin' ? (
        <AdminDashboard user={sessionUser} />
      ) : (
        <TeacherDashboard user={sessionUser} />
      )}
    </>
  )
}

export default Dashboard
