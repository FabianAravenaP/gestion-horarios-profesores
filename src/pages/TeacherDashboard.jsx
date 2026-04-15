import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import logo from '../assets/logo.jpg'
import { formatLongDate, getWeekRange } from '../services/dateUtils'
import { BLOQUES, DIAS, DURACION_BLOQUE_H } from '../services/constants'
import { getDetailedBudget, formatUsage } from '../services/budgetUtils'


function TeacherDashboard({ user: initialUser }) {
  const [user, setUser] = useState(initialUser)
  const [profile, setProfile] = useState(null)
  const [horarios, setHorarios] = useState([])
  const [inheritedHorarios, setInheritedHorarios] = useState([])
  const [coberturas, setCoberturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordProcessing, setPasswordProcessing] = useState(false)
  const [permisos, setPermisos] = useState([])
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  useEffect(() => {
    if (initialUser) setUser(initialUser)
    fetchUserData(initialUser)
  }, [initialUser])

  async function fetchUserData(currentUser) {
    const targetUser = currentUser || user
    if (!targetUser) {
      setLoading(false)
      return
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profesores')
        .select('*')
        .ilike('email', targetUser.email)
        .maybeSingle()

      if (profileError) throw profileError
      setProfile(profile)

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('horarios')
        .select('*, asignaturas(nombre)')
        .eq('profesor_id', profile.id)

      if (scheduleError) throw scheduleError
      setHorarios(scheduleData)

      // 3. Fetch long-term replacements
      const { data: replacementPeriods, error: repError } = await supabase
        .from('reemplazos_periodos')
        .select('*, ausente:profesores!profesor_ausente_id(nombre)')
        .eq('profesor_reemplazante_id', profile.id)
        .eq('activo', true)

      if (repError) throw repError

      // 4. Fetch schedules of absent teachers
      if (replacementPeriods && replacementPeriods.length > 0) {
        const ausenteIds = replacementPeriods.map(r => r.profesor_ausente_id)
        const { data: inheritedData, error: inError } = await supabase
          .from('horarios')
          .select('*, asignaturas(nombre)')
          .in('profesor_id', ausenteIds)

        if (inError) throw inError

        // Tag them with the ausente name for the UI
        const taggedInherited = inheritedData.map(h => ({
          ...h,
          isInherited: true,
          ausenteNombre: replacementPeriods.find(r => r.profesor_ausente_id === h.profesor_id)?.ausente?.nombre
        }))
        setInheritedHorarios(taggedInherited)
      } else {
        setInheritedHorarios([])
      }

      // 5. Fetch single-block coverages
      const { data: coverageData, error: coverageError } = await supabase
        .from('coberturas')
        .select('*, ausente:profesores!profesor_ausente_id(nombre), horarios(*, asignaturas(nombre))')
        .eq('profesor_reemplazante_id', profile.id)
        .order('fecha', { ascending: true })

      if (coverageError) throw coverageError
      setCoberturas(coverageData)

      // 6. Fetch Administrative Permits
      const { data: permitData, error: permitError } = await supabase
        .from('permisos_administrativos')
        .select('*')
        .eq('profesor_id', profile.id)
        .order('fecha', { ascending: false })

      if (permitError) throw permitError
      setPermisos(permitData)

    } catch (error) {
      console.error('Error fetching teacher data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  // Real-time Subscription — covers all relevant tables
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('teacher_realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coberturas' }, () => {
        fetchUserData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'horarios' }, () => {
        fetchUserData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reemplazos_periodos' }, () => {
        fetchUserData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profesores' }, (payload) => {
        // Only refresh if it's THIS teacher's profile being updated
        if (payload.new && payload.new.id === profile?.id) {
          fetchUserData()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'permisos_administrativos' }, () => {
        fetchUserData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const getHorarioAt = (diaId, horaInicio) => {
    // Check own schedule first
    const own = horarios.find(h =>
      h.dia_semana === diaId &&
      (h.hora_inicio.slice(0, 5) === horaInicio.slice(0, 5))
    )
    if (own) return own

    // Check inherited schedules
    const inherited = inheritedHorarios.find(h =>
      h.dia_semana === diaId &&
      (h.hora_inicio.slice(0, 5) === horaInicio.slice(0, 5))
    )
    if (inherited) return inherited

    return null
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden.')
      return
    }
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setPasswordProcessing(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      // Update flag in DB
      const { error: pError } = await supabase
        .from('profesores')
        .update({ cambio_clave_pendiente: false })
        .eq('id', profile.id)

      if (pError) throw pError

      alert('Contraseña actualizada con éxito.')
      setIsPasswordModalOpen(false)
      setNewPassword('')
      setConfirmPassword('')
      // Refresh profile to hide banner
      fetchUserData()
    } catch (error) {
      alert('Error al cambiar contraseña: ' + error.message)
    } finally {
      setPasswordProcessing(false)
    }
  }


  const handleMarkNotificationsAsRead = async () => {
    const unreadIds = unreadCoverages.map(c => c.id)
    if (unreadIds.length === 0) return

    try {
      const { error } = await supabase
        .from('coberturas')
        .update({ vista_por_profesor: true })
        .in('id', unreadIds)

      if (error) throw error

      setCoberturas(prev => prev.map(c => unreadIds.includes(c.id) ? { ...c, vista_por_profesor: true } : c))
      setIsNotificationsOpen(false)
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'aprobado': return <span className="badge badge-success">Aprobado</span>
      case 'rechazado': return <span className="badge badge-danger">Rechazado</span>
      default: return <span className="badge badge-warning">Pendiente</span>
    }
  }

  const { start: weekStart, end: weekEnd } = getWeekRange(new Date().toISOString().split('T')[0])
  const currentWeekAssignments = coberturas.filter(c =>
    c.fecha >= weekStart &&
    c.fecha <= weekEnd &&
    c.estado !== 'cancelada' &&
    c.tipo === 'cobertura' &&
    !c.contabilizada // Added this to be extra safe, though date filter usually handles it
  )
  const horasCubiertas = currentWeekAssignments.length

  const unreadCoverages = coberturas.filter(c =>
    !c.vista_por_profesor &&
    c.tipo === 'cobertura' &&
    c.estado !== 'cancelada'
  )

  const uniqueSubjects = Array.from(new Set(horarios.filter(h => h.asignaturas?.nombre).map(h => h.asignaturas.nombre)))
  const clasesCount = horarios.filter(h => h.tipo_bloque === 'clase').length

  const budget = getDetailedBudget(profile?.horas_excedentes, profile?.horas_no_lectivas)

  // UNIFIED LOGIC: Use surplus (excedentes) first, then no-teaching
  // Total Histórico counts everything non-cancelled
  const totalCubiertoTotal = coberturas.filter(c => c.estado !== 'cancelada' && c.tipo === 'cobertura').length

  // Current period usage only counts non-accounted-for coverages
  const currentPeriodUsage = coberturas.filter(c => c.estado !== 'cancelada' && c.tipo === 'cobertura' && !c.contabilizada).length
  const totalCubiertoSemana = currentWeekAssignments.length

  // Stats for the "Pools" (Linear attribution) - Based on current period usage
  const usedFromSurplus = Math.min(currentPeriodUsage, budget.surplus)
  const usedFromNoLectivas = Math.max(0, currentPeriodUsage - budget.surplus)

  const remainingSurplus = budget.surplus - usedFromSurplus
  const remainingNoLectivas = budget.noLectivas - usedFromNoLectivas

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <div className="header-info">
          <img src={logo} alt="IC Logo" className="logo-header" />
          <div className="header-text">
            <h1>{profile?.nombre || 'Mi Perfil Docente'}</h1>
            <p className="header-subtitle">
              {uniqueSubjects.join(', ')} {uniqueSubjects.length > 0 && '•'} {clasesCount} Bloques de Clase
            </p>
            <div className="header-date">{formatLongDate(new Date())}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="notification-bell-container">
            <button
              className="notification-bell"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              🔔
              {unreadCoverages.length > 0 && (
                <span className="notification-badge">{unreadCoverages.length}</span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h4>Notificaciones</h4>
                  {unreadCoverages.length > 0 && (
                    <button className="mark-read-btn" onClick={handleMarkNotificationsAsRead}>
                      Marcar todo como leído
                    </button>
                  )}
                </div>
                <div className="notifications-list">
                  {unreadCoverages.length === 0 ? (
                    <div className="empty-notifications">
                      No tienes notificaciones nuevas.
                    </div>
                  ) : (
                    unreadCoverages.slice(0, 15).map(c => (
                      <div key={c.id} className="notification-item unread">
                        <span className="notification-title">
                          Nueva cobertura asignada
                        </span>
                        <span className="notification-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span>📅 {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} • Bloque {BLOQUES.find(b => b.inicio.slice(0, 5) === c.horarios?.hora_inicio?.slice(0, 5))?.id || '?'}°</span>
                          <span>📚 {c.horarios?.asignaturas?.nombre || 'Administrativo'} en {c.horarios?.curso || '-'}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {profile?.cambio_clave_pendiente && (
            <button className="btn-edit" onClick={() => setIsPasswordModalOpen(true)}>
              Cambiar Clave
            </button>
          )}
          <button className="logout-button" onClick={() => supabase.auth.signOut()}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main>
        {profile?.cambio_clave_pendiente && (
          <div className="warning-banner" style={{
            background: '#fffbeb',
            color: '#92400e',
            padding: '1rem',
            borderRadius: '1rem',
            marginBottom: '1.5rem',
            border: '1px solid #fef3c7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>⚠️ Se recomienda cambiar tu contraseña predefinida por seguridad.</span>
            <button className="btn-edit" onClick={() => setIsPasswordModalOpen(true)} style={{ marginLeft: '1rem' }}>
              Cambiar Ahora
            </button>
          </div>
        )}

        <section className="teacher-stats">
          <div className="stat-card">
            <h3>Excedentes Usadas</h3>
            <p style={{ fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 800 }}>
              {usedFromSurplus} / {budget.surplus}
            </p>
            <small style={{ opacity: 0.7 }}>bloques pedagógicos</small>
          </div>
          <div className="stat-card">
            <h3>No Lectivas Usadas</h3>
            <p style={{ fontSize: '1.5rem', color: usedFromNoLectivas > budget.noLectivas ? '#ef4444' : 'inherit', fontWeight: 800 }}>
              {usedFromNoLectivas} / {budget.noLectivas}
            </p>
            <small style={{ opacity: 0.7 }}>bloques totales</small>
          </div>
          <div className="stat-card">
            <h3>Total Cubierto</h3>
            <p style={{ fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 800 }}>
              {totalCubiertoTotal} blq
            </p>
            <small style={{ opacity: 0.7 }}>historial acumulado</small>
          </div>
          <div className="stat-card">
            <h3>Esta Semana</h3>
            <p style={{ fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 800 }}>
              {totalCubiertoSemana} blq
            </p>
            <small style={{ opacity: 0.7 }}>coberturas actuales</small>
          </div>
          <div
            className="stat-card"
            style={{ border: '2px solid var(--accent)', cursor: 'pointer', transition: 'transform 0.15s' }}
            onClick={() => setIsPermitModalOpen(true)}
            title="Ver mis días administrativos"
          >
            <h3>Días Administrativos</h3>
            <p style={{ fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 800 }}>
              {permisos.filter(p => new Date(p.fecha).getFullYear() === new Date().getFullYear() && p.estado === 'aprobado').reduce((sum, p) => sum + parseFloat(p.valor_dia), 0)} / 6
            </p>
            <small style={{ color: 'var(--accent)', fontWeight: 600 }}>Ver detalle →</small>
          </div>
        </section>

        {coberturas.some(c => c.estado === 'pendiente') && (
          <section className="upcoming-coverages" style={{ marginBottom: '2.5rem' }}>
            <div className="section-header">
              <h2 style={{ marginBottom: '0.5rem' }}>Próximas Coberturas</h2>
              <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Reemplazos asignados por la administración.
              </p>
            </div>
            <div className="coverage-cards" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}>
              {coberturas.filter(c => c.estado === 'pendiente').map(c => (
                <div key={c.id} className="stat-card" style={{
                  textAlign: 'left',
                  borderLeft: '4px solid var(--accent)',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <span style={{
                      fontWeight: 700,
                      color: 'var(--accent)',
                      fontSize: '0.9rem',
                      background: 'var(--bg-soft)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.4rem'
                    }}>
                      Bloque {BLOQUES.find(b => b.inicio.slice(0, 5) === c.horarios?.hora_inicio?.slice(0, 5))?.id || '?'}°
                    </span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 500 }}>{c.fecha}</span>
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem' }}>Reemplazo a {c.ausente?.nombre}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text)' }}>
                      <span>📚 {c.horarios?.asignaturas?.nombre || 'Administrativo'}</span>
                      <span style={{ background: 'var(--bg-soft)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontSize: '0.75rem' }}>{c.horarios?.curso}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
                      <span>🕒 {c.horarios?.hora_inicio?.slice(0, 5)} - {c.horarios?.hora_fin?.slice(0, 5)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="schedule-container">
          <div className="schedule-header">
            <h2>Mi Horario Semanal</h2>
            <div className="legend">
              <span className="legend-item class">Clase</span>
              <span className="legend-item tc">TC</span>
              <span className="legend-item dupla">Dupla</span>
              <span className="legend-item apoderado">Apoderado</span>
              <span className="legend-item coverage">Cobertura</span>
              <span className="legend-item available">Disponible</span>
              <span className="legend-item" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>🚫 Bloqueado</span>
            </div>
          </div>

          <div className="grid-wrapper">
            <table className="schedule-grid">
              <thead>
                <tr>
                  <th>Bloque</th>
                  {DIAS.map(d => (
                    <th key={d.id}>{d.corto}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOQUES.filter(b => b.id < 10 || (b.id === 10 && horarios.some(h => h.hora_inicio.startsWith(b.inicio)))).map(b => (
                  <tr key={b.id}>
                    <td className="time-col">
                      <span className="block-num">{b.id}°</span>
                      <span className="time-range">{b.inicio}-{b.fin}</span>
                    </td>
                    {DIAS.map(d => {
                      const item = getHorarioAt(d.id, b.inicio)
                      const type = item?.tipo_bloque?.trim().toLowerCase()
                      const isTC = type === 'tc'
                      const isDupla = type === 'dupla'
                      const isApoderado = type === 'apoderado'
                      const isBloqueado = type === 'bloqueado'
                      const isClass = item && !isTC && !isDupla && !isApoderado && !isBloqueado
                      const isFridayEnd = d.id === 5 && b.id > 6

                      // Check for coverage in the current week
                      const { start, end } = getWeekRange(new Date().toISOString().split('T')[0])
                      const dayCoverage = coberturas.find(c =>
                        c.fecha >= start &&
                        c.fecha <= end &&
                        c.horarios?.hora_inicio?.startsWith(b.inicio) &&
                        new Date(c.fecha + 'T00:00:00').getDay() === (d.id === 7 ? 0 : d.id) &&
                        c.estado !== 'cancelada'
                      )

                      if (isFridayEnd || (b.id === 10 && !item)) {
                        return <td key={d.id} className="slot is-disabled"></td>
                      }

                      if (dayCoverage) {
                        return (
                          <td key={d.id} className="slot is-coverage">
                            <div className="item-content">
                              <span className="type-tag">CUBRIR</span>
                              <span className="subject">{dayCoverage.horarios?.asignaturas?.nombre || 'Administrativo'}</span>
                              <span className="course">{dayCoverage.horarios?.curso} ({dayCoverage.ausente?.nombre})</span>
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td key={d.id} className={`slot ${isFridayEnd ? 'is-disabled' : isBloqueado ? 'is-bloqueado' : isClass ? 'is-class' : isTC ? 'is-tc' : isDupla ? 'is-dupla' : isApoderado ? 'is-apoderado' : 'is-available'} ${item?.isInherited ? 'is-inherited' : ''}`}>
                          {isFridayEnd ? null : item ? (
                            <div className="item-content">
                              {isBloqueado ? (
                                <>
                                  <span className="subject" style={{ fontSize: '1.2rem' }}>🚫</span>
                                  {item.curso && <span className="course" style={{ opacity: 0.7 }}>{item.curso}</span>}
                                </>
                              ) : isClass ? (
                                <>
                                  {item?.isInherited && <span className="type-tag" style={{ background: '#f59e0b' }}>REEMPLAZO</span>}
                                  <span className="subject">{item.asignaturas?.nombre}</span>
                                  <span className="course">{item.curso} {item?.isInherited && `(${item.ausenteNombre})`}</span>
                                </>
                              ) : isTC ? (
                                <>
                                  <span className="tc-label">TRABAJO COLAB.</span>
                                  {item.curso && item.curso !== 'N/A' && <span className="course">{item.curso}</span>}
                                </>
                              ) : isDupla ? (
                                <>
                                  <span className="subject">DUPLA SICOSOCIAL</span>
                                  {item.curso && item.curso !== 'N/A' && <span className="course">{item.curso}</span>}
                                </>
                              ) : isApoderado ? (
                                <>
                                  <span className="subject">ATENCIÓN APODERADO</span>
                                  {item.curso && item.curso !== 'N/A' && <span className="course">{item.curso}</span>}
                                </>
                              ) : null}
                            </div>
                          ) : (
                            <span className="available-label">Disponible</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        {/* === HORAS NO LECTIVAS UTILIZADAS === */}
        {usedFromNoLectivas > 0 && (
          <section style={{ marginTop: '2.5rem' }}>
            <div className="section-header">
              <h2 style={{ marginBottom: '0.5rem' }}>📋 Horas No Lectivas Utilizadas para Cobertura</h2>
              <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Registro de los bloques que cubriste usando tu tiempo no lectivo. Puedes presentar este historial para solicitar la devolución de estas horas.
              </p>
            </div>
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: '1rem',
              boxShadow: 'var(--shadow)',
              overflow: 'hidden'
            }}>
              {/* Summary banner */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2340 100%)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total horas no lectivas usadas</p>
                  <p style={{ color: '#60a5fa', fontSize: '2rem', fontWeight: 900, margin: 0 }}>{usedFromNoLectivas} <span style={{ fontSize: '1rem', fontWeight: 400 }}>/ {budget.noLectivas} bloques</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponibles</p>
                  <p style={{ color: remainingNoLectivas < 0 ? '#ef4444' : '#34d399', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>
                    {Math.max(0, remainingNoLectivas)} bloques
                  </p>
                </div>
              </div>

              {/* Coverage rows that drew from No Lectivas pool */}
              {(() => {
                // Coberturas ordenadas por fecha, las primeras 'budget.surplus' son de excedentes
                const allActiveCoverages = coberturas
                  .filter(c => c.estado !== 'cancelada' && c.tipo === 'cobertura' && !c.contabilizada)
                  .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                const noLectivasCoverages = allActiveCoverages.slice(budget.surplus)
                
                if (noLectivasCoverages.length === 0) return null

                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-soft)', textAlign: 'left' }}>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.7 }}>Fecha</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.7 }}>Bloque</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.7 }}>Profesor Ausente</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.7 }}>Asignatura</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.7 }}>Curso</th>
                          <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.7 }}>Horario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {noLectivasCoverages.map((c, idx) => {
                          const bloqueNum = BLOQUES.find(b => b.inicio.slice(0,5) === c.horarios?.hora_inicio?.slice(0,5))?.id
                          const fechaFormatted = new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                          return (
                            <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.85rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{fechaFormatted}</td>
                              <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                <span style={{
                                  background: '#1e3a5f',
                                  color: '#60a5fa',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '0.4rem',
                                  fontWeight: 800,
                                  fontSize: '0.9rem'
                                }}>
                                  {bloqueNum ? `${bloqueNum}°` : '—'}
                                </span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{c.ausente?.nombre || '—'}</td>
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.9rem', opacity: 0.85 }}>{c.horarios?.asignaturas?.nombre || '—'}</td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span style={{
                                  background: 'var(--bg-soft)',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '0.3rem',
                                  fontSize: '0.8rem'
                                }}>{c.horarios?.curso || '—'}</span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', opacity: 0.7, whiteSpace: 'nowrap' }}>
                                {c.horarios?.hora_inicio?.slice(0,5)} – {c.horarios?.hora_fin?.slice(0,5)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-soft)', fontSize: '0.82rem', opacity: 0.7, fontStyle: 'italic' }}>
                      * Solo se muestran coberturas del período actual (no contabilizadas). Los bloques cubiertos con excedentes no aparecen aquí.
                    </div>
                  </div>
                )
              })()}
            </div>
          </section>
        )}

        {isPermitModalOpen && (
          <div className="modal-overlay" onClick={() => setIsPermitModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📅 Mis Días Administrativos</h3>
                <button className="btn-close" type="button" onClick={() => setIsPermitModalOpen(false)}>Cerrar</button>
              </div>

              {/* Summary row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', margin: '1.25rem 0' }}>
                {[
                  { label: 'Aprobados', estado: 'aprobado', color: '#22c55e' },
                  { label: 'Rechazados', estado: 'rechazado', color: '#ef4444' },
                  { label: 'Pendientes', estado: 'pendiente', color: '#f59e0b' },
                ].map(({ label, estado, color }) => {
                  const dias = permisos
                    .filter(p => new Date(p.fecha).getFullYear() === new Date().getFullYear() && p.estado === estado)
                    .reduce((sum, p) => sum + parseFloat(p.valor_dia), 0)
                  return (
                    <div key={estado} style={{
                      background: 'var(--bg-soft)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      textAlign: 'center',
                      borderTop: `3px solid ${color}`
                    }}>
                      <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6, margin: '0 0 0.25rem 0' }}>{label}</p>
                      <p style={{ fontSize: '1.75rem', fontWeight: 900, color, margin: 0 }}>{dias}</p>
                      <small style={{ opacity: 0.5 }}>días</small>
                    </div>
                  )
                })}
              </div>

              {/* Total bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-soft)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.25rem',
                marginBottom: '1.25rem',
                fontSize: '0.95rem'
              }}>
                <span style={{ opacity: 0.7 }}>Total aprobados este año</span>
                <strong style={{ fontSize: '1.1rem' }}>
                  {permisos.filter(p => new Date(p.fecha).getFullYear() === new Date().getFullYear() && p.estado === 'aprobado').reduce((sum, p) => sum + parseFloat(p.valor_dia), 0)} / 6 días
                </strong>
              </div>

              {/* Record list */}
              {permisos.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                  <p style={{ marginBottom: '0.5rem' }}>Sin registros aún</p>
                  <small>La administración cargará tus días cuando corresponda.</small>
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  {permisos.map(p => (
                    <div key={p.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border)',
                      gap: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <p style={{ fontWeight: 600, margin: '0 0 0.2rem 0', fontSize: '0.95rem' }}>
                          {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </p>
                        <small style={{ opacity: 0.6 }}>
                          {p.tipo_dia === 'completo' ? 'Día Completo' : p.tipo_dia === 'am' ? 'Media Jornada AM' : 'Media Jornada PM'}
                          {p.motivo && ` • ${p.motivo}`}
                        </small>
                      </div>
                      {getStatusBadge(p.estado)}
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                <button className="btn-cancel" onClick={() => setIsPermitModalOpen(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {isPasswordModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Cambiar Contraseña</h3>
                <button className="btn-close" type="button" onClick={() => setIsPasswordModalOpen(false)}>Cerrar</button>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar Contraseña</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsPasswordModalOpen(false)}>Cerrar</button>
                  <button type="submit" className="btn-save" disabled={passwordProcessing}>
                    {passwordProcessing ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </main>
    </div>
  )
}

export default TeacherDashboard
