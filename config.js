// =====================================================================
//  CONFIGURACIÓN DEL CAMPUS
//  Pega aquí los dos datos de tu proyecto de Supabase
//  (Supabase → Project Settings → API).
//  Mientras estén vacíos, el campus funciona en MODO DEMOSTRACIÓN.
// =====================================================================

window.CAMPUS_CONFIG = {
  SUPABASE_URL: "https://ehxznifzvwyfrwxhyrbi.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_IHvUTemDmiCaoeXdBvVJmg_AgBfjsIJ",   // la clave "anon public" o "publishable" (NUNCA la service_role / secret)

  NOMBRE: "Cuatro Santos Formación",
  LEMA: "Preparación al acceso del itinerario de Maestros de Religión Católica",
  CORREO_CONTACTO: "cuatrosantosformacion@gmail.com",     // aparece en la pantalla de acceso, ej.: "cuatrosantosformacion@gmail.com"

  // Carpetas del temario (puedes cambiar los nombres o el orden)
  CARPETAS: [
    { id: "cultura-general",   nombre: "Cultura general" },
    { id: "historia-diocesis", nombre: "Historia de la Diócesis de Cartagena" },
    { id: "documentos-cee",    nombre: "Documentos sobre Enseñanza Religiosa Escolar de la Conferencia Episcopal" },
    { id: "compendio",         nombre: "Compendio de la Iglesia Católica" },
    { id: "deca",              nombre: "Asignaturas DECA" },
    { id: "complementario",    nombre: "Material complementario" },
    { id: "unidad-didactica",  nombre: "Unidad Didáctica · Supuesto Práctico" },
    { id: "catecismo",         nombre: "Catecismo de la Iglesia Católica" },
    { id: "normativa",         nombre: "Normativa" }
  ]
};
