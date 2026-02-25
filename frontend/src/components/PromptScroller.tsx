import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const promptsRow1 = [
    "जैविक टमाटर कैसे उगाएं? 🍅",
    "অর্গানিক আলু চাষের পদ্ধতি? 🥔",
    "ಅತ್ಯುತ್ತಮ ರಸಗೊಬ್ಬರ ಯಾವುದು? 🌾",
    "કપાસમાં રોગ નિયંત્રણ કેવી રીતે? 🐛",
    "ਕਣਕ ਦੀ ਬਿਜਾਈ ਕਦੋਂ ਕਰਨੀ ਹੈ? �",
    "ଧାନ ଚାଷର ପ୍ରଣାଳୀ କଣ? 🌾",
    "തെങ്ങുകൃഷിയിലെ രോഗങ്ങൾ 🥥",
];

const promptsRow2 = [
    "ಬೆಳೆ ವಿಮೆ ಮಾಹಿತಿ ಬೇಕು 📋",
    "ખેતી માટે સરકારી યોજનાઓ 🏛️",
    "ਪੰਜਾਬ ਖੇਤੀ ਲਈ ਸੁਝਾਅ 🌱",
    "ଫସଲ ବୀମା କିପରି କରିବେ? 🛡️",
    "നെൽകൃഷിക്കായുള്ള ടിപ്സ് 🌾",
    "How to improve soil health? 🌱",
    "आज का मंडी भाव क्या है? 📊",
];

const promptsRow3 = [
    "ಕೃಷಿ ಮಾಹಿತಿ ಮತ್ತು ಸಲಹೆಗಳು 💡",
    "ગુજરાતના ખેડૂતો માટે ટિપ્સ 🚜",
    "ਪੰਜਾਬੀ ਕਿਸਾਨ ਸਹਾਇਤਾ 🤝",
    "ଓଡ଼ିଆ କୃଷି ଓ ଚାଷ 🌾",
    "കന്നുകാലി പരിപാലനം 🐄",
    "Best irrigation techniques 💧",
    "மண்ணின் ತரம் மேம்படுத்த 🌿",
];

const promptsRow4 = [
    "मिट्टी की उर्वरता कैसे बढ़ाएं? 🌱",
    "আলু চাষের সহজ পদ্ধতি 🥔",
    "ಹನಿ ನೀರಾವರಿ ವೆಚ್ಚ ಎಷ್ಟು? 🚿",
    "કિસાન ક્રેડિટ કાર્ડ માહિતી 💳",
    "ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ ਤੇ ਸਬਸਿਡੀ 🚜",
    "ଫସଲର ସଠିକ ରକ୍ଷଣାବେକ୍ଷଣ 🛡️",
    "കൃഷി വിജ്ഞಾನ വ്യാപനം 📚",
];

interface ScrollingRowProps {
    prompts: string[];
    direction: 'left' | 'right';
    speed: number;
}

const ScrollingRow = ({ prompts, direction, speed }: ScrollingRowProps) => {
    const navigate = useNavigate();

    // Duplicate prompts for seamless looping (exactly twice for -50% animation)
    const dupPrompts = [...prompts, ...prompts];

    const handlePromptClick = (prompt: string) => {
        navigate('/chat', { state: { initialPrompt: prompt } });
    };

    return (
        <div className="flex overflow-hidden py-3 select-none">
            <div
                className={`flex whitespace-nowrap ${direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'}`}
                style={{ '--scroll-speed': `${speed}s` } as React.CSSProperties}
            >
                {dupPrompts.map((prompt, index) => (
                    <button
                        key={`${prompt}-${index}`}
                        onClick={() => handlePromptClick(prompt)}
                        className="group flex items-center gap-2 px-6 py-3 mr-4 bg-white/80 dark:bg-green-900/10 backdrop-blur-md border border-green-100/50 dark:border-green-500/20 rounded-full shadow-sm hover:shadow-md hover:border-green-400 dark:hover:border-green-400 transition-all duration-300 text-gray-700 dark:text-gray-100 font-medium whitespace-nowrap"
                    >
                        <Sparkles size={16} className="text-green-500 group-hover:scale-125 transition-transform" />
                        {prompt}
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-green-500" />
                    </button>
                ))}
            </div>
        </div>
    );
};

const PromptScroller = () => {
    return (
        <section className="py-12 bg-transparent overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h3 className="text-4xl sm:text-5xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                            Ask AgriGPT Anything 💬
                        </span>
                    </h3>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                        Click on any suggestion below to start a conversation
                    </p>
                </motion.div>
            </div>

            <div className="relative group pause-on-hover">
                {/* Row 1: Left to Right */}
                <ScrollingRow prompts={promptsRow1} direction="right" speed={40} />

                {/* Row 2: Right to Left */}
                <ScrollingRow prompts={promptsRow2} direction="left" speed={45} />

                {/* Row 3: Left to Right */}
                <ScrollingRow prompts={promptsRow3} direction="right" speed={50} />

                {/* Row 4: Right to Left */}
                <ScrollingRow prompts={promptsRow4} direction="left" speed={55} />

                {/* Side Gradients for fading effect - matching new bg-mesh / background colors */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#f0fdf4] via-[#f0fdf4]/50 to-transparent dark:from-[#052e16] dark:via-[#052e16]/50 pointer-events-none z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#f0fdf4] via-[#f0fdf4]/50 to-transparent dark:from-[#052e16] dark:via-[#052e16]/50 pointer-events-none z-10" />
            </div>
        </section>
    );
};

export default PromptScroller;
