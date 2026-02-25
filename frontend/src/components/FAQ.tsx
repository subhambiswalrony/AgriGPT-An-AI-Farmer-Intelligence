import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
    return (
        <motion.div
            initial={false}
            className={`mb-4 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${isOpen
                ? 'border-green-400 bg-white shadow-lg dark:border-green-500 dark:bg-gray-800'
                : 'border-green-100 bg-green-50/50 hover:border-green-200 dark:border-gray-700 dark:bg-gray-800/50'
                }`}
        >
            <button
                onClick={onClick}
                className="flex w-full items-center justify-between p-5 text-left transition-colors"
            >
                <span className={`text-lg font-semibold transition-colors duration-300 ${isOpen ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'
                    }`}>
                    {question}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'bg-green-500 text-white rotate-180' : 'bg-green-100 text-green-600 dark:bg-gray-700 dark:text-green-400'
                    }`}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                </div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="border-t border-green-100 p-5 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                            <p className="leading-relaxed">{answer}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "What is AgriGPT and how can it help me?",
            answer: "AgriGPT is an AI-powered agricultural assistant designed to help farmers make better decisions. It provides instant advice in 13+ Indian languages, detects crop diseases from images, generates personalized farming reports, and offers real-time weather and soil analysis."
        },
        {
            question: "How accurate is the disease detection feature?",
            answer: "Our AI-powered disease detection model has over 95% accuracy for common crop diseases. By analyzing uploaded photos of leaves or plants, it identifies issues and provides immediate treatment suggestions to prevent crop loss."
        },
        {
            question: "Is AgriGPT available in my local language?",
            answer: "Yes! AgriGPT currently supports over 13 Indian languages including Hindi, Marathi, Telugu, Tamil, Bengali, Punjabi, and more. Our goal is to ensure every farmer can access expert advice in the language they are most comfortable with."
        },
        {
            question: "What information is included in the Farming Reports?",
            answer: "Our reports provide comprehensive guidance based on your region and crop type. This includes optimal sowing times, fertilizer recommendations, pest management strategies, and weather-adjusted farming schedules."
        },
        {
            question: "Is my data and farm information secure?",
            answer: "Absolutely. We prioritize your privacy and data security. Any information you share, including chat history and uploaded images, is encrypted and used solely to provide you with personalized agricultural insights."
        },
        {
            question: "Do I need to pay to use AgriGPT?",
            answer: "We offer both free (Guest) and Premium access. While basic chat is free, our Premium features—like unlimited chat sessions, full history, detailed reports, and disease analysis—require a login to unlock your personalized experience."
        }
    ];

    return (
        <section className="relative py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold mb-4 border border-green-200 dark:border-green-800">
                        <HelpCircle size={16} className="mr-2" />
                        Common Questions
                    </div>
                    <h2 className="text-4xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                            Frequently Asked Questions
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Everything you need to know about AgriGPT and its features
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
