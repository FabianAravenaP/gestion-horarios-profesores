import React from 'react';

const WeeklyHistory = ({ history, loading }) => {
  return (
    <div className="weekly-history" style={{ marginTop: '3rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Historial de Cierres Semanales</h3>
      {loading ? (
        <p>Cargando historial...</p>
      ) : history.length === 0 ? (
        <p style={{ opacity: 0.6 }}>No hay cierres de semana registrados aún.</p>
      ) : (
        <div className="grid-wrapper">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Semana</th>
                <th>Fecha Cierre</th>
                <th>Bloques Totales</th>
                <th>Profesores</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Group by semana_inicio to show one row per week
                const grouped = history.reduce((acc, curr) => {
                  const key = `${curr.semana_inicio} - ${curr.semana_fin}`;
                  if (!acc[key]) acc[key] = { 
                    semana: key, 
                    fecha: curr.created_at, 
                    total: 0, 
                    count: 0,
                    profesores: []
                  };
                  acc[key].total += curr.total_bloques_semana;
                  acc[key].count += 1;
                  acc[key].profesores.push(curr.profesores?.nombre);
                  return acc;
                }, {});

                return Object.values(grouped).map((week, i) => (
                  <tr key={i}>
                    <td data-label="Semana" style={{ fontWeight: '600' }}>{week.semana}</td>
                    <td data-label="Cierre">
                      {new Date(week.fecha).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td data-label="Bloques" style={{ textAlign: 'center' }}>
                      <span className="badge info">{week.total} bloques</span>
                    </td>
                    <td data-label="Profesores" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                      {week.count} docentes procesados
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WeeklyHistory;
