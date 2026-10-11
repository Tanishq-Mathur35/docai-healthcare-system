import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Stethoscope, Calendar, ClipboardList, AlertTriangle,
  Pill, ChevronRight, Sparkles, HeartPulse, Video, ArrowRight,
  ShieldAlert, Activity, CheckCircle2, Clock, Upload, Droplet,
  Sun, Smile, ShieldCheck, Printer, Download
} from 'lucide-react';
import { patientService } from '@/services/patient.service';
import { appointmentService } from '@/services/appointment.service';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { formatDate } from '@/lib/utils';

const commonSymptoms = [
  'Headache & fever',
  'Cold, cough & sore throat',
  'Stomach ache or acid reflux',
  'Skin rash or allergy',
  'Fatigue & low energy',
];

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => patientService.getProfile(),
  });

  const { data: consultsRes, isLoading: consultsLoading } = useQuery({
    queryKey: ['patient-consultations'],
    queryFn: () => patientService.getConsultations({ limit: 3 }),
  });

  const { data: prescriptsRes, isLoading: prescriptsLoading } = useQuery({
    queryKey: ['patient-prescriptions', { limit: 3 }],
    queryFn: () => patientService.getPrescriptions({ limit: 3 }),
  });

  const { data: apptsRes, isLoading: apptsLoading } = useQuery({
    queryKey: ['patient-appointments-upcoming'],
    queryFn: () => appointmentService.getMyAppointments({ limit: 3 }),
  });

  if (profileLoading || consultsLoading || prescriptsLoading || apptsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 text-sm font-medium">Preparing your personal health dashboard...</p>
      </div>
    );
  }

  const profile = profileRes?.data?.data;
  const consultations = consultsRes?.data?.data || [];
  const prescriptions: any[] = Array.isArray(prescriptsRes?.data?.data)
    ? prescriptsRes.data.data
    : prescriptsRes?.data?.data?.items || prescriptsRes?.data?.items || [];
  const totalPrescriptions = prescriptsRes?.data?.meta?.total ?? prescriptions.length;

  const appointments: any[] = Array.isArray(apptsRes?.data?.data)
    ? apptsRes.data.data
    : apptsRes?.data?.data?.items || apptsRes?.data?.items || [];

  // Filter next upcoming scheduled appointment
  const nextAppointment = appointments.find((a: any) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-7 max-w-7xl mx-auto"
    >
      {/* ── Welcoming Hero Banner with AI Symptom Assistant CTA ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-sky-600 to-teal-500 text-white p-7 lg:p-8 shadow-xl shadow-sky-500/15">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -mb-10 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-sky-100">
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              <span>DocAI 24/7 Smart Health Companion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hello, {user?.firstName || 'there'}! How are you feeling today?
            </h1>
            <p className="text-sky-100 text-sm leading-relaxed">
              Describe any symptoms, review medical reports, or consult top board-certified physicians from the comfort of your home.
            </p>

            {/* Quick symptom trigger chips */}
            <div className="pt-2 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-sky-100">Try asking about:</span>
              {commonSymptoms.map((sym, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate('/patient/consultations', { state: { initialQuery: sym } })}
                  className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-medium backdrop-blur-md text-white transition-all shadow-sm"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-white text-sky-700 hover:bg-sky-50 font-bold rounded-2xl shadow-lg shadow-sky-900/10 text-sm gap-2"
            >
              <Link to="/patient/consultations">
                <Sparkles className="h-4 w-4 text-sky-600" /> Start AI Health Check
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl text-sm gap-2 backdrop-blur-sm"
            >
              <Link to="/patient/appointments">
                <Calendar className="h-4 w-4" /> Book Doctor Visit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Incomplete Profile Prompt (If details missing) ── */}
      {profile && (!profile.age || !profile.bloodGroup) && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Your Health Profile is Incomplete</p>
              <p className="text-xs text-amber-700">Add your age and blood group for accurate AI symptom assessments.</p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 text-xs rounded-xl">
            <Link to="/patient/profile">Update Profile</Link>
          </Button>
        </div>
      )}

      {/* ── Quick Health Overview Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/patient/appointments" className="block">
          <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-sm hover:shadow-md hover:border-sky-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Appointments</span>
              <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{appointments.length}</p>
            <p className="text-xs text-slate-500 mt-1">Booked consultations</p>
          </div>
        </Link>

        <Link to="/patient/prescriptions" className="block">
          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prescriptions</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Pill className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{totalPrescriptions}</p>
            <p className="text-xs text-slate-500 mt-1">Doctor issued</p>
          </div>
        </Link>

        <Link to="/patient/consultations" className="block">
          <div className="p-4 rounded-2xl bg-white border border-teal-100 shadow-sm hover:shadow-md hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Checkups</span>
              <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Stethoscope className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{consultations.length}</p>
            <p className="text-xs text-slate-500 mt-1">Clinical assessments</p>
          </div>
        </Link>

        <Link to="/patient/medical-history" className="block">
          <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conditions</span>
              <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <ClipboardList className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{profile?.chronicDiseases?.length ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Documented conditions</p>
          </div>
        </Link>
      </div>

      {/* ── Main Two-Column Workstation: Upcoming Doctor Visit & Active Prescriptions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Upcoming Appointment Spotlight */}
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-sky-600" />
                  Upcoming Doctor Visit
                </h3>
                <p className="text-xs text-slate-500">Your scheduled healthcare consultation</p>
              </div>
              <Link to="/patient/appointments" className="text-xs text-sky-600 font-bold hover:underline">
                View All
              </Link>
            </div>

            {nextAppointment ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {nextAppointment.doctor?.user?.firstName?.[0]}
                    {nextAppointment.doctor?.user?.lastName?.[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Dr. {nextAppointment.doctor?.user?.firstName} {nextAppointment.doctor?.user?.lastName}
                    </h4>
                    <p className="text-xs text-sky-700 font-semibold">{nextAppointment.doctor?.specialization}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {nextAppointment.doctor?.hospital || 'DocAI Clinical Center'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs pt-2 border-t border-sky-100">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-sky-600" /> {formatDate(nextAppointment.appointmentDate)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-sky-600" /> {nextAppointment.slotStart} - {nextAppointment.slotEnd}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
                    {nextAppointment.type}
                  </span>
                </div>

                {nextAppointment.meetingLink && (
                  <div className="pt-1">
                    <a href={nextAppointment.meetingLink} target="_blank" rel="noreferrer">
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl gap-2 shadow-sm">
                        <Video className="h-4 w-4" /> Join Video Consultation Now
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No upcoming appointments scheduled</p>
                <p className="text-xs text-slate-500">Need to see a specialist? Book an online or in-person visit.</p>
                <Button asChild size="sm" className="mt-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs">
                  <Link to="/patient/appointments">Find a Doctor</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Consultation Guarantee: Full privacy & HIPAA-standard encryption</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
        </div>

        {/* Recent Doctor Prescriptions Spotlight */}
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Pill className="h-5 w-5 text-emerald-600" />
                  Active Prescriptions (Rx)
                </h3>
                <p className="text-xs text-slate-500">Medications prescribed by your doctors</p>
              </div>
              <Link to="/patient/prescriptions" className="text-xs text-emerald-700 font-bold hover:underline">
                View All ({totalPrescriptions})
              </Link>
            </div>

            {prescriptions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
                <Pill className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No active prescriptions</p>
                <p className="text-xs text-slate-500">Prescriptions issued during consultations will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.slice(0, 2).map((rx: any) => {
                  const meds = Array.isArray(rx.medications) ? rx.medications : [];

                  return (
                    <div key={rx.id} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-emerald-900 block">
                            Prescription #{rx.id.slice(0, 8).toUpperCase()}
                          </span>
                          {rx.doctor?.user?.firstName && (
                            <span className="text-[11px] text-emerald-700 font-medium">
                              Dr. {rx.doctor.user.firstName} {rx.doctor.user.lastName} {rx.doctor.specialization ? `• ${rx.doctor.specialization}` : ''}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">{formatDate(rx.createdAt)}</span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {meds.slice(0, 2).map((m: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-emerald-100">
                            <div>
                              <strong className="text-slate-800">{m.name}</strong>
                              <span className="text-slate-500 ml-1.5">({m.dosage})</span>
                            </div>
                            <span className="text-emerald-700 font-semibold text-[11px]">{m.frequency}</span>
                          </div>
                        ))}
                      </div>

                      {(rx.instructions || rx.careInstructions) && (
                        <p className="text-xs text-slate-600 italic pt-1">
                          Doctor instructions: "{rx.instructions || rx.careInstructions}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Need to print or take to pharmacy?</span>
            <Button asChild size="sm" variant="outline" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs rounded-xl gap-1.5">
              <Link to="/patient/prescriptions">
                <Printer className="h-3.5 w-3.5" /> Full Prescriptions Pad
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Patient AI Clinical Toolkit (T01 - T04) ── */}
      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-600" />
              Patient & Family AI Health Toolkit
            </h3>
            <p className="text-xs text-slate-500">
              Plain-language lab decoders, hospital discharge routines, multilingual voice history, and pre-consultation briefings
            </p>
          </div>
          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
            Interactive Healthcare Tools
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* T02: Report Decoded */}
          <Link
            to="/patient/report-decoded"
            className="group p-4 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/50 to-white hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                  T02
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                Report, Decoded
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Translate confusing SGPT, HbA1c, or lab sheets into simple words with doctor questions.
              </p>
            </div>
            <div className="mt-3 text-xs font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Decode My Lab <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* T03: Going Home Right */}
          <Link
            to="/patient/going-home-right"
            className="group p-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 group-hover:scale-110 transition-transform">
                  <Pill className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                  T03
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                Going Home Right
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Convert discharge sheets into morning, afternoon & night routine for your family fridge.
              </p>
            </div>
            <div className="mt-3 text-xs font-bold text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Care Plan <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* T04: Bol Ke Batao */}
          <Link
            to="/patient/bol-ke-batao"
            className="group p-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 group-hover:scale-110 transition-transform">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                  T04
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Bol Ke Batao (Voice)
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Speak in Hindi, Hinglish or Marwari. We turn your voice into structured clinical history.
              </p>
            </div>
            <div className="mt-3 text-xs font-bold text-purple-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Speak In Voice <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* T01: Two-Minute Doctor */}
          <Link
            to="/patient/two-minute-doctor"
            className="group p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  T01
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                2-Min OPD Summary
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Scan all your old clinic slips and papers before stepping into the doctor's room.
              </p>
            </div>
            <div className="mt-3 text-xs font-bold text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Prepare OPD Visit <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Daily Wellness Tips & Healthcare Reminders ── */}
      <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse className="h-5 w-5 text-sky-600" />
          <h3 className="text-base font-extrabold text-slate-900">Daily Health & Wellness Guide</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
              <Droplet className="h-4 w-4 text-sky-600" /> Hydration Goal
            </div>
            <p className="text-xs text-slate-600">
              Aim for 8–10 glasses of water daily. Staying hydrated promotes cardiovascular and kidney health.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <Activity className="h-4 w-4 text-emerald-600" /> 30-Minute Movement
            </div>
            <p className="text-xs text-slate-600">
              A light 30-minute brisk walk boosts circulation, lowers resting blood pressure, and relieves stress.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <Sun className="h-4 w-4 text-amber-600" /> Restful Sleep
            </div>
            <p className="text-xs text-slate-600">
              7–8 hours of quality sleep helps cell recovery and strengthens immune defense against infections.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

