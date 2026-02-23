'use client';

import emailjs from '@emailjs/browser';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

type PreferredContact = 'phone' | 'email' | 'text';

type SnowRemovalLeadForm = {
  name: string;
  phone: string;
  email: string;
  preferredContact: PreferredContact;
  sqFt: string;
  address: string;
  notes: string;
  photos: FileList;
};

type StatusState = {
  type: 'success' | 'error' | 'validating';
  message: string;
} | null;

export default function SnowRemovalForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<StatusState>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SnowRemovalLeadForm>({
    mode: 'onChange',
    defaultValues: {
      preferredContact: 'phone',
      phone: '',
      email: '',
      sqFt: '',
      address: '',
      notes: '',
      name: '',
    },
  });

  const phoneValue = watch('phone');
  const emailValue = watch('email');
  const nameValue = watch('name');
  const addressValue = watch('address');

  const hasContactInfo = (phoneValue?.trim() || '') || (emailValue?.trim() || '');

  const onSubmit = async (values: SnowRemovalLeadForm) => {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      setStatus({
        type: 'error',
        message:
          '⚠️ Form is not configured yet. Please contact us directly at (856) 320-8570 or email njsnowremoval26@gmail.com',
      });
      return;
    }

    if (!values.name?.trim()) {
      setStatus({
        type: 'error',
        message: '❌ Please enter your full name.',
      });
      return;
    }

    if (!values.address?.trim()) {
      setStatus({
        type: 'error',
        message: '❌ Please enter your service address.',
      });
      return;
    }

    if (!values.phone?.trim() && !values.email?.trim()) {
      setStatus({
        type: 'error',
        message: '❌ Please include at least a phone number or an email address so we can reach you.',
      });
      return;
    }

    if (!formRef.current) {
      setStatus({
        type: 'error',
        message: '❌ Unable to send right now. Please refresh and try again.',
      });
      return;
    }

    try {
      setStatus({
        type: 'validating',
        message: '⏳ Sending your request...',
      });

      await emailjs.sendForm(serviceId, templateId, formRef.current, { publicKey });
      setStatus({
        type: 'success',
        message: '✅ Request sent successfully! We\'ll contact you within 24 hours using your preferred method.',
      });
      reset({
        preferredContact: 'phone',
        phone: '',
        email: '',
        sqFt: '',
        address: '',
        notes: '',
        name: '',
      });
    } catch (error) {
      console.error('EmailJS error:', error);
      setStatus({
        type: 'error',
        message:
          '❌ Error sending request. Please try again or call us directly at (856) 320-8570.',
      });
    }
  };

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-6 md:p-8">
      <h2 className="text-xl font-black uppercase italic tracking-tight text-white sm:text-2xl md:text-3xl">
        📝 Request Snow Removal
      </h2>
      <p className="mt-2 text-xs text-slate-200 sm:text-sm">
        Share your details below. We&apos;ll contact you within 24 hours. Photos help us give faster, more accurate quotes.
      </p>

      <form
        id="snow-removal-form"
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-5 grid gap-3 sm:gap-4 sm:mt-6 md:grid-cols-2"
        encType="multipart/form-data"
      >
        <div className="md:col-span-2">
          <label htmlFor="name" className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-sky-100 sm:text-sm">
            <span>Full Name</span>
            <span className="text-rose-400">*</span>
            {nameValue?.trim() && <span className="ml-auto text-emerald-400">✓</span>}
          </label>
          <input
            id="name"
            type="text"
            {...register('name', { required: true })}
            className="w-full rounded-lg border border-slate-600/70 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition sm:rounded-xl sm:py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            placeholder="John Smith"
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" className="mt-1 text-xs text-rose-300">Required field</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-sky-100 sm:text-sm">
            Phone
            {phoneValue?.trim() && <span className="ml-auto text-emerald-400">✓</span>}
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className="w-full rounded-lg border border-slate-600/70 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition sm:rounded-xl sm:py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            placeholder="(856) 555-1234"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-sky-100 sm:text-sm">
            Email
            {emailValue?.trim() && <span className="ml-auto text-emerald-400">✓</span>}
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full rounded-lg border border-slate-600/70 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition sm:rounded-xl sm:py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            placeholder="john@example.com"
          />
          <p className="mt-1 text-xs text-slate-400">Phone or email required</p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="preferredContact" className="mb-1.5 block text-xs font-semibold text-sky-100 sm:text-sm">
            How should we contact you?
          </label>
          <select
            id="preferredContact"
            {...register('preferredContact')}
            className="w-full rounded-lg border border-slate-600/70 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition sm:rounded-xl sm:py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
          >
            <option value="phone">📞 Phone</option>
            <option value="email">✉️ Email</option>
            <option value="text">💬 Text Message</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-sky-100 sm:text-sm">
            <span>Service Address</span>
            <span className="text-rose-400">*</span>
            {addressValue?.trim() && <span className="ml-auto text-emerald-400">✓</span>}
          </label>
          <input
            id="address"
            type="text"
            {...register('address', { required: true })}
            className="w-full rounded-lg border border-slate-600/70 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition sm:rounded-xl sm:py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            placeholder="123 Main St, Anytown, NJ"
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address && <p id="address-error" className="mt-1 text-xs text-rose-300">Required field</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="sqFt" className="mb-1.5 block text-xs font-semibold text-sky-100 sm:text-sm">
            Square Footage (optional)
          </label>
          <input
            id="sqFt"
            type="text"
            {...register('sqFt')}
            className="w-full rounded-lg border border-slate-600/70 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition sm:rounded-xl sm:py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            placeholder="e.g., 500 sq ft driveway"
          />
          <p className="mt-1 text-xs text-slate-400">Helps us give you a quick estimate</p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="photos" className="mb-1.5 block text-xs font-semibold text-sky-100 sm:text-sm">
            📸 Upload Photo (optional)
          </label>
          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            {...register('photos')}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-500/70 bg-slate-950/40 px-3 py-3 text-xs text-slate-200 sm:rounded-xl file:mr-3 file:rounded-md file:border-0 file:bg-sky-500/20 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-sky-100 hover:file:bg-sky-500/30 sm:py-4 sm:text-sm sm:file:px-3 sm:file:py-2"
          />
          <p className="mt-1 text-xs text-slate-400">Photos of your driveway/area help us give faster quotes</p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="mb-1.5 block text-xs font-semibold text-sky-100 sm:text-sm">
            Additional Details (optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register('notes')}
            className="w-full rounded-lg border border-slate-600/70 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition sm:rounded-xl sm:py-2.5 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
            placeholder="Gate code, timing preferences, steep driveway, etc."
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2 pt-2 xs:gap-2.5 sm:flex-row sm:items-center sm:gap-3 sm:pt-3">
          <button
            type="submit"
            disabled={isSubmitting || !nameValue?.trim() || !addressValue?.trim() || !hasContactInfo}
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-950 transition sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-500/50 disabled:text-slate-400"
          >
            {isSubmitting ? '⏳ Sending...' : '✓ Submit Request'}
          </button>

          <a
            href="tel:+18563208570"
            className="inline-flex items-center justify-center rounded-lg border border-sky-300/40 bg-sky-500/10 px-4 py-2.5 text-xs font-semibold text-sky-100 transition sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm hover:bg-sky-500/20 hover:border-sky-300/60"
          >
            📞 Call Now
          </a>
        </div>

        {status && (
          <div
            className={`md:col-span-2 rounded-lg border px-3 py-2.5 text-xs sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm ${
              status.type === 'success'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                : status.type === 'validating'
                  ? 'border-sky-400/40 bg-sky-500/15 text-sky-100'
                  : 'border-rose-400/40 bg-rose-500/15 text-rose-100'
            }`}
          >
            {status.message}
          </div>
        )}
      </form>
    </section>
  );
}
