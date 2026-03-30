import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { BLOQUES, DIAS } from '../../services/constants';
import { getWeekRange } from '../../services/dateUtils';
import { getDetailedBudget } from '../../services/budgetUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ScheduleEditor = ({ supabase, profesores, asignaturas }) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [teacherCoverages, setTeacherCoverages] = useState([]);
  const [totalCoverageUsage, setTotalCoverageUsage] = useState(0);
  const [historicalUsage, setHistoricalUsage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef(null);
  const exportRef = useRef(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [newBlock, setNewBlock] = useState({
    asignatura_id: '',
    tipo_bloque: 'clase',
    curso: '',
    dia_semana: 1,
    bloque_id: 1
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedTeacherId) {
      fetchTeacherSchedule();
    }
  }, [selectedTeacherId]);

  async function fetchTeacherSchedule() {
    setLoading(true);
    try {
      const { data: schedule, error: sError } = await supabase
        .from('horarios')
        .select('*, asignaturas(nombre)')
        .eq('profesor_id', selectedTeacherId);
      
      if (sError) throw sError;
      setTeacherSchedule(schedule || []);

      const { start, end } = getWeekRange(new Date().toISOString().split('T')[0]);
      const { data: coverages, error: cError } = await supabase
        .from('coberturas')
        .select('*, ausente:profesores!profesor_ausente_id(nombre), horarios(*, asignaturas(nombre))')
        .eq('profesor_reemplazante_id', selectedTeacherId)
        .gte('fecha', start)
        .lte('fecha', end)
        .eq('tipo', 'cobertura')
        .neq('estado', 'cancelada');
      
      if (cError) throw cError;
      setTeacherCoverages(coverages || []);

      const { data: currentPeriodUsage, error: countError } = await supabase
        .from('coberturas')
        .select('*', { count: 'exact', head: true })
        .eq('profesor_reemplazante_id', selectedTeacherId)
        .eq('tipo', 'cobertura')
        .eq('contabilizada', false)
        .neq('estado', 'cancelada');
      
      if (countError) throw countError;
      setTotalCoverageUsage(currentPeriodUsage || 0);

      const { count: historicalCount, error: hError } = await supabase
        .from('coberturas')
        .select('*', { count: 'exact', head: true })
        .eq('profesor_reemplazante_id', selectedTeacherId)
        .eq('tipo', 'cobertura')
        .neq('estado', 'cancelada');
      
      if (hError) throw hError;
      setHistoricalUsage(historicalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate Stats (matching TeacherDashboard logic)
  const selectedProfessor = profesores.find(p => p.id === selectedTeacherId);
  const budget = selectedProfessor ? getDetailedBudget(selectedProfessor.horas_excedentes, selectedProfessor.horas_no_lectivas) : { surplus: 0, noLectivas: 0, total: 0 };
  
  const currentWeekCount = teacherCoverages.length;
  const usedFromSurplus = Math.min(totalCoverageUsage, budget.surplus);
  const usedFromNoLectivas = Math.max(0, totalCoverageUsage - budget.surplus);

  const getTeacherHorarioAt = (diaId, horaInicio) => {
    const own = teacherSchedule.find(h => h.dia_semana === diaId && h.hora_inicio.slice(0, 5) === horaInicio.slice(0, 5));
    if (own) return own;

    const coverage = teacherCoverages.find(c => {
      const cDate = new Date(c.fecha + 'T00:00:00');
      const cDay = cDate.getDay() || 7;
      return cDay === diaId && c.horarios?.hora_inicio?.slice(0, 5) === horaInicio.slice(0, 5);
    });

    if (coverage) {
      return {
        ...coverage.horarios,
        tipo: coverage.tipo,
        isInherited: true,
        ausenteNombre: coverage.ausente?.nombre
      };
    }
    return null;
  };

  const handleSaveBlock = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const targetBlock = BLOQUES.find(b => b.id === Number(newBlock.bloque_id));
      const payload = {
        profesor_id: selectedTeacherId,
        asignatura_id: ['clase', 'administrativo'].includes(newBlock.tipo_bloque) ? newBlock.asignatura_id : null,
        tipo_bloque: newBlock.tipo_bloque,
        curso: newBlock.curso || null,
        dia_semana: Number(newBlock.dia_semana),
        hora_inicio: targetBlock.inicio,
        hora_fin: targetBlock.fin
      };

      if (editingBlock?.item) {
        const { error } = await supabase.from('horarios').update(payload).eq('id', editingBlock.item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('horarios').insert([payload]);
        if (error) throw error;
      }

      alert('Bloque guardado');
      setIsModalOpen(false);
      fetchTeacherSchedule();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!confirm('¿Eliminar bloque?')) return;
    setProcessing(true);
    try {
      const { error } = await supabase.from('horarios').delete().eq('id', editingBlock.item.id);
      if (error) throw error;
      setIsModalOpen(false);
      fetchTeacherSchedule();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getBlockLabel = (item) => {
    if (!item) return '';
    if (item.asignaturas?.nombre) return item.asignaturas.nombre;
    const typeLabelMap = {
      'apoderado': 'Atención Apoderados',
      'dupla': 'Dupla',
      'tc': 'Trabajo Colaborativo',
      'administrativo': 'Administrativo',
      'bloqueado': 'Bloqueado'
    };
    return typeLabelMap[item.tipo_bloque] || item.tipo_bloque;
  };

  const exportToExcel = (prof, schedule) => {
    const headers = ["Bloque", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    const rows = BLOQUES.map(b => {
      const row = [`${b.id}° (${b.inicio.slice(0, 5)})`];
      DIAS.forEach(d => {
        const item = schedule.find(h => h.dia_semana === d.id && h.hora_inicio.slice(0, 5) === b.inicio.slice(0, 5));
        if (item) {
          const label = getBlockLabel(item);
          row.push(`${label}${item.curso ? ` (${item.curso})` : ''}`);
        } else {
          row.push('');
        }
      });
      return row;
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Horario");
    XLSX.writeFile(wb, `Horario_${prof.nombre}.xlsx`);
  };

  const exportToPDF = (prof, schedule) => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text("Instituto Comercial Puerto Montt", 14, 15);
    
    doc.setFontSize(12);
    doc.setTextColor(52, 73, 94);
    doc.text(`Horario Semanal: ${prof.nombre}`, 14, 22);

    const headers = [["Bloque", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]];
    const data = BLOQUES.map(b => {
      const row = [`${b.id}° (${b.inicio.slice(0, 5)})`];
      DIAS.forEach(d => {
        const item = schedule.find(h => h.dia_semana === d.id && h.hora_inicio.slice(0, 5) === b.inicio.slice(0, 5));
        if (item) {
          const label = getBlockLabel(item);
          row.push(`${label}${item.curso ? `\n(${item.curso})` : ''}`);
        } else {
          row.push('');
        }
      });
      return row;
    });

    autoTable(doc, {
      startY: 28,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle' },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 244, 248] } }
    });

    doc.save(`Horario_${prof.nombre}.pdf`);
  };

  const handleExportAll = async () => {
    setProcessing(true);
    try {
      const { data: allSchedules, error } = await supabase
        .from('horarios')
        .select('*, asignaturas(nombre)');
      if (error) throw error;
      
      const wb = XLSX.utils.book_new();
      const activeProfs = profesores.filter(p => allSchedules.some(s => s.profesor_id === p.id));
      
      if (activeProfs.length === 0) {
        alert("No hay horarios registrados para exportar.");
        return;
      }

      activeProfs.forEach(p => {
        const pSchedule = allSchedules.filter(s => s.profesor_id === p.id);
        const headers = ["Bloque", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
        const rows = BLOQUES.map(b => {
          const row = [`${b.id}° (${b.inicio.slice(0, 5)})`];
          DIAS.forEach(d => {
            const item = pSchedule.find(h => h.dia_semana === d.id && h.hora_inicio.slice(0, 5) === b.inicio.slice(0, 5));
            if (item) {
              const label = getBlockLabel(item);
              row.push(`${label}${item.curso ? ` (${item.curso})` : ''}`);
            } else {
              row.push('');
            }
          });
          return row;
        });
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const sheetName = p.nombre.replace(/[\\/?*[\]]/g, '').substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName || `Profesor ${p.id.slice(0,4)}`);
      });
      
      XLSX.writeFile(wb, "Horarios_Completos_Instituto.xlsx");
    } catch (err) {
      console.error("Error Excel:", err);
      alert("Error al exportar Excel: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const exportAllToPDF = async () => {
    setProcessing(true);
    try {
      const { data: allSchedules, error } = await supabase
        .from('horarios')
        .select('*, asignaturas(nombre)');
      if (error) throw error;
      
      const doc = new jsPDF('landscape');
      const activeProfs = profesores.filter(p => allSchedules.some(s => s.profesor_id === p.id));
      
      if (activeProfs.length === 0) {
        alert("No hay horarios activos para exportar.");
        return;
      }

      activeProfs.forEach((p, index) => {
        if (index > 0) doc.addPage();
        const pSchedule = allSchedules.filter(s => s.profesor_id === p.id);
        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text("Instituto Comercial Puerto Montt", 14, 15);
        doc.setFontSize(12);
        doc.setTextColor(52, 73, 94);
        doc.text(`Horario Semanal: ${p.nombre}`, 14, 22);
        doc.setFontSize(10);
        doc.text(`Página ${index + 1} de ${activeProfs.length}`, 260, 22, { align: 'right' });

        const headers = [["Bloque", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]];
        const data = BLOQUES.map(b => {
          const row = [`${b.id}° (${b.inicio.slice(0, 5)})`];
          DIAS.forEach(d => {
            const item = pSchedule.find(h => h.dia_semana === d.id && h.hora_inicio.slice(0, 5) === b.inicio.slice(0, 5));
            if (item) {
              const label = getBlockLabel(item);
              row.push(`${label}${item.curso ? `\n(${item.curso})` : ''}`);
            } else {
              row.push('');
            }
          });
          return row;
        });

        autoTable(doc, {
          startY: 28,
          head: headers,
          body: data,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: 255, halign: 'center' },
          styles: { fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle' },
          columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 244, 248] } }
        });
      });
      
      doc.save("Horarios_Completos_Instituto.pdf");
    } catch (err) {
      console.error("Error PDF:", err);
      alert("Error al exportar PDF: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (dia, bloque, item) => {
    setEditingBlock({ dia, bloque, item });
    setNewBlock({
      asignatura_id: item?.asignatura_id || '',
      tipo_bloque: item?.tipo_bloque || 'clase',
      curso: item?.curso || '',
      dia_semana: dia,
      bloque_id: bloque
    });
    setIsModalOpen(true);
  };

  return (
    <section className="horarios-section">
      <div className="planner-header">
        <h2>Gestión de Horarios Docentes</h2>
        <p>Visualiza y modifica la carga horaria semanal de cualquier profesor.</p>
      </div>

      <div className="planner-controls" style={{ background: 'var(--bg-soft)', padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="form-group" style={{ maxWidth: '400px' }}>
          <label>Seleccionar Profesor</label>
          <div className="searchable-dropdown" ref={dropdownRef}>
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Escribe para buscar profesor..." 
                value={searchTerm || (profesores.find(p => p.id === selectedTeacherId)?.nombre || '')}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                  if (!e.target.value) setSelectedTeacherId('');
                }}
                onFocus={() => setIsOpen(true)}
                style={{ paddingLeft: '3.5rem' }}
              />
            </div>
            
            {isOpen && (
              <div className="dropdown-results">
                {profesores
                  .filter(p => !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(p => (
                    <div 
                      key={p.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setSelectedTeacherId(p.id);
                        setSearchTerm(p.nombre);
                        setIsOpen(false);
                      }}
                    >
                      {p.nombre}
                    </div>
                  ))
                }
                {profesores.filter(p => !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <div className="dropdown-item no-results">No se encontraron profesores</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="action-buttons" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <div className="export-dropdown" ref={exportRef}>
            <button className="primary" onClick={() => setIsExportOpen(!isExportOpen)}>
              📥 Descargar...
            </button>
            {isExportOpen && (
              <div className="export-menu">
                <div className="export-option" onClick={() => { exportToExcel(profesores.find(p => p.id === selectedTeacherId), teacherSchedule); setIsExportOpen(false); }} hidden={!selectedTeacherId}>
                  <span className="icon">📊</span> Este Horario (Excel)
                </div>
                <div className="export-option" onClick={() => { exportToPDF(profesores.find(p => p.id === selectedTeacherId), teacherSchedule); setIsExportOpen(false); }} hidden={!selectedTeacherId}>
                  <span className="icon">📄</span> Este Horario (PDF)
                </div>
                <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} hidden={!selectedTeacherId}></div>
                <div className="export-option" onClick={() => { handleExportAll(); setIsExportOpen(false); }}>
                  <span className="icon">📚</span> Todos los Horarios (Excel)
                </div>
                <div className="export-option" onClick={() => { exportAllToPDF(); setIsExportOpen(false); }}>
                  <span className="icon">📂</span> Todos los Horarios (PDF)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTeacherId && (
        <div className="schedule-container">
          <div className="teacher-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Excedentes Usadas</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent)' }}>{usedFromSurplus} / {budget.surplus}</p>
            </div>
            <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>No Lectivas Usadas</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: usedFromNoLectivas > budget.noLectivas ? '#ef4444' : 'inherit' }}>{usedFromNoLectivas} / {budget.noLectivas}</p>
            </div>
            <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Total Histórico</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>{historicalUsage} blq</p>
            </div>
            <div className="stat-card" style={{ padding: '1rem', textAlign: 'center', border: '2px solid var(--accent)' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Esta Semana</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent)' }}>{currentWeekCount} blq</p>
            </div>
          </div>
          <div className="grid-wrapper">
            <table className="schedule-grid">
              <thead>
                <tr>
                  <th>Bloque</th>
                  {DIAS.map(d => <th key={d.id}>{d.corto}</th>)}
                </tr>
              </thead>
              <tbody>
                {BLOQUES.map(b => (
                  <tr key={b.id}>
                    <td className="time-col">
                      <span className="block-number">{b.id}°</span>
                      <span className="block-time">{b.inicio.slice(0, 5)} - {b.fin.slice(0, 5)}</span>
                    </td>
                    {DIAS.map(d => {
                      const item = getTeacherHorarioAt(d.id, b.inicio);
                      const isFridayEnd = d.id === 5 && b.id > 6;
                      return (
                        <td 
                          key={d.id} 
                          className={`slot ${isFridayEnd ? 'is-disabled' : item ? 'is-class' : 'is-available'} ${item?.isInherited ? 'is-inherited' : ''}`}
                          onClick={() => !isFridayEnd && !item?.isInherited && openEditModal(d.id, b.id, item)}
                        >
                          {item ? (
                            <div className="item-content">
                              <span className="subject">
                                {getBlockLabel(item)}
                              </span>
                              {item.curso && <span className="course">{item.curso}</span>}
                            </div>
                          ) : !isFridayEnd && <span className="available-label">+</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingBlock.item ? 'Editar' : 'Añadir'} Bloque</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>Cerrar</button>
            </div>
            <form onSubmit={handleSaveBlock}>
              <div className="form-group">
                <label>Tipo</label>
                <select value={newBlock.tipo_bloque} onChange={e => setNewBlock({...newBlock, tipo_bloque: e.target.value})}>
                  <option value="clase">Clase</option>
                  <option value="tc">TC</option>
                  <option value="dupla">Dupla</option>
                  <option value="apoderado">Atención Apoderado</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>
              {['clase', 'administrativo'].includes(newBlock.tipo_bloque) && (
                <div className="form-group">
                  <label>Asignatura</label>
                  <select value={newBlock.asignatura_id} onChange={e => setNewBlock({...newBlock, asignatura_id: e.target.value})} required>
                    <option value="">Seleccionar...</option>
                    {asignaturas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Curso / Detalle</label>
                <input type="text" value={newBlock.curso || ''} onChange={e => setNewBlock({...newBlock, curso: e.target.value})} />
              </div>
              <div className="modal-actions">
                {editingBlock.item && <button type="button" className="btn-delete" onClick={handleDeleteBlock}>Eliminar</button>}
                <button type="submit" className="btn-save" disabled={processing}>{processing ? '...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default ScheduleEditor;
