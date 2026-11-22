'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { MapPin, Mail, Phone, Send, CheckCircle2, MessageSquare, Clock } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Enquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-ukorange">Always Here To Help</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-medium text-forest">
          Connect With Uttarkunth
        </h1>
        <p className="font-sans font-normal text-sm text-charcoal-muted leading-relaxed">
          Questions about stays in Jari or Parvati Valley? Want to become a host partner? Our team and founder are based right here in Kullu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact Information & Channels */}
        <div className="space-y-8 bg-ivory-warm p-8 rounded-3xl border border-forest/15">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-medium text-forest">Himalayan Headquarters</h2>
            <div className="space-y-4 text-sm text-charcoal">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-ukorange flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-forest">Office Location:</strong>
                  <span>{BRAND.headquarters}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-ukorange flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-forest">Direct Email:</strong>
                  <a href={`mailto:${BRAND.contactEmail}`} className="text-forest hover:text-ukorange transition-colors">
                    {BRAND.contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-ukorange flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-forest">Phone / WhatsApp Support:</strong>
                  <span>{BRAND.phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-ukorange flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-forest">Support Hours:</strong>
                  <span>8:00 AM – 8:00 PM IST (Mon – Sun)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-forest/15">
            <h3 className="font-serif text-lg font-medium text-forest mb-2">Host & Partner Onboarding</h3>
            <p className="font-sans font-normal text-xs text-charcoal-muted leading-relaxed mb-4">
              If you operate a homestay, guesthouse, or mountain cottage in Himachal Pradesh and want to join Uttarkunth Stays with direct guest relationships and transparent hosting tools:
            </p>
            <Link
              href="/account/stays/host"
              className="font-sans inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-hover transition-colors"
            >
              Open Host Workspace
            </Link>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-[#FFFDF9] p-8 rounded-3xl border border-[#D9CCB8] shadow-soft">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-forest" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-forest">Message Received!</h3>
              <p className="font-sans font-normal text-xs sm:text-sm text-charcoal-muted max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{name}</strong>. Gaurav Negi and our mountain hospitality team have received your enquiry and will respond within 24 hours.
              </p>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setSubmitted(false)}
                className="font-sans mt-4 min-h-[44px] px-5 py-2.5 text-xs font-semibold text-forest border border-[#D9CCB8] rounded-xl hover:bg-forest/5 cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-serif text-2xl font-medium text-forest mb-4">Send Us a Message</h2>

              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-semibold text-charcoal mb-1.5"
                >
                  Your Name
                </label>
                <input
                  id="contact-name"
                  suppressHydrationWarning
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:ring-2 focus:ring-forest/20 focus:border-forest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-charcoal mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    suppressHydrationWarning
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:ring-2 focus:ring-forest/20 focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-xs font-semibold text-charcoal mb-1.5"
                  >
                    Phone Number
                  </label>
                  <input
                    id="contact-phone"
                    suppressHydrationWarning
                    type="tel"
                    placeholder="+91 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:ring-2 focus:ring-forest/20 focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-xs font-semibold text-charcoal mb-1.5"
                >
                  Enquiry Type
                </label>
                <select
                  id="contact-subject"
                  suppressHydrationWarning
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:ring-2 focus:ring-forest/20 focus:border-forest focus:outline-none"
                >
                  <option value="General Enquiry">General Enquiry</option>
                  <option value="Booking Help">Booking Assistance</option>
                  <option value="Host Partnership">Become a Homestay Host</option>
                  <option value="Press / Collaboration">Press &amp; Community Collaboration</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold text-charcoal mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  suppressHydrationWarning
                  required
                  rows={4}
                  placeholder="How can we assist your Himalayan stay experience?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3.5 text-sm bg-[#F5F0E6] border border-[#D9CCB8] rounded-xl font-medium text-charcoal focus:ring-2 focus:ring-forest/20 focus:border-forest focus:outline-none"
                />
              </div>

              <button
                suppressHydrationWarning
                type="submit"
                className="w-full min-h-[48px] py-3 bg-[#263D32] hover:bg-[#1D3027] text-[#FFFDF9] text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Send Message</span>
                <Send className="w-4 h-4 text-[#FDE2A8]" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
