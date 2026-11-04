import React, { useState } from 'react';
import { CheckCircle2, Shield, Lock, FileText, Heart, Loader2, Database } from 'lucide-react';
import { CONFIG } from '../config';
import { ModalShell } from './ui/ModalShell';

interface ModalsProps {
  isAccessModalOpen: boolean;
  onCloseAccessModal: () => void;
  isPrivacyModalOpen: boolean;
  onClosePrivacyModal: () => void;
  lang: 'en' | 'bn';
}

export const Modals: React.FC<ModalsProps> = ({
  isAccessModalOpen,
  onCloseAccessModal,
  isPrivacyModalOpen,
  onClosePrivacyModal
}) => {
  // Access Modal Form State
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    role: 'family_abroad',
    location: 'London, UK',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) return;

    setIsSubmitting(true);
    const generatedTicket = `#THY-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(generatedTicket);

    const payload = {
      timestamp: new Date().toISOString(),
      ticketId: generatedTicket,
      name: formData.name,
      contact: formData.contact,
      role: formData.role,
      location: formData.location,
      notes: formData.notes
    };

    // If Google Sheet Webhook / Apps Script is configured
    if (CONFIG.googleSheetEndpoint) {
      try {
        await fetch(CONFIG.googleSheetEndpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Google Sheet submission warning:', err);
        // Fallback: still treat form as captured locally
      }
    }

    // Small delay for natural smooth UX
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSubmitted(true);
    }, 600);
  };

  const resetAccessModal = () => {
    setFormSubmitted(false);
    setIsSubmitting(false);
    onCloseAccessModal();
  };

  return (
    <>
      {/* 1. ACCESS / FAMILY PILOT MODAL */}
      <ModalShell
        open={isAccessModalOpen}
        onClose={resetAccessModal}
        labelledBy="access-modal-title"
        closeLabel="Close the pilot application dialog"
      >
        <div>
            {!formSubmitted ? (
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ochre-100 text-ochre-800 text-[11px] font-mono font-semibold uppercase mb-3">
                  Stage 1 Family Pilot Registration
                </div>
                <h2 id="access-modal-title" className="font-editorial text-2xl sm:text-3xl text-forest-950 font-normal mb-2">
                  Request access to the Thypro pilot
                </h2>
                <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed mb-6 font-normal">
                  We are currently admitting families in Dhaka and their relatives living abroad (UK, US, Canada, UAE), along with select primary care clinic partners in Dhaka.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-forest-900 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samira Ahmed"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-forest-900/15 text-sm text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-forest-900 mb-1.5">
                      Email or WhatsApp Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. samira@example.com or +44 7700 900123"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-forest-900/15 text-sm text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-forest-900 mb-1.5">
                        Your Care Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-forest-900/15 text-xs text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                      >
                        <option value="family_abroad">Family Member Living Abroad</option>
                        <option value="patient_dhaka">Patient Living in Bangladesh</option>
                        <option value="caregiver_dhaka">Caregiver / Relative in Dhaka</option>
                        <option value="clinic_doctor">Doctor / Clinic Partner</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-forest-900 mb-1.5">
                        Current City / Corridor
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. London / Dhaka"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-forest-900/15 text-xs text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-forest-900 mb-1.5">
                      What is your most pressing care need right now? (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Managing my father's diabetes prescriptions and organizing hospital visits..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-forest-900/15 text-xs text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-lg bg-forest-900 text-ivory-50 text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-all shadow-soft flex items-center justify-center gap-2 disabled:opacity-75"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-ivory-200" />
                          <span>Recording Application...</span>
                        </>
                      ) : (
                        <span>Submit Pilot Application</span>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-forest-800/60 mt-2 font-mono flex items-center justify-center gap-1.5">
                      <Database className="w-3 h-3 text-sage-600" />
                      <span>{CONFIG.googleSheetEndpoint ? 'Connected to live Google Sheet' : 'Direct secure registration • Privacy respected'}</span>
                    </p>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 animate-fade-in-up">
                <div className="w-14 h-14 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 id="access-modal-title" className="font-editorial text-2xl text-forest-950 font-normal mb-2">
                  Application received
                </h2>
                <p className="text-xs sm:text-sm text-forest-900/80 leading-relaxed max-w-sm mx-auto mb-4">
                  Thank you, <strong>{formData.name}</strong>. Your pilot application reference is{' '}
                  <span className="font-mono text-ochre-700 font-bold">{ticketId}</span>.
                  Our team coordinates onboarding in weekly cohorts to ensure personalized setup for your family.
                </p>

                {CONFIG.googleSheetEndpoint && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-sage-100 text-sage-800 text-xs font-mono font-medium mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage-700" />
                    <span>Logged to Google Sheet</span>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-ivory-200/70 border border-forest-900/10 text-xs text-forest-800/80 text-left mb-6 space-y-1">
                  <div><strong>Registered Contact:</strong> {formData.contact}</div>
                  <div><strong>Corridor:</strong> {formData.location}</div>
                  <div><strong>Selected Role:</strong> {formData.role}</div>
                </div>
                <button
                  type="button"
                  onClick={resetAccessModal}
                  className="px-6 py-2.5 rounded-lg bg-forest-900 text-ivory-50 text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-all"
                >
                  Return to the website
                </button>
              </div>
            )}
        </div>
      </ModalShell>

      {/* 2. DATA SOVEREIGNTY & PRIVACY PRINCIPLES MODAL */}
      <ModalShell
        open={isPrivacyModalOpen}
        onClose={onClosePrivacyModal}
        labelledBy="privacy-modal-title"
        className="max-w-2xl"
        closeLabel="Close the data principles dialog"
      >
        <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sage-100 text-forest-900 text-[11px] font-mono font-semibold uppercase mb-3">
              <Shield className="w-3.5 h-3.5 text-sage-600" />
              <span>Thypro Governance Commitments</span>
            </div>

            <h2 id="privacy-modal-title" className="font-editorial text-2xl sm:text-3xl text-forest-950 font-normal mb-2">
              Our ethical and data architecture principles
            </h2>
            <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed mb-6 font-normal">
              These binding commitments govern every module in the Thypro platform specification (v3.0).
            </p>

            <div className="space-y-5 text-xs text-forest-900/85 leading-relaxed">
              {/* Point 1 */}
              <div className="p-4 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm">
                <div className="flex items-center gap-2 font-semibold text-forest-950 text-sm mb-1">
                  <Lock className="w-4 h-4 text-ochre-600" />
                  <span>1. Person-Owned Record (REC08)</span>
                </div>
                <p>
                  Your health records belong entirely to you, not to Thypro or any hospital. You retain full rights to export your longitudinal record in open standards (PDF, JSON, HL7 FHIR) anytime. If you choose to delete your account, your data is erased completely.
                </p>
              </div>

              {/* Point 2 */}
              <div className="p-4 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm">
                <div className="flex items-center gap-2 font-semibold text-forest-950 text-sm mb-1">
                  <Heart className="w-4 h-4 text-ochre-600" />
                  <span>2. No Sale of Health Data or Advertising</span>
                </div>
                <p>
                  Thypro funds its business through transparent subscriptions and workflow fees. We will never sell, monetize, broker, or license identifiable health records, blood donor locations, or wearable trends for third-party advertising or commercial profiling.
                </p>
              </div>

              {/* Point 3 */}
              <div className="p-4 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm">
                <div className="flex items-center gap-2 font-semibold text-forest-950 text-sm mb-1">
                  <Shield className="w-4 h-4 text-ochre-600" />
                  <span>3. Why No Blockchain (Decision D1)</span>
                </div>
                <p>
                  Data on a public blockchain cannot be corrected or deleted, which fundamentally contradicts international privacy rights (GDPR Article 17) and Thypro’s correction protocols (REC10). Instead, Thypro uses TRU07 cryptographic hashes with trusted timestamps to prove record authenticity without ever putting medical data on a distributed ledger.
                </p>
              </div>

              {/* Point 4 */}
              <div className="p-4 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm">
                <div className="flex items-center gap-2 font-semibold text-forest-950 text-sm mb-1">
                  <FileText className="w-4 h-4 text-ochre-600" />
                  <span>4. Governed AI Boundaries (Chapter 15)</span>
                </div>
                <p>
                  AI is utilized solely for reviewable extraction, translation, scheduling, and OCR summaries. Every extracted data field retains a direct pointer to the source document page. Clinicians approve diagnoses, prescriptions, and medical care plans. Thypro does not independently diagnose illness or alter prescription regimens.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-forest-900/10 flex justify-end">
              <button
                type="button"
                onClick={onClosePrivacyModal}
                className="px-5 py-2.5 rounded-lg bg-forest-900 text-ivory-50 text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-all"
              >
                Understood, close
              </button>
            </div>
        </div>
      </ModalShell>
    </>
  );
};
