import React from 'react';

const EFEMERIDES = {
  "01 de marzo": ["Día de la inclusión social y la no discriminación"],
  "08 de marzo": ["Día internacional de la mujer"],
  "14 de marzo": ["Día contra el ciberacoso"],
  "21 de marzo": ["Día internacional de la eliminación de la discriminación racial"],
  "22 de marzo": ["Día Mundial del Agua"],
  "01 de abril": ["Conmemoración de la Batalla de Mocopulli"],
  "02 de abril": ["Día de concienciación sobre el autismo"],
  "06 de abril": ["Día de la actividad física"],
  "07 de abril": ["Día de la educación rural"],
  "22 de abril": ["Día de la tierra"],
  "23 de abril": ["Día del libro, la lectura y el derecho de autor"],
  "25 de abril": ["Día internacional de la lucha contra el maltrato infantil"],
  "27 de abril": ["Día del carabinero(a)"],
  "29 de abril": ["Día de la convivencia escolar"],
  "08 de mayo": ["Día de la integridad en las comunidades educativas"],
  "11 de mayo": ["Día de las y los estudiantes"],
  "14 de mayo": ["Día de la concientización sobre el diagnóstico de apraxia del habla infantil"],
  "15 de mayo": ["Día internacional de las familias"],
  "17 de mayo": ["Día del Internet", "Día internacional del reciclaje", "Día internacional contra la homofobia, la transfobia y la bifobia"],
  "21 de mayo": ["Día de las glorias navales"],
  "22 de mayo": ["Día internacional de la Biodiversidad"],
  "23 de mayo": ["Día del patrimonio"],
  "28 de mayo": ["Día del juego"],
  "05 de junio": ["Día mundial del medio ambiente"],
  "12 de junio": ["Día internacional contra el trabajo infantil"],
  "19 de junio": ["Día mundial para prevención de abuso sexual"],
  "21 de junio": ["Día de los pueblos originarios"],
  "22 de junio": ["Día de la educación no sexista"],
  "26 de junio": ["Día nacional de la prevención del consumo de drogas"],
  "30 de junio": ["Día nacional del bombero voluntario"],
  "11 de julio": ["Día nacional del cobre"],
  "30 de julio": ["Dia internacional contra la trata de personas"],
  "14 de agosto": ["Día de los derechos del niño y la niña"],
  "26 de agosto": ["Día de la educación técnico profesional", "Día de las y los profesores normalistas", "Día de la técnico de educación parvularia"],
  "04 de septiembre": ["Día mundial de la salud sexual y reproductiva"],
  "05 de septiembre": ["Día de la mujer indígena"],
  "08 de septiembre": ["Día internacional de la alfabetización y día nacional de la educación de personas jóvenes y adultas"],
  "10 de septiembre": ["Día mundial para la prevención del suicidio"],
  "18 de septiembre": ["Fiestas patrias"],
  "21 de septiembre": ["Día internacional por la paz"],
  "23 de septiembre": ["Día internacional de las lenguas de señas"],
  "26 de septiembre": ["Día mundial de prevención del embarazo no planificado en la adolescencia"],
  "01 de octubre": ["Día de asistentes de la educación"],
  "04 de octubre": ["Día de la música chilena"],
  "09 de octubre": ["Día mundial de la salud mental"],
  "13 de octubre": ["Día de las y los educadores tradicionales"],
  "16 de octubre": ["Día del profesor y la profesora"],
  "19 de octubre": ["Día nacional de la Danza"],
  "23 de octubre": ["Día de la biblioteca escolar"],
  "30 de octubre": ["Día de las manipuladoras de alimentos"],
  "05 de noviembre": ["Día internacional contra la violencia y el acoso en la escuela", "Día mundial de concienciación sobre tsunami"],
  "06 de noviembre": ["Día nacional de la Antártica chilena"],
  "12 de noviembre": ["Día del diálogo y el debate"],
  "15 de noviembre": ["Día de los patrimonios de niños, niñas y adolescentes"],
  "18 de noviembre": ["Día del apoderado"],
  "19 de noviembre": ["Día mundial para la prevención de la violencia contra los niños y las niñas"],
  "20 de noviembre": ["Día de los derechos del niño y la niña"],
  "22 de noviembre": ["Día mundial en recuerdo de las víctimas de accidentes de trafico", "Día de la educación parvularia y de la educadora de párvulos"],
  "25 de noviembre": ["Día internacional de la eliminación de la violencia contra la mujer"],
  "01 de diciembre": ["Día mundial de la lucha contra el sida"],
  "03 de diciembre": ["Día internacional de las personas con discapacidad"],
  "10 de diciembre": ["Día de los derechos humanos"],
  "18 de diciembre": ["Día internacional de las personas migrantes"]
};

export function EfemerideWidget() {
  const today = new Date();
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const todayStr = `${String(today.getDate()).padStart(2, '0')} de ${months[today.getMonth()]}`;
  
  const efemerides = EFEMERIDES[todayStr];

  if (!efemerides) return null;

  return (
    <div className="efemeride-widget" style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginTop: '0.3rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
      <span>📌</span>
      <span>{efemerides.join(" | ")}</span>
    </div>
  );
}
