import React, { useState, useEffect } from 'react';
import { BLOQUES, DIAS } from '../../services/constants';
import { getWeekRange, formatLongDate } from '../../services/dateUtils';
import { getDetailedBudget } from '../../services/budgetUtils';
import { MiniCalendar } from '../MiniCalendar';
import * as XLSX from 'xlsx';

const CoveragePlanner = ({ 
  supabase, 
  profesores, 
  allSchedules, 
  plannedCoverages, 
  activeCoverageDates,
  onRefresh
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [absentTeacherId, setAbsentTeacherId] = useState('');
  const [absentSchedule, setAbsentSchedule] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [processing, setProcessing] = useState(false);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryCoverages, setSummaryCoverages] = useState([]);

  useEffect(() => {
    if (absentTeacherId) {
      fetchAbsentTeacherSchedule();
    } else {
      setAbsentSchedule([]);
    }
  }, [absentTeacherId, selectedDate]);

  useEffect(() => {
    if (!absentTeacherId || absentSchedule.length === 0) {
      setAssignments({});
      return;
    }
    const newAssignments = {};
    absentSchedule.forEach(block => {
      const existing = plannedCoverages.find(c => 
        c.estado !== 'cancelada' &&
        c.fecha === selectedDate &&
        c.profesor_ausente_id === absentTeacherId &&
        String(c.horario_id) === String(block.id)
      );
      newAssignments[block.id] = existing ? existing.profesor_reemplazante_id : '';
    });

    setAssignments(prev => {
      let isDifferent = false;
      for (const key of absentSchedule.map(b => b.id)) {
        if (prev[key] !== newAssignments[key]) {
          isDifferent = true; 
          break;
        }
      }
      return isDifferent ? { ...prev, ...newAssignments } : prev;
    });
  }, [absentSchedule, plannedCoverages, selectedDate, absentTeacherId]);

  async function fetchAbsentTeacherSchedule() {
    setPlannerLoading(true);
    try {
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const diaSemana = dateObj.getDay() || 7; // Convert 0 (Sun) to 7 if needed, but handled below
      
      if (diaSemana === 0 || diaSemana === 6) {
        setAbsentSchedule([]);
        return;
      }

      const { data: schedule, error } = await supabase
        .from('horarios')
        .select('*, asignaturas(nombre)')
        .eq('profesor_id', absentTeacherId)
        .eq('dia_semana', diaSemana)
        .order('hora_inicio');
      
      if (error) throw error;

      // Filter logic (Friday 6 blocks, no block 10, etc.)
      const filtered = (schedule || []).filter(s => {
        const block = BLOQUES.find(b => b.inicio.startsWith(s.hora_inicio.slice(0,5)));
        if (!block) return false;
        if (diaSemana === 5 && block.id > 6) return false;
        if (block.id === 10) return false;
        // Strict filter: only 'clase' blocks are coverable
        return s.tipo_bloque === 'clase';
      });

      setAbsentSchedule(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setPlannerLoading(false);
    }
  }

  const getAvailableTeachers = (horaInicio) => {
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const diaSemana = dateObj.getDay() || 7;
    const teachersWorkingToday = new Set(allSchedules.filter(s => s.dia_semana === diaSemana).map(s => s.profesor_id));
    const teachersWithAnySchedule = new Set(allSchedules.map(s => s.profesor_id));

    const busyIds = allSchedules
      .filter(s => {
        const d = DIAS.find(day => day.id === s.dia_semana);
        const selectedDayShort = new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {weekday: 'short'}).toUpperCase().slice(0,2);
        if (d?.corto === selectedDayShort && s.hora_inicio === horaInicio) {
          const isApoderadoAsignatura = s.asignaturas?.nombre?.toLowerCase().includes('apoderado');
          if (s.tipo_bloque === 'apoderado' || isApoderadoAsignatura) {
             return false;
          }
          return ['clase', 'tc', 'dupla', 'administrativo', 'bloqueado'].includes(s.tipo_bloque);
        }
        return false;
      })
      .map(s => s.profesor_id);

    // Find all horario IDs that share the same hora_inicio (same time block across all teachers)
    // Use allSchedules (which is fully loaded) instead of relying on the nested join in plannedCoverages
    const sameTimeHorarioIds = allSchedules
      .filter(s => s.hora_inicio?.slice(0, 5) === horaInicio?.slice(0, 5))
      .map(s => s.id);

    // Exclude teachers already saved in DB as covering someone else at the same date+time
    const savedBusyIds = plannedCoverages
      .filter(c =>
        c.estado !== 'cancelada' &&
        c.fecha === selectedDate &&
        sameTimeHorarioIds.includes(c.horario_id) &&
        c.profesor_ausente_id !== absentTeacherId
      )
      .map(c => c.profesor_reemplazante_id);

    const selectedDayShort = new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {weekday: 'short'}).toUpperCase().slice(0,2);

    return profesores
      .filter(p => 
        p.activo && 
        p.rol === 'profesor' && 
        (teachersWorkingToday.has(p.id) || !teachersWithAnySchedule.has(p.id)) && 
        !busyIds.includes(p.id) && 
        !savedBusyIds.includes(p.id)
      )
      .map(p => {
        const { start, end } = getWeekRange(selectedDate);
        const weekCount = plannedCoverages.filter(c => 
          c.profesor_reemplazante_id === p.id && 
          c.estado !== 'cancelada' &&
          c.fecha >= start && 
          c.fecha <= end
        ).length;

        const budget = getDetailedBudget(p.horas_excedentes, p.horas_no_lectivas);
        const remaining = budget.total - weekCount;

        const hasApoderado = allSchedules.some(s => {
          const d = DIAS.find(day => day.id === s.dia_semana);
          const isApoderadoAsignatura = s.asignaturas?.nombre?.toLowerCase().includes('apoderado');
          return d?.corto === selectedDayShort && 
                 s.hora_inicio === horaInicio && 
                 s.profesor_id === p.id && 
                 (s.tipo_bloque === 'apoderado' || isApoderadoAsignatura);
        });

        const statusLabel = hasApoderado ? 'Atención de apoderados' : 'Libre';

        return { ...p, weekCount, budget, remaining, isOverSurplus: weekCount >= budget.surplus, statusLabel };
      });
  };

  const handleSaveCoverages = async () => {
    const entries = [];
    const overBudget = [];
    const managedHorarioIds = absentSchedule.map(b => b.id);

    for (const [horarioId, subId] of Object.entries(assignments)) {
      if (!subId) continue;
      const block = absentSchedule.find(b => String(b.id) === String(horarioId));
      if (!block) continue;

      const available = getAvailableTeachers(block.hora_inicio);
      const teacher = available.find(p => p.id === subId);
      
      if (teacher && teacher.remaining < 1) overBudget.push(teacher.nombre);

      entries.push({
        profesor_ausente_id: absentTeacherId,
        profesor_reemplazante_id: subId,
        fecha: selectedDate,
        horario_id: horarioId,
        estado: 'pendiente',
        tipo: 'cobertura'
      });
    }

    if (overBudget.length > 0) {
      const uniqueNames = [...new Set(overBudget)];
      if (!confirm(`Advertencia: ${uniqueNames.join(', ')} superará(n) su presupuesto semanal. ¿Continuar?`)) return;
    }

    setProcessing(true);
    try {
      if (managedHorarioIds.length > 0) {
        await supabase
          .from('coberturas')
          .delete()
          .eq('fecha', selectedDate)
          .eq('profesor_ausente_id', absentTeacherId)
          .in('horario_id', managedHorarioIds);
      }
      
      if (entries.length > 0) {
        const { error } = await supabase.from('coberturas').insert(entries);
        if (error) throw error;
      }

      onRefresh();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const fetchDailySummary = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase
        .from('coberturas')
        .select('*, ausente:profesores!profesor_ausente_id(nombre), reemplazo:profesores!profesor_reemplazante_id(nombre), horarios(*, asignaturas(nombre))')
        .eq('fecha', selectedDate)
        .eq('tipo', 'cobertura')
        .neq('estado', 'cancelada');
      
      if (error) throw error;
      setSummaryCoverages((data || []).sort((a,b) => (a.horarios?.bloque_id || 0) - (b.horarios?.bloque_id || 0)));
      setIsSummaryModalOpen(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCoverage = async (cov) => {
    if (!confirm('¿Eliminar esta cobertura?')) return;
    try {
      const { error } = await supabase.from('coberturas').delete().eq('id', cov.id);
      if (error) throw error;
      setSummaryCoverages(prev => prev.filter(c => c.id !== cov.id));
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadExcel = () => {
    const data = summaryCoverages.map(cov => {
      const blockId = BLOQUES.find(b => b.inicio.startsWith(cov.horarios?.hora_inicio?.slice(0,5)))?.id || cov.horarios?.bloque_id;
      return {
        'Bloque': `${blockId}°`,
        'Ausente': cov.ausente?.nombre,
        'Reemplazo': cov.reemplazo?.nombre,
        'Asignatura': cov.horarios?.asignaturas?.nombre || 'Administrativo',
        'Curso': cov.horarios?.curso || '-'
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coberturas");
    XLSX.writeFile(wb, `Coberturas_${selectedDate}.xlsx`);
  };

  return (
    <section className="coverage-planner">
      <div className="planner-header">
        <h2>Planificación de Coberturas</h2>
        <p>Define reemplazos bloque por bloque para ausencias programadas o licencias.</p>
      </div>

      <div className="planner-layout">
        <aside className="planner-sidebar">
          <MiniCalendar 
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            activeDates={activeCoverageDates}
          />
          <div className="stat-card" style={{ width: '100%', marginTop: '1rem' }}>
            <h3>Resumen del Día</h3>
            <button className="btn-save" style={{ width: '100%', marginTop: '0.5rem' }} onClick={fetchDailySummary}>
              Ver Coberturas del Día
            </button>
          </div>

          <div className="stat-card" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📊</span> Resumen Semanal
            </h3>
            <div className="weekly-ranking" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-soft)' }}>
                    <th style={{ padding: '0.5rem 0' }}>Profesor</th>
                    <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Blq</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const { start, end } = getWeekRange(selectedDate);
                    const summary = profesores
                      .filter(p => p.rol === 'profesor')
                      .map(p => {
                        const count = plannedCoverages.filter(c => 
                          c.profesor_reemplazante_id === p.id && 
                          c.estado !== 'cancelada' &&
                          c.fecha >= start && 
                          c.fecha <= end &&
                          c.tipo === 'cobertura'
                        ).length;
                        return { nombre: p.nombre, count };
                      })
                      .filter(p => p.count > 0)
                      .sort((a, b) => b.count - a.count);

                    if (summary.length === 0) return (
                      <tr>
                        <td colSpan="2" style={{ padding: '1rem 0', textAlign: 'center', opacity: 0.6 }}>No hay coberturas esta semana</td>
                      </tr>
                    );

                    return summary.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.6rem 0', color: 'var(--text)', fontWeight: '500' }}>{p.nombre}</td>
                        <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: '800', color: 'var(--accent)' }}>{p.count}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic' }}>
              * Solo incluye coberturas agendadas.
            </p>
          </div>
        </aside>

        <main className="planner-main">
          <div className="planner-controls">
            <div className="form-group">
              <label>Profesor Ausente</label>
              <select value={absentTeacherId} onChange={e => setAbsentTeacherId(e.target.value)}>
                <option value="">Seleccionar profesor...</option>
                {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn-save" onClick={handleSaveCoverages} disabled={processing || !absentTeacherId || absentSchedule.length === 0}>
                {processing ? 'Guardando...' : 'Guardar Planificación'}
              </button>
            </div>
          </div>

          <div className="planner-content" style={{ marginTop: '2rem' }}>
            {plannerLoading ? (
              <p>Cargando disponibilidad...</p>
            ) : absentTeacherId && absentSchedule.length > 0 ? (
              <div className="planner-blocks">
                {absentSchedule.map(block => {
                  const available = getAvailableTeachers(block.hora_inicio);
                  return (
                    <div key={block.id} className="block-assignment-card">
                      <div className="block-info">
                        <span className="block-num">Bloque {BLOQUES.find(b => b.inicio.startsWith(block.hora_inicio.slice(0,5)))?.id}</span>
                        <span className="block-time">{block.hora_inicio.slice(0,5)}</span>
                      </div>
                      <div className="class-info">
                        <h4>{block.asignaturas?.nombre || 'Administrativo'}</h4>
                        <p>{block.curso || '-'}</p>
                      </div>
                      <select 
                        value={assignments[block.id] || ''} 
                        onChange={e => setAssignments({...assignments, [block.id]: e.target.value})}
                      >
                        <option value="">Sin reemplazo</option>
                        {available.map(p => (
                          <option key={p.id} value={p.id} style={{ color: p.isOverSurplus ? 'red' : 'inherit' }}>
                            {p.nombre} ({p.statusLabel}) ({p.remaining} blq)
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>{absentTeacherId ? 'No hay clases para cubrir este día.' : 'Selecciona un profesor y fecha.'}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {isSummaryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Coberturas para {selectedDate}</h3>
              <button className="btn-close" onClick={() => setIsSummaryModalOpen(false)}>Cerrar</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <button className="btn-edit" onClick={handleDownloadExcel} disabled={summaryCoverages.length === 0}>
                Descargar Excel
              </button>
            </div>
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Bloque</th>
                  <th>Ausente</th>
                  <th>Reemplazo</th>
                  <th>Asignatura</th>
                  <th>Curso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {summaryCoverages.map(c => {
                  const blockId = BLOQUES.find(b => b.inicio.startsWith(c.horarios?.hora_inicio?.slice(0,5)))?.id || c.horarios?.bloque_id;
                  return (
                    <tr key={c.id}>
                      <td>{blockId}°</td>
                      <td>{c.ausente?.nombre}</td>
                      <td>{c.reemplazo?.nombre}</td>
                      <td>{c.horarios?.asignaturas?.nombre}</td>
                      <td>{c.horarios?.curso || '-'}</td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDeleteCoverage(c)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default CoveragePlanner;
