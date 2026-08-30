import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { BLOQUES, DIAS } from '../services/constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AssistantScheduleViewer = ({ supabase }) => {
  const [activeSubTab, setActiveSubTab] = useState('docentes');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [profesores, setProfesores] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [teacherCoverages, setTeacherCoverages] = useState([]);
  const [courseSchedule, setCourseSchedule] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    fetchBaseData();
  }, []);

  async function fetchBaseData() {
    try {
      const { data: profs } = await supabase.from('profesores').select('*').order('nombre');
      setProfesores((profs || []).filter(p => p.rol === 'profesor' || p.rol === 'admin'));
      
      let scheds = [];
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('horarios')
          .select('*, asignaturas(nombre), profesores(nombre)')
          .range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          scheds = [...scheds, ...data];
        }
        if (!data || data.length < 1000) {
          hasMore = false;
        }
        page++;
      }
      setAllSchedules(scheds);
      
      const allCourses = [];
      scheds.forEach(s => {
        if (s.curso) {
          s.curso.split(/[\/\-]/).forEach(c => allCourses.push(c.trim()));
        }
      });
      const uniqueCourses = [...new Set(allCourses)].filter(Boolean).sort();
      setCursos(uniqueCourses);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
      if (exportRef.current && !exportRef.current.contains(event.target)) setIsExportOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeSubTab === 'docentes' && selectedTeacherId) {
      const ts = allSchedules.filter(s => s.profesor_id === selectedTeacherId);
      setTeacherSchedule(ts);
      // Fetch coverages just for visual completion
      supabase.from('coberturas').select('*, ausente:profesores!profesor_ausente_id(nombre), horarios(*, asignaturas(nombre))')
        .eq('profesor_reemplazante_id', selectedTeacherId)
        .eq('tipo', 'cobertura')
        .neq('estado', 'cancelada')
        .then(({ data }) => setTeacherCoverages(data || []));
    }
  }, [selectedTeacherId, activeSubTab, allSchedules]);

  useEffect(() => {
    if (activeSubTab === 'cursos' && selectedCourse) {
      const cs = allSchedules.filter(s => {
        if (!s.curso) return false;
        const courses = s.curso.split(/[\/\-]/).map(c => c.trim());
        return courses.includes(selectedCourse);
      });
      setCourseSchedule(cs);
    }
  }, [selectedCourse, activeSubTab, allSchedules]);

  const getTeacherHorarioAt = (diaId, horaInicio) => {
    const coverage = teacherCoverages.find(c => {
      const cDate = new Date(c.fecha + 'T00:00:00');
      const cDay = cDate.getDay() || 7;
      return cDay === diaId && c.horarios?.hora_inicio?.slice(0, 5) === horaInicio.slice(0, 5);
    });
    if (coverage) return { ...coverage.horarios, tipo: coverage.tipo, isInherited: true, ausenteNombre: coverage.ausente?.nombre };
    return teacherSchedule.find(h => h.dia_semana === diaId && h.hora_inicio.slice(0, 5) === horaInicio.slice(0, 5));
  };

  const getCourseHorarioAt = (diaId, horaInicio) => {
    return courseSchedule.find(h => h.dia_semana === diaId && h.hora_inicio.slice(0, 5) === horaInicio.slice(0, 5));
  };

  const getBlockLabel = (item) => {
    if (!item) return '';
    if (item.asignaturas?.nombre) return item.asignaturas.nombre;
    const typeLabelMap = { 
      'apoderado': 'Atención Apoderados', 
      'dupla': 'Dupla', 
      'tc': 'Trabajo Colaborativo', 
      'administrativo': 'Administrativo', 
      'bloqueado': 'Bloqueado',
      'pie_aula': 'PIE: En Aula',
      'pie_aula_recursos': 'PIE: Aula Recursos',
      'pie_tc': 'PIE: Trabajo Colab.',
      'pie_coordinacion': 'PIE: Coordinación',
      'orientacion': 'Orientación'
    };
    return typeLabelMap[item.tipo_bloque] || item.tipo_bloque;
  };

  return (
    <section className="horarios-section" style={{ marginTop: '2rem' }}>
      <div className="planner-header">
        <h2>Consulta de Horarios</h2>
        <p>Visualiza el horario semanal de docentes y cursos.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border)', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveSubTab('docentes')}
          style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem 0.5rem 0 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', background: activeSubTab === 'docentes' ? 'var(--accent)' : 'var(--bg-soft)', color: activeSubTab === 'docentes' ? 'white' : 'var(--text-soft)', transition: 'all 0.2s ease' }}
        >
          📅 Horarios Docentes
        </button>
        <button
          onClick={() => setActiveSubTab('cursos')}
          style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem 0.5rem 0 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', background: activeSubTab === 'cursos' ? 'var(--accent)' : 'var(--bg-soft)', color: activeSubTab === 'cursos' ? 'white' : 'var(--text-soft)', transition: 'all 0.2s ease' }}
        >
          🎓 Horarios por Curso
        </button>
      </div>

      {activeSubTab === 'docentes' && (
        <>
          <div className="planner-controls" style={{ background: 'var(--bg-soft)', padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label>Seleccionar Profesor</label>
              <div className="searchable-dropdown" ref={dropdownRef}>
                <div className="search-bar">
                  <input 
                    type="text" placeholder="Buscar profesor..." 
                    value={searchTerm || (profesores.find(p => p.id === selectedTeacherId)?.nombre || '')}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); if (!e.target.value) setSelectedTeacherId(''); }}
                    onFocus={() => setIsOpen(true)}
                    style={{ paddingLeft: '3.5rem' }}
                  />
                </div>
                {isOpen && (
                  <div className="dropdown-results">
                    {profesores.filter(p => !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                      <div key={p.id} className="dropdown-item" onClick={() => { setSelectedTeacherId(p.id); setSearchTerm(p.nombre); setIsOpen(false); }}>{p.nombre}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedTeacherId && (
            <div className="schedule-container">
              <div className="grid-wrapper">
                <table className="schedule-grid">
                  <thead><tr><th>Bloque</th>{DIAS.map(d => <th key={d.id}>{d.corto}</th>)}</tr></thead>
                  <tbody>
                    {BLOQUES.map(b => (
                      <tr key={b.id}>
                        <td className="time-col"><span className="block-number">{b.id}°</span><span className="block-time">{b.inicio.slice(0, 5)} - {b.fin.slice(0, 5)}</span></td>
                        {DIAS.map(d => {
                          const item = getTeacherHorarioAt(d.id, b.inicio);
                          const isFridayEnd = d.id === 5 && b.id > 6;
                          return (
                            <td key={d.id} className={`slot ${isFridayEnd ? 'is-disabled' : item ? 'is-class' : 'is-available'} ${item?.isInherited ? 'is-inherited' : ''}`}>
                              {item ? (
                                <div className="item-content">
                                  <span className="subject">{getBlockLabel(item)}</span>
                                  {item.curso && <span className="course">{item.curso}</span>}
                                </div>
                              ) : !isFridayEnd && <span className="available-label">-</span>}
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
        </>
      )}

      {activeSubTab === 'cursos' && (
        <>
          <div className="planner-controls" style={{ background: 'var(--bg-soft)', padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label>Seleccionar Curso</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                <option value="">Seleccione...</option>
                {cursos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {selectedCourse && (
            <div className="schedule-container">
              <div className="grid-wrapper">
                <table className="schedule-grid">
                  <thead><tr><th>Bloque</th>{DIAS.map(d => <th key={d.id}>{d.corto}</th>)}</tr></thead>
                  <tbody>
                    {BLOQUES.map(b => (
                      <tr key={b.id}>
                        <td className="time-col"><span className="block-number">{b.id}°</span><span className="block-time">{b.inicio.slice(0, 5)} - {b.fin.slice(0, 5)}</span></td>
                        {DIAS.map(d => {
                          const item = getCourseHorarioAt(d.id, b.inicio);
                          const isFridayEnd = d.id === 5 && b.id > 6;
                          return (
                            <td key={d.id} className={`slot ${isFridayEnd ? 'is-disabled' : item ? 'is-class' : 'is-available'}`}>
                              {item ? (
                                <div className="item-content">
                                  <span className="subject">{getBlockLabel(item)}</span>
                                  {item.profesores?.nombre && <span className="course">{item.profesores.nombre}</span>}
                                </div>
                              ) : !isFridayEnd && <span className="available-label">-</span>}
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
        </>
      )}
    </section>
  );
};

export default AssistantScheduleViewer;
