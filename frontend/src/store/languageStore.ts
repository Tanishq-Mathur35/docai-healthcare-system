import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LanguageCode = 'en' | 'hi';

export const translations = {
  en: {
    // Sidebar & Navigation
    patientPortal: 'Patient Portal',
    navigation: 'Navigation',
    dashboard: 'Dashboard',
    aiConsultation: 'AI Consultation',
    twoMinDoctor: '2-Min Doctor',
    reportDecoded: 'Report, Decoded',
    goingHomeRight: 'Going Home Right',
    bolKeBatao: 'Bol Ke Batao',
    appointments: 'Appointments',
    medicalHistory: 'Medical History & Records',
    documents: 'Documents',
    profile: 'Medical Profile',
    messages: 'Messages',
    signOut: 'Sign Out',
    healthcarePortal: 'Healthcare Portal',

    // Header & Actions
    emergencyBtn: 'Emergency Video Call',
    emergencyShort: 'SOS Emergency',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    languageLabel: 'हिंदी',
    notifications: 'Notifications',
    markAllRead: 'Mark all read',
    noNotifications: 'No notifications yet',

    // Patient Dashboard
    welcomeBack: 'Welcome back',
    healthOverviewDesc: 'Manage your AI consultations, appointments, and clinical records in one place.',
    startAiConsultation: 'Start AI Consultation',
    bookAppointment: 'Book Appointment',
    totalConsultations: 'Consultations',
    upcomingAppointments: 'Appointments',
    uploadedDocuments: 'Documents',
    activeConditions: 'Medical Records',
    doctorPrescriptions: 'Doctor Issued Prescriptions & Advice',
    prescriptionsDesc: 'Direct clinical prescriptions and notes issued by your consulting doctor.',
    newIssued: 'NEW ISSUED',
    prescribedMedicines: 'Prescribed Medicines',
    followUpDate: 'Follow-up Date',
    recentAiConsultations: 'Recent AI Consultations',
    viewAll: 'View all',
    noConsultationsYet: 'No consultations yet',
    startFirstConsultation: 'Start your first AI consultation',
    noAppointmentsBooked: 'No appointments booked',
    bookAnAppointment: 'Book an appointment',
    healthSummary: 'Health Summary & Medical Profile',
    editProfile: 'Edit Profile',
    allergies: 'Allergies',
    chronicConditions: 'Chronic Conditions',
    currentMedications: 'Current Medications',
    noneRecorded: 'None recorded',

    // Consultation Page
    aiHealthConsultation: 'AI Health Consultation',
    poweredByAi: 'Powered by AI · Uses your past medical records & history',
    describeSymptoms: 'Describe Your Symptoms',
    describeSymptomsSub: 'Be as detailed as possible. Your past conditions, allergies, and uploaded reports are automatically included.',
    chiefComplaintPlaceholder: "Describe what you're experiencing (e.g., 'I have had a throbbing headache on the left side for 3 days, along with mild nausea...')",
    beginConsultation: 'Begin AI Consultation',
    startingConsultation: 'Starting consultation...',
    typeYourAnswer: 'Type your answer...',
    generateMedicalReport: 'Generate Medical Report (Gharelu Nuskhe)',
    generatingReport: 'Generating your medical report...',

    // Medical History & Profile
    medicalHistoryTitle: 'Chronological Medical History & Records',
    medicalHistorySubtitle: 'Maintain past conditions (heart attack, diabetes, allergies, surgeries) and upload previous prescriptions or lab reports for doctors and AI.',
    quickAddCondition: 'Quick Add Past Condition',
    addRecord: 'Add Condition',
    uploadPastRecord: 'Upload Prescription / Lab Report',
    syncToProfile: 'Sync with Medical Profile',
    chronologicalTimeline: 'Chronological Medical Timeline',
    active: 'Active',
    resolved: 'Resolved',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    personalMedicalDetails: 'Personal & Medical Details',
    emergencyContact: 'Emergency Contact',
    insuranceInfo: 'Insurance Information',
  },
  hi: {
    // Sidebar & Navigation
    patientPortal: 'रोगी पोर्टल',
    navigation: 'नेविगेशन मेन्यू',
    dashboard: 'डैशबोर्ड',
    aiConsultation: 'AI स्वास्थ्य परामर्श',
    twoMinDoctor: '2-मिनट डॉक्टर',
    reportDecoded: 'लैब रिपोर्ट सरल भाषा में',
    goingHomeRight: 'डिस्चार्ज केयर प्लान',
    bolKeBatao: 'बोल के बताओ (आवाज़)',
    appointments: 'डॉक्टर अपॉइंटमेंट',
    medicalHistory: 'मेडिकल हिस्ट्री और रिकॉर्ड्स',
    documents: 'दस्तावेज़ और रिपोर्ट्स',
    profile: 'मेडिकल प्रोफ़ाइल',
    messages: 'डॉक्टर चैट / संदेश',
    signOut: 'लॉग आउट करें',
    healthcarePortal: 'स्वास्थ्य सेवा पोर्टल',

    // Header & Actions
    emergencyBtn: 'आपातकालीन वीडियो कॉल',
    emergencyShort: 'आपातकालीन कॉल',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    languageLabel: 'English',
    notifications: 'सूचनाएं',
    markAllRead: 'सभी पढ़ी हुई चिह्नित करें',
    noNotifications: 'अभी कोई सूचना नहीं है',

    // Patient Dashboard
    welcomeBack: 'वापसी पर स्वागत है',
    healthOverviewDesc: 'अपने AI परामर्श, डॉक्टर अपॉइंटमेंट और पुराने मेडिकल रिकॉर्ड एक ही स्थान पर प्रबंधित करें।',
    startAiConsultation: 'AI परामर्श शुरू करें',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    totalConsultations: 'कुल परामर्श',
    upcomingAppointments: 'अपॉइंटमेंट्स',
    uploadedDocuments: 'अपलोड रिपोर्ट्स',
    activeConditions: 'मेडिकल हिस्ट्री',
    doctorPrescriptions: 'डॉक्टर द्वारा जारी दवाइयां और सलाह',
    prescriptionsDesc: 'आपके डॉक्टर द्वारा जारी किए गए आधिकारिक नुस्खे और निर्देश।',
    newIssued: 'नया पर्चा',
    prescribedMedicines: 'निर्धारित दवाइयां',
    followUpDate: 'अगली जांच तिथि',
    recentAiConsultations: 'हाल के AI स्वास्थ्य परामर्श',
    viewAll: 'सभी देखें',
    noConsultationsYet: 'अभी तक कोई परामर्श नहीं',
    startFirstConsultation: 'अपना पहला AI परामर्श शुरू करें',
    noAppointmentsBooked: 'कोई अपॉइंटमेंट बुक नहीं है',
    bookAnAppointment: 'डॉक्टर से अपॉइंटमेंट बुक करें',
    healthSummary: 'स्वास्थ्य सारांश और मेडिकल प्रोफ़ाइल',
    editProfile: 'प्रोफ़ाइल संपादित करें',
    allergies: 'एलर्जी (Allergies)',
    chronicConditions: 'पुरानी बीमारियां (हार्ट अटैक, शुगर आदि)',
    currentMedications: 'वर्तमान दवाइयां',
    noneRecorded: 'कोई जानकारी दर्ज नहीं',

    // Consultation Page
    aiHealthConsultation: 'AI स्वास्थ्य परामर्श',
    poweredByAi: 'AI द्वारा संचालित · आपकी पुरानी मेडिकल हिस्ट्री और रिपोर्ट्स का उपयोग करता है',
    describeSymptoms: 'अपने लक्षण विस्तार से बताएं',
    describeSymptomsSub: 'कृपया अपनी समस्या विस्तार से लिखें। आपकी पुरानी बीमारियां, एलर्जी और रिपोर्ट्स अपने आप शामिल हो जाएंगी।',
    chiefComplaintPlaceholder: "अपनी समस्या लिखें (उदा: 'मुझे पिछले 3 दिनों से सिर के बाईं ओर तेज दर्द और हल्की मतली हो रही है...')",
    beginConsultation: 'AI परामर्श शुरू करें',
    startingConsultation: 'परामर्श शुरू हो रहा है...',
    typeYourAnswer: 'अपना उत्तर यहां लिखें...',
    generateMedicalReport: 'स्वास्थ्य रिपोर्ट और घरेलू नुस्खे प्राप्त करें',
    generatingReport: 'आपकी स्वास्थ्य रिपोर्ट तैयार की जा रही है...',

    // Medical History & Profile
    medicalHistoryTitle: 'कालानुक्रमिक मेडिकल हिस्ट्री और पुराने रिकॉर्ड्स',
    medicalHistorySubtitle: 'पुरानी बीमारियां (हार्ट अटैक, डायबिटीज, एलर्जी, सर्जरी) दर्ज करें और पुराने पर्चे व लैब रिपोर्ट अपलोड करें।',
    quickAddCondition: 'पुरानी बीमारी तुरंत जोड़ें',
    addRecord: 'नई स्थिति जोड़ें',
    uploadPastRecord: 'पुराना पर्चा / लैब रिपोर्ट अपलोड करें',
    syncToProfile: 'मेडिकल प्रोफ़ाइल के साथ सिंक करें',
    chronologicalTimeline: 'कालानुक्रमिक मेडिकल टाइमलाइन (Chronological Timeline)',
    active: 'सक्रिय (Active)',
    resolved: 'ठीक हो चुका (Resolved)',
    saveChanges: 'बदलाव सहेजें',
    saving: 'सहेजा जा रहा है...',
    personalMedicalDetails: 'व्यक्तिगत और मेडिकल विवरण',
    emergencyContact: 'आपातकालीन संपर्क विवरण',
    insuranceInfo: 'स्वास्थ्य बीमा जानकारी',
  },
};

interface LanguageState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set({ language: get().language === 'en' ? 'hi' : 'en' }),
    }),
    {
      name: 'docai-language-preference',
    }
  )
);

export function useTranslation() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();
  return {
    language,
    setLanguage,
    toggleLanguage,
    t: translations[language],
  };
}

