import { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'en' | 'es';

const translations = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_trails: 'Trails',
    nav_reports: 'Reports',
    nav_profile: 'Profile',
    // Desktop blocker
    desktop_title: 'Trillo is mobile only',
    desktop_body: 'This app is designed for phones in the field. Please open Trillo on a mobile device, or resize your browser window to 768px or narrower to continue.',
    // Add to home screen
    a2hs_title: 'Keep Trillo handy',
    a2hs_ios: 'Tap the Share icon, then "Add to Home Screen."',
    a2hs_android: 'Open your browser menu, then "Add to Home screen" — or bookmark this page for quick access.',
    a2hs_got_it: 'Got it',
    a2hs_aria: 'Add Trillo to your home screen',
    // Auth
    signin_subtitle: 'Sign in to your Trillo account.',
    signup_subtitle: 'Join the Trillo community.',
    forgot_password_link: 'Forgot your password?',
    forgot_password_title: 'Forgot password',
    forgot_password_subtitle: 'Enter your email and we\'ll send a reset link.',
    send_reset_link: 'Send reset link',
    sending: 'Sending…',
    reset_sent_title: 'Check your email',
    reset_sent_body: 'We\'ve sent a password reset link to your inbox. It may take a minute to arrive.',
    back_to_signin: 'Back to sign in',
    reset_password_title: 'Set new password',
    reset_password_subtitle: 'Choose a strong password for your account.',
    new_password_label: 'New password',
    confirm_password_label: 'Confirm password',
    password_min_length: 'Password must be at least 8 characters.',
    passwords_no_match: 'Passwords don\'t match.',
    password_updated: 'Password updated!',
    redirecting: 'Redirecting to sign in…',
    verifying_link: 'Verifying link…',
    update_password: 'Update password',
    saving: 'Saving…',
    no_account: 'Don\'t have an account?',
    sign_up: 'Sign up',
    email_label: 'Email',
    // Hamburger menu
    menu_language: 'Language',
    menu_about: 'About',
    menu_version: 'Version',
    lang_en: 'English',
    lang_es: 'Español',
    about_description: 'Real-time trail conditions reported by hikers, for hikers. Built for Puerto Rico\'s public trail network.',
    // Report pages
    report_conditions: 'Report Conditions',
    park_report: 'Park Overview Report',
    submit_error: 'Failed to submit. Please try again.',
    trail_not_found: 'Trail not found.',
    no_trails_park: 'No trails found for this park.',
    overall_conditions: 'overall conditions',
    trail_singular: 'trail',
    trail_plural: 'trails',
    report_success_title: 'Report submitted',
    report_success_trail: 'Thanks for sharing! Your report helps fellow hikers know what to expect on this trail.',
    report_success_park: 'Thanks for sharing! Your overview helps fellow hikers know what to expect at this park.',
    view_trail: 'View Trail',
    view_park: 'View Park',
    // Account benefits nudge
    account_benefits_title: 'Create a free account',
    account_benefits_body: 'Track all your reports, show your name on conditions, and build your hiking history.',
    // Report form
    form_condition_label: 'Overall condition',
    form_surface_label: 'Trail surface',
    form_hazards_label: 'Hazards',
    form_notes_label: 'Notes (optional)',
    form_notes_placeholder: 'Anything else hikers should know?',
    form_submit: 'Submit Report',
    form_submitting: 'Submitting…',
    condition_great: 'Great',
    condition_good: 'Good',
    condition_fair: 'Fair',
    condition_poor: 'Poor',
    surface_dry: 'Dry',
    surface_damp: 'Wet',
    surface_muddy: 'Muddy',
    hazard_none: 'None',
    hazard_downed_trees: 'Downed Trees',
    hazard_flooding: 'Flooding',
    hazard_rockfall: 'Rockfall',
    hazard_trail_damage: 'Trail Damage',
    hazard_wildlife: 'Wildlife',
    hazard_overgrown: 'Overgrown',
    // Reports page
    reports_title: 'Recent Reports',
    reports_search: 'Search reports…',
    reports_all: 'All',
    reports_empty: 'No reports found.',
    // Home
    home_active_reports: 'active across your region.',
    home_report: 'report',
    home_reports: 'reports',
    home_recently_reported: 'Recently Reported',
    home_see_all: 'See all',
    home_no_parks: 'No Parks Yet',
    home_no_parks_body: 'Add trails to your database to see parks here.',
    home_browse: 'Browse Trails',
    // Profile
    profile_title: 'My Profile',
    profile_reports: 'My Reports',
    profile_sign_out: 'Sign out',
    // Greetings
    greeting_morning: 'Good morning',
    greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening',
    home_headline: 'Trail conditions,\nright now.',
    home_no_matches: 'No matches for',
    // Search page
    search_title: 'Parks and Trails',
    search_placeholder: 'Search parks, trails, or cities',
    search_load_error: 'Failed to load trails. Please try again later.',
    search_no_parks_found: 'No Parks Found',
    search_no_parks_available: 'No Parks Available',
    search_no_parks_search_hint: 'Try a different search term.',
    search_no_parks_empty_hint: 'Parks will appear here once trails are added.',
    park_singular: 'Park',
    park_plural: 'Parks',
    // Reports page
    reports_grouped_by: 'Grouped by park',
    reports_search_placeholder: 'Search reports, trails, or hazards',
    reports_filter_good: 'Dry',
    reports_filter_caution: 'Wet',
    reports_filter_closed: 'Muddy',
    reports_no_match: 'No Matching Reports',
    reports_none_yet: 'No Reports Yet',
    reports_no_match_hint: 'Try a different search or filter.',
    reports_none_yet_hint: 'Be the first to share trail conditions.',
    reports_unknown_trail: 'Unknown',
    // Profile page
    profile_page_title: 'Profile',
    profile_your_reports: 'Your Reports',
    profile_no_reports_body: 'Start reporting trail conditions to help the community.',
    profile_find_trail: 'FIND A TRAIL',
    // Trail detail page
    trail_back_to_search: 'Back to Search',
    trail_report_conditions: 'REPORT CONDITIONS',
    trail_condition_summary: 'Condition Summary',
    trail_recent_reports: 'Recent Reports',
    trail_no_reports: 'No reports yet for this trail',
    anonymous: 'Anonymous',
    // Park detail page
    park_report_btn: 'REPORT PARK CONDITIONS',
    park_current_conditions: 'Trail Conditions',
    park_updated: 'Updated',
    park_updated_ago: 'ago',
    park_updated_just_now: 'Just now',
    park_condition_summary: 'Condition Summary',
    park_no_trails: 'No Trails',
    park_no_trails_body: 'No trails listed for this park yet.',
    park_load_error: 'Failed to load trails.',
    park_trail_status_good: 'Dry',
    park_trail_status_fair: 'Wet',
    park_trail_status_poor: 'Muddy',
    park_trail_status_unknown: 'No report',
    park_no_recent_reports: 'No recent reports',
    park_report_to_update: 'No update yet',
    park_trails_by_condition: 'Trails by condition',
    park_show_more: 'Show more',
    park_show_less: 'Show less',
    // Report form
    form_select_hazards: 'Select all that apply',
    form_notes_submit_placeholder: 'Share anything helpful for other hikers...',
    hazard_broken_bridge: 'Broken bridge',
    hazard_rocky: 'Rocky',
    hazard_other: 'Other',
    // Common
    loading: 'Loading…',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    back: 'Back',
    search: 'Search parks, trails, or cities',
  },
  es: {
    // Nav
    nav_home: 'Inicio',
    nav_trails: 'Senderos',
    nav_reports: 'Reportes',
    nav_profile: 'Perfil',
    // Desktop blocker
    desktop_title: 'Trillo es solo para móviles',
    desktop_body: 'Esta app está diseñada para usar en el campo. Por favor abre Trillo en un dispositivo móvil, o reduce tu ventana del navegador a 768px o menos para continuar.',
    // Add to home screen
    a2hs_title: 'Ten Trillo a mano',
    a2hs_ios: 'Toca el ícono de compartir, luego "Agregar a pantalla de inicio."',
    a2hs_android: 'Abre el menú del navegador, luego "Agregar a pantalla de inicio" — o guarda esta página como favorito.',
    a2hs_got_it: 'Entendido',
    a2hs_aria: 'Agregar Trillo a tu pantalla de inicio',
    // Auth
    signin_subtitle: 'Inicia sesión en tu cuenta de Trillo.',
    signup_subtitle: 'Únete a la comunidad de Trillo.',
    forgot_password_link: '¿Olvidaste tu contraseña?',
    forgot_password_title: 'Recuperar contraseña',
    forgot_password_subtitle: 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.',
    send_reset_link: 'Enviar enlace',
    sending: 'Enviando…',
    reset_sent_title: 'Revisa tu correo',
    reset_sent_body: 'Enviamos un enlace para restablecer tu contraseña. Puede tardar un momento en llegar.',
    back_to_signin: 'Volver a iniciar sesión',
    reset_password_title: 'Nueva contraseña',
    reset_password_subtitle: 'Elige una contraseña segura para tu cuenta.',
    new_password_label: 'Nueva contraseña',
    confirm_password_label: 'Confirmar contraseña',
    password_min_length: 'La contraseña debe tener al menos 8 caracteres.',
    passwords_no_match: 'Las contraseñas no coinciden.',
    password_updated: '¡Contraseña actualizada!',
    redirecting: 'Redirigiendo…',
    verifying_link: 'Verificando enlace…',
    update_password: 'Actualizar contraseña',
    saving: 'Guardando…',
    no_account: '¿No tienes cuenta?',
    sign_up: 'Regístrate',
    email_label: 'Correo electrónico',
    // Hamburger menu
    menu_language: 'Idioma',
    menu_about: 'Acerca de',
    menu_version: 'Versión',
    lang_en: 'English',
    lang_es: 'Español',
    about_description: 'Condiciones de senderos en tiempo real, reportadas por senderistas, para senderistas. Construido para la red de senderos públicos de Puerto Rico.',
    // Report pages
    report_conditions: 'Reportar Condiciones',
    park_report: 'Reporte General del Parque',
    submit_error: 'Error al enviar. Por favor intenta de nuevo.',
    trail_not_found: 'Sendero no encontrado.',
    no_trails_park: 'No se encontraron senderos en este parque.',
    overall_conditions: 'condiciones generales',
    trail_singular: 'sendero',
    trail_plural: 'senderos',
    report_success_title: 'Reporte enviado',
    report_success_trail: '¡Gracias por compartir! Tu reporte ayuda a otros senderistas a saber qué esperar en este sendero.',
    report_success_park: '¡Gracias por compartir! Tu reporte ayuda a otros senderistas a saber qué esperar en este parque.',
    view_trail: 'Ver Sendero',
    view_park: 'Ver Parque',
    // Account benefits nudge
    account_benefits_title: 'Crea una cuenta gratis',
    account_benefits_body: 'Rastrea tus reportes, muestra tu nombre en las condiciones y construye tu historial de senderismo.',
    // Report form
    form_condition_label: 'Condición general',
    form_surface_label: 'Superficie del sendero',
    form_hazards_label: 'Peligros',
    form_notes_label: 'Notas (opcional)',
    form_notes_placeholder: '¿Algo más que los senderistas deberían saber?',
    form_submit: 'Enviar Reporte',
    form_submitting: 'Enviando…',
    condition_great: 'Excelente',
    condition_good: 'Bueno',
    condition_fair: 'Regular',
    condition_poor: 'Malo',
    surface_dry: 'Seco',
    surface_damp: 'Húmedo',
    surface_muddy: 'Mojado',
    hazard_none: 'Ninguno',
    hazard_downed_trees: 'Árboles caídos',
    hazard_flooding: 'Inundación',
    hazard_rockfall: 'Derrumbe de rocas',
    hazard_trail_damage: 'Daños en el sendero',
    hazard_wildlife: 'Fauna salvaje',
    hazard_overgrown: 'Vegetación excesiva',
    // Reports page
    reports_title: 'Reportes Recientes',
    reports_search: 'Buscar reportes…',
    reports_all: 'Todos',
    reports_empty: 'No se encontraron reportes.',
    // Home
    home_active_reports: 'activos en tu región.',
    home_report: 'reporte',
    home_reports: 'reportes',
    home_recently_reported: 'Reportados Recientemente',
    home_see_all: 'Ver todos',
    home_no_parks: 'Sin Parques',
    home_no_parks_body: 'Agrega senderos a tu base de datos para ver parques aquí.',
    home_browse: 'Explorar Senderos',
    // Profile
    profile_title: 'Mi Perfil',
    profile_reports: 'Mis Reportes',
    profile_sign_out: 'Cerrar sesión',
    // Greetings
    greeting_morning: 'Buenos días',
    greeting_afternoon: 'Buenas tardes',
    greeting_evening: 'Buenas noches',
    home_headline: 'Condiciones,\nahora mismo.',
    home_no_matches: 'Sin resultados para',
    // Search page
    search_title: 'Parques y Senderos',
    search_placeholder: 'Buscar parques, senderos o ciudades',
    search_load_error: 'Error al cargar los senderos. Intenta de nuevo.',
    search_no_parks_found: 'No se encontraron parques',
    search_no_parks_available: 'Sin parques disponibles',
    search_no_parks_search_hint: 'Prueba con otro término de búsqueda.',
    search_no_parks_empty_hint: 'Los parques aparecerán aquí cuando se agreguen senderos.',
    park_singular: 'Parque',
    park_plural: 'Parques',
    // Reports page
    reports_grouped_by: 'Agrupados por parque',
    reports_search_placeholder: 'Buscar reportes, senderos o peligros',
    reports_filter_good: 'Seco',
    reports_filter_caution: 'Húmedo',
    reports_filter_closed: 'Mojado',
    reports_no_match: 'Sin reportes que coincidan',
    reports_none_yet: 'Sin Reportes Aún',
    reports_no_match_hint: 'Prueba otro término o filtro.',
    reports_none_yet_hint: 'Sé el primero en compartir las condiciones del sendero.',
    reports_unknown_trail: 'Desconocido',
    // Profile page
    profile_page_title: 'Perfil',
    profile_your_reports: 'Tus Reportes',
    profile_no_reports_body: 'Comienza a reportar condiciones para ayudar a la comunidad.',
    profile_find_trail: 'BUSCAR SENDERO',
    // Trail detail page
    trail_back_to_search: 'Volver a búsqueda',
    trail_report_conditions: 'REPORTAR CONDICIONES',
    trail_condition_summary: 'Resumen de Condiciones',
    trail_recent_reports: 'Reportes Recientes',
    trail_no_reports: 'Sin reportes para este sendero',
    anonymous: 'Anónimo',
    // Park detail page
    park_report_btn: 'REPORTAR CONDICIONES',
    park_current_conditions: 'Condiciones de Senderos',
    park_updated: 'Actualizado',
    park_updated_ago: 'hace',
    park_updated_just_now: 'Ahora',
    park_condition_summary: 'Resumen de Condiciones',
    park_no_trails: 'Sin Senderos',
    park_no_trails_body: 'Aún no hay senderos en este parque.',
    park_load_error: 'Error al cargar los senderos.',
    park_trail_status_good: 'Seco',
    park_trail_status_fair: 'Húmedo',
    park_trail_status_poor: 'Mojado',
    park_trail_status_unknown: 'Sin reporte',
    park_no_recent_reports: 'Sin reportes recientes',
    park_report_to_update: 'Sin actualización',
    park_trails_by_condition: 'Senderos por condición',
    park_show_more: 'Ver más',
    park_show_less: 'Ver menos',
    // Report form
    form_select_hazards: 'Selecciona todos los que apliquen',
    form_notes_submit_placeholder: '¿Algo útil para otros senderistas?',
    hazard_broken_bridge: 'Puente roto',
    hazard_rocky: 'Pedregoso',
    hazard_other: 'Otro',
    // Common
    loading: 'Cargando…',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    back: 'Atrás',
    search: 'Buscar parques, senderos o ciudades',
  },
} satisfies Record<Lang, Record<string, string>>;

export type TranslationKey = keyof typeof translations.en;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = 'trillo:lang';

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'es') return stored;
    } catch {}
    return 'es'; // Spanish is the default
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  };

  const t = (key: TranslationKey) => translations[lang][key] ?? translations.en[key];

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
