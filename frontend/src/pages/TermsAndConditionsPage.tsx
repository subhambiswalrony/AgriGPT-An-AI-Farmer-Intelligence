import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using AgriGPT ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to all of the terms, please do not use the Service. We reserve the right to modify these terms at any time, and your continued use of the Service constitutes acceptance of any changes.`,
  },
  {
    title: '2. Description of Service',
    content: `AgriGPT is an AI-powered agricultural advisory platform designed to assist farmers and agricultural professionals. The Service provides crop analysis, disease detection, weather insights, and general agricultural guidance. The information provided is for informational purposes only and should not replace professional agronomic advice.`,
  },
  {
    title: '3. User Accounts',
    content: `You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: '4. Use of the Service',
    content: `You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not misuse, reverse-engineer, or attempt to gain unauthorised access to any part of the Service. Uploading harmful, offensive, or illegal content is strictly prohibited. We reserve the right to remove any content that violates these Terms.`,
  },
  {
    title: '5. Accuracy of Information',
    content: `While we strive to provide accurate and up-to-date agricultural information, AgriGPT does not warrant the completeness, accuracy, or reliability of any information provided by the AI system. Always consult a certified agricultural expert before making significant farming decisions based on information from this Service.`,
  },
  {
    title: '6. Intellectual Property',
    content: `All content, features, and functionality of AgriGPT — including but not limited to text, graphics, logos, and software — are the exclusive property of Novice Bytes and are protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without prior written permission.`,
  },
  {
    title: '7. Privacy Policy',
    content: `Your use of the Service is also governed by our Privacy Policy. We collect and process personal data as described therein, including account information and usage data, to provide and improve the Service. We do not sell your personal data to third parties.`,
  },
  {
    title: '8. Disclaimer of Warranties',
    content: `The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.`,
  },
  {
    title: '9. Limitation of Liability',
    content: `To the fullest extent permitted by law, Novice Bytes shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. Our total liability for any claim shall not exceed the amount you paid us in the 12 months prior to the claim.`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or the use of the Service shall be subject to the exclusive jurisdiction of the courts located in India.`,
  },
  {
    title: '11. Contact Us',
    content: `If you have any questions about these Terms and Conditions, please contact us at support@agrigpt.in. We will do our best to respond within 5 business days.`,
  },
];

const TermsAndConditionsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50 dark:from-emerald-950 dark:to-gray-900 transition-colors duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-800 dark:via-emerald-800 dark:to-teal-800 py-16 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 text-8xl">📜</div>
          <div className="absolute bottom-4 right-8 text-8xl">⚖️</div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-5xl mb-4 block">📜</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Terms & Conditions
            </h1>
            <p className="text-green-100 text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using AgriGPT. By using our service, you agree to be bound by these terms.
            </p>
            <p className="text-green-200/70 text-sm mt-4">
              Last updated: February 2026
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Quick Nav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 p-5 rounded-2xl bg-white/80 dark:bg-emerald-900/40 border border-green-200/60 dark:border-emerald-700/50 shadow-sm"
        >
          <p className="text-sm font-semibold text-gray-700 dark:text-emerald-200 mb-3">
            Quick Navigation
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="text-xs px-3 py-1.5 rounded-full bg-green-100 dark:bg-emerald-800/60 text-green-700 dark:text-emerald-300 hover:bg-green-200 dark:hover:bg-emerald-700/80 transition-colors duration-200"
              >
                {s.title.split('.')[0]}.{' '}
                {s.title.split('. ')[1]?.split(' ').slice(0, 3).join(' ')}…
              </a>
            ))}
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              id={`section-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.04 }}
              className="p-6 rounded-2xl bg-white/80 dark:bg-emerald-900/40 border border-green-200/60 dark:border-emerald-700/50 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <h2 className="text-lg font-bold text-green-700 dark:text-emerald-300 mb-3 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-emerald-800 text-green-600 dark:text-emerald-300 text-xs font-bold">
                  {index + 1}
                </span>
                {section.title.replace(/^\d+\.\s/, '')}
              </h2>
              <p className="text-gray-600 dark:text-emerald-200/80 leading-relaxed text-sm">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-emerald-900/50 dark:to-teal-900/40 border border-green-200/60 dark:border-emerald-700/50 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-emerald-200/80 mb-4">
            By using AgriGPT, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditionsPage;
