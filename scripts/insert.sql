
DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'teresa.abello@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ABELLO BARRA TERESA', 'teresa.abello@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'constanza.aburto@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ABURTO RUIZ CONSTANZA ANDREA', 'constanza.aburto@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'judith.altamirano@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ALTAMIRANO CHAVEZ JUDITH ELIZA', 'judith.altamirano@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'marta.alvarado@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ALVARADO MARQUEZ MARTA INES', 'marta.alvarado@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'esteban.alvarez@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ALVAREZ ANGEL ESTEBAN ALONSO', 'esteban.alvarez@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'carmen.angel@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ANGEL GALLARDO CARMEN ETELVINA', 'carmen.angel@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'gladys.arevalo@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('AREVALO MUNOZ GLADYS ESTHER', 'gladys.arevalo@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'telma.asencio@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ASENCIO ROJEL TELMA ELIZABETH', 'telma.asencio@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'juan.balboa@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('BALBOA CAICO JUAN JOSE', 'juan.balboa@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'gloria.cardenas@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('CARDENAS MORAGA GLORIA XIMENA', 'gloria.cardenas@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'maria-cristina.cartes@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('CARTES DELGADO MARIA CRISTINA', 'maria-cristina.cartes@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'roberto.cosque@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('COSQUE GESSELL ROBERTO JAVIER', 'roberto.cosque@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'fernanda.farias@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('FARIAS ELORZA FERNANDA ALEJAND', 'fernanda.farias@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'pedro.galaz@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('GALAZ GONZALEZ PEDRO ENRIQUE', 'pedro.galaz@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'fanny.gallardo@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('GALLARDO LOYOLA FANNY DE LOURD', 'fanny.gallardo@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'jeronimo.gomez@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('GOMEZ GOMEZ JERONIMO YONATHAN', 'jeronimo.gomez@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'froilan.huaique@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('HUAIQUE CARDENAS FROILAN ROBER', 'froilan.huaique@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'claudio.ibanez@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('IBANEZ GOMEZ CLAUDIO MANUEL', 'claudio.ibanez@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'camila.miranda@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('MIRANDA GARRIDO CAMILA DENISSE', 'camila.miranda@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'olga.montecinos@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('MONTECINOS ANTECAO OLGA PAMELA', 'olga.montecinos@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'carmen.ojeda@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('OJEDA VIDAL CARMEN GLORIA', 'carmen.ojeda@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'juanjose.orellana@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ORELLANA CARDENAS JUAN JOSE', 'juanjose.orellana@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'lorena.oyarzo@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('OYARZO HIDALGO LORENA ANGELICA', 'lorena.oyarzo@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'vanessa.oyarzo@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('OYARZO MANSILLA VANESSA BETZAB', 'vanessa.oyarzo@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'constanza.pardo@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('PARDO DELGADO CONSTANZA CATALI', 'constanza.pardo@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'informatico@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('PARRA STEGER ALEJANDRO JAVIER', 'informatico@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'irene.pinda@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('PINDA URREA IRENE DEL TRANSITO', 'irene.pinda@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'ronald.pulgar@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('PULGAR ROSAS RONALD MAX', 'ronald.pulgar@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'silvia.reyes@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('REYES REYES EGDA SILVIA', 'silvia.reyes@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'ximena.rios@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('RIOS RUIZ XIMENA CECILIA', 'ximena.rios@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'eliana.ruiz@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('RUIZ PEREZ ELIANA GABRIELA', 'eliana.ruiz@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'gabriel.sanchez@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('SANCHEZ DIAZ CRISTIAN GABRIEL', 'gabriel.sanchez@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'miriam.santana@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('SANTANA AGUILAR MIRIAM DEL CAR', 'miriam.santana@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'marina.soto@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('SOTO PEREZ MARINA DEL CARMEN', 'marina.soto@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'maria.toledo@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('TOLEDO DIAZ MARIA IRMA', 'maria.toledo@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'gladys.ulloa@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ULLOA FUENTEALBA GLADYS', 'gladys.ulloa@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'mauricio.uribe@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('URIBE SANHUEZA MAURICIO PABLO', 'mauricio.uribe@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'tatiana.valencia@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('VALENCIA PAILLACAR TATIANA DEL', 'tatiana.valencia@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'javiera.vargas@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('VARGAS SOTO JAVIERA KARINA', 'javiera.vargas@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'yasmin.veloso@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('VELOSO SAN MARTIN YASMIN PILAR', 'yasmin.veloso@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'alicia.vera@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('VERA OYARZUN ALICIA PAMELA', 'alicia.vera@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'karina.wellmann@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('WELLMANN RUIZ KARINA IVONNE', 'karina.wellmann@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'yoseline.willer@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('WILLER ENCINA YOSELINE ALEJAND', 'yoseline.willer@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'ivette.aguila@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('AGUILA GUENCHUR IVETTE ANGELIC', 'ivette.aguila@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'daniel.arriagada@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('ARRIAGADA LUNA DANIEL ALEJANDR', 'daniel.arriagada@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'omar.cartes@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('CARTES CARTES OMAR G', 'omar.cartes@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'felisa.castillo@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('CASTILLO ANAZCO FELISA DEL CAR', 'felisa.castillo@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'marcia.gallardo@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('GALLARDO PAREDES MARCIA EUGENI', 'marcia.gallardo@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'dmercedez13@gmail.com';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('GUEIQUEN ALMONACID MERCEDES NO', 'dmercedez13@gmail.com', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM profesores WHERE email = 'mario.haefner@icomercialpmt.cl';
  
  IF v_id IS NOT NULL THEN
    UPDATE profesores SET rol = 'asistente' WHERE id = v_id;
  ELSE
    INSERT INTO profesores (nombre, email, cargo, rol, horas_excedentes, horas_no_lectivas, contrato_horas, activo)
    VALUES ('HAEFNER VELASQUEZ ERWIN MARIO', 'mario.haefner@icomercialpmt.cl', 'Asistente de la Educación', 'asistente', 0, 0, 44, true)
    RETURNING id INTO v_id;
    
    PERFORM admin_reset_password(v_id, 'comercial2026');
  END IF;
END $$;
