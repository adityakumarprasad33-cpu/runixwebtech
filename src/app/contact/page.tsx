"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      projectType: formData.get("projectType"),
      budget: formData.get("budget"),
      timeline: formData.get("timeline"),
      details: formData.get("details"),
      createdAt: serverTimestamp(),
      status: "new",
    };

    try {
      await addDoc(collection(db, "inquiries"), data);
      setIsSuccess(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("There was an error submitting your inquiry. Please try again or use direct contact.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full items-center relative bg-[#050505] overflow-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-10" />
      
      {/* Background glow for contact page */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[50vh] bg-indigo-500/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative w-full pt-48 pb-16 px-4 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto w-full"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-[0.2em]">Contact</span>
          </div>
          
          <h1 className="font-jakarta text-6xl md:text-8xl lg:text-[9rem] text-white tracking-tighter mb-8 leading-[0.85] font-black uppercase text-glow">
            Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Initiate</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl font-medium leading-relaxed tracking-tight">
            Ready to upgrade your digital presence? Send over the details and we'll engineer the perfect solution.
          </p>
        </motion.div>
      </section>

      {/* Form Section */}
      <section className="py-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Form Column */}
          <div className="lg:col-span-7">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-card bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-10 md:p-16 text-center"
              >
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)] border border-white/10">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-jakarta text-4xl font-bold text-white mb-6 tracking-tight">Inquiry Received</h3>
                <p className="text-zinc-400 mb-12 text-lg leading-relaxed font-medium">
                  Thanks for reaching out. Your project inquiry has been received. We will review the details and get back to you shortly.
                </p>
                <Button onClick={() => setIsSuccess(false)} variant="outline" className="rounded-full h-14 px-8 border-white/20">
                  Send Another Inquiry
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="premium-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
              >
                <p className="text-zinc-400 mb-10 text-lg relative z-10 font-medium leading-relaxed">
                  The more context you share, the better our proposal will be. Let us know what you're trying to achieve.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Name <span className="text-indigo-400">*</span></label>
                      <input required type="text" id="name" name="name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-zinc-600 font-medium backdrop-blur-md" placeholder="John Doe" />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Email <span className="text-indigo-400">*</span></label>
                      <input required type="email" id="email" name="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-zinc-600 font-medium backdrop-blur-md" placeholder="john@example.com" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="company" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Company / Brand (optional)</label>
                    <input type="text" id="company" name="company" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-zinc-600 font-medium backdrop-blur-md" placeholder="Acme Corp" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="projectType" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Project Type <span className="text-indigo-400">*</span></label>
                      <select required id="projectType" name="projectType" defaultValue="" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none font-medium">
                        <option value="" disabled className="text-zinc-500">Select a type...</option>
                        <option value="Business Website">Business Website</option>
                        <option value="Portfolio Website">Portfolio Website</option>
                        <option value="Landing Page">Landing Page</option>
                        <option value="Dashboard / Admin Panel">Dashboard / Admin Panel</option>
                        <option value="Web App / MVP">Web App / MVP</option>
                        <option value="Website Redesign">Website Redesign</option>
                        <option value="Not Sure Yet">Not Sure Yet</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="budget" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Budget Range</label>
                      <select id="budget" name="budget" defaultValue="" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none font-medium">
                        <option value="" disabled>Select a range...</option>
                        <option value="Essential ($4,900+)">Essential ($4,900+)</option>
                        <option value="Professional ($12,500+)">Professional ($12,500+)</option>
                        <option value="Enterprise (Custom)">Enterprise (Custom)</option>
                        <option value="Let’s discuss">Let’s discuss</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="timeline" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Timeline</label>
                    <select id="timeline" name="timeline" defaultValue="" className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none font-medium">
                      <option value="" disabled>Select timeline...</option>
                      <option value="As soon as possible">As soon as possible</option>
                      <option value="Within 2 weeks">Within 2 weeks</option>
                      <option value="Within 1 month">Within 1 month</option>
                      <option value="Flexible / exploring options">Flexible / exploring options</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="details" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Project Details <span className="text-indigo-400">*</span></label>
                    <textarea required id="details" name="details" rows={5} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none placeholder-zinc-600 font-medium backdrop-blur-md" placeholder="Tell us about your project goals, current challenges, and any specific requirements..." />
                  </div>

                  {error && (
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold tracking-wide">
                      {error}
                    </div>
                  )}

                  <Button type="submit" size="lg" variant="accent" className="w-full rounded-full h-16 shadow-[0_0_30px_rgba(99,102,241,0.2)] text-lg mt-4" disabled={isSubmitting}>
                    {isSubmitting ? "Sending Inquiry..." : "Submit Inquiry"}
                  </Button>
                </form>
              </motion.div>
            )}
          </div>

          {/* Direct Contact Column */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="sticky top-32 pt-10"
            >
              <h3 className="font-jakarta text-5xl font-extrabold text-white mb-8 tracking-tighter">Direct<br/>Lines.</h3>
              <p className="text-zinc-400 text-lg mb-16 leading-relaxed font-medium">
                Prefer direct contact? Reach out through email or WhatsApp. For serious inquiries, include as much context as possible.
              </p>
              
              <div className="space-y-12">
                <div className="group">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Email</h4>
                  <a href="mailto:hello@runixtech.com" className="text-2xl md:text-3xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all tracking-tight">
                    hello@runixtech.com
                  </a>
                </div>
                <div className="group">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">WhatsApp</h4>
                  <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="text-2xl md:text-3xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all tracking-tight">
                    +91 98765 43210
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>
    </div>
  );
}
