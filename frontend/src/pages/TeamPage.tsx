import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Cpu, BrainCircuit, MessageCircleCode, BarChart4, Users, Sparkles, Award, Target } from 'lucide-react';
import Footer from '../components/Footer';

import viveka from '../assets/vivekananda.jpg';
import tusar from '../assets/tusar.jpeg';
import subham from '../assets/Rony.jpg';
import swabhiman from '../assets/swabhiman.jpeg';


const TeamPage = () => {
  const teamMembers = [
    {
      name: 'Subham Biswal',
      role: '💬 Chat System Developer',
      description: 'Built the full-stack Chat System — AI chat interface, voice input, multi-session management, and Faster Whisper speech-to-text integration',
      icon: MessageCircleCode, 
      gradient: 'from-green-400 to-green-600',
      skills: ['Python', 'Flask', 'React', 'Faster Whisper', 'MongoDB'],
      image: subham,
      social: {
        github: 'https://github.com/subhambiswalrony',
        linkedin: 'https://www.linkedin.com/in/subham-biswal',
        email: 'biswalsubhamrony@gmail.com'
      }
    },
    {
      name: 'Vivekananda Champati',
      role: '🌿 Upload & Disease Detection Developer',
      description: 'Built the full-stack AI Plant Disease Detection system — leaf image upload UI, Flask prediction proxy, and ML model integration',
      icon: Cpu, 
      gradient: 'from-purple-400 to-purple-600',
      skills: ['Python', 'Flask', 'React', 'TypeScript', 'TailwindCSS'],
      image: viveka,
      social: {
        github: 'https://github.com/champati-v',
        linkedin: 'https://www.linkedin.com/in/vchampati',
        email: 'vibekanandac15@gmail.com'
      }
    },
    {
      name: 'Tusarkanta Das',
      role: '🌦️ Weather & Soil System Developer',
      description: 'Built the full-stack Weather & Soil Analysis system — Node.js microservice, real-time weather dashboard, AI soil analysis, and hourly forecast charts',
      icon: BrainCircuit,
      gradient: 'from-blue-400 to-blue-600',
      skills: ['Node.js', 'Express', 'React', 'OpenWeatherMap', 'Gemini AI'],
      image: tusar,
      social: {
        github: 'https://github.com/Tusar2202196',
        linkedin: 'https://www.linkedin.com/in/tusar-kanta-das-126440307',
        email: 'tusarkantadas911@gmail.com'
      }
    },
    
    {
      name: 'Swabhiman Mohanty',
      role: '📄 Report System Developer',
      description: 'Built the full-stack Farming Report system — AI-powered report generation in 13 languages, PDF download, region-specific farming calendar and fertilizer plans',
      icon: BarChart4, 
      gradient: 'from-orange-400 to-orange-600',
      skills: ['Python', 'Flask', 'React', 'Gemini AI', 'WeasyPrint'],
      image: swabhiman,
      social: {
        github: 'https://github.com/Swaviman-git',
        linkedin: 'https://www.linkedin.com/in/swaviman-mohanty-57355b291',
        email: 'swavimanmohanty2004@gmail.com'
      }
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 transition-colors duration-500 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-green-400/10 dark:bg-green-500/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 8,
              delay: i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 relative"
        >
          {/* Floating Team Icons */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -left-12 top-0 text-5xl opacity-20 pointer-events-none hidden lg:block"
          >
            👥
          </motion.div>
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -right-12 top-8 text-5xl opacity-20 pointer-events-none hidden lg:block"
          >
            🌱
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="inline-block relative mb-6"
          >
            {/* Pulsing Glow Effect */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 blur-3xl rounded-full"
            />
            <h1 className="relative text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent pb-2 leading-tight transition-all duration-300">
              👥 Meet Our Team
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 dark:text-gray-300 mb-6 font-medium transition-colors duration-300"
          >
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              The brilliant minds behind AgriGPT
            </motion.span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-teal-500/20 backdrop-blur-xl px-6 py-3 rounded-full border-2 border-green-500/30 dark:border-green-500/50 shadow-lg transition-colors duration-300"
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-2xl"
            >
              🌿
            </motion.span>
            <span className="font-bold text-green-600 dark:text-green-400 transition-colors duration-300">Novice Bytes</span>
            <span className="text-green-500 dark:text-green-300 transition-colors duration-300">| 2025</span>
          </motion.div>
        </motion.div>

        {/* Enhanced Team Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-6 mb-12 justify-center items-center max-w-6xl mx-auto"
        >
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{
                scale: 1.05,
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="group w-64 flex-shrink-0"
            >
              <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-200/30 dark:border-green-700/30 min-h-[480px] flex flex-col">
                {/* Gradient Background on Hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 dark:from-green-500/20 dark:via-emerald-500/20 dark:to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />

                {/* Profile Image */}
                <div className="relative pt-8 flex justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative"
                  >
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-200 dark:border-green-700 shadow-2xl">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Pulsing Ring */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 border-4 border-green-500 dark:border-green-400 rounded-full"
                    />
                  </motion.div>
                </div>

                {/* Card Content */}
                <div className="relative pt-6 p-6 text-center">
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2 transition-colors duration-300"
                  >
                    {member.name}
                  </motion.h3>

                  <p className="text-base font-semibold text-gray-700 dark:text-white mb-3 transition-colors duration-300">
                    {member.role}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed transition-colors duration-300">
                    {member.description}
                  </p>

                  {/* Skills - Enhanced */}
                  <div className="mb-5">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {member.skills.map((skill, skillIndex) => (
                        <motion.span
                          key={skillIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + skillIndex * 0.1 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                          className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full border border-green-300 dark:border-green-700 transition-colors duration-300"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Social Links - Enhanced */}
                  <div className="flex justify-center space-x-3">
                    <motion.a
                      whileHover={{ scale: 1.2, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      href={member.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center hover:shadow-lg transition-all duration-300 border border-gray-300 dark:border-gray-600"
                    >
                      <Github size={18} className="text-gray-700 dark:text-gray-300" />
                    </motion.a>
                    <motion.a
                      whileHover={{ scale: 1.2, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl flex items-center justify-center hover:shadow-lg transition-all duration-300 border border-blue-300 dark:border-blue-700"
                    >
                      <Linkedin size={18} className="text-blue-600 dark:text-blue-400" />
                    </motion.a>
                    <motion.a
                      whileHover={{ scale: 1.2, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      href={`mailto:${member.social.email}`}
                      className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/40 rounded-xl flex items-center justify-center hover:shadow-lg transition-all duration-300 border border-green-300 dark:border-green-700"
                    >
                      <Mail size={18} className="text-green-600 dark:text-green-400" />
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative backdrop-blur-xl bg-gradient-to-r from-green-500/90 via-emerald-500/90 to-teal-500/90 dark:from-green-600/90 dark:via-emerald-600/90 dark:to-teal-600/90 text-white rounded-3xl p-8 text-center shadow-2xl border-2 border-green-400/30 dark:border-green-700/50 overflow-hidden"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              animate={{ 
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-full h-full"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Award size={48} className="text-yellow-300" />
            </div>

            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <span>🏆</span>
              <span>About AgriGPT</span>
            </h2>
            <p className="text-lg opacity-95 mb-8 max-w-3xl mx-auto leading-relaxed">
              AgriGPT is our submission for the International Generative AI Hackathon focused on
              sustainability and smart agriculture. We're passionate about leveraging AI technology
              to empower farmers and improve agricultural productivity across India.
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <div className="text-4xl mb-3">🌱</div>
                <h3 className="font-bold text-xl mb-2">Sustainability</h3>
                <p className="text-sm opacity-90">Eco-friendly farming solutions</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="font-bold text-xl mb-2">AI-Powered</h3>
                <p className="text-sm opacity-90">Advanced machine learning</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20"
              >
                <div className="text-4xl mb-3">👨‍🌾</div>
                <h3 className="font-bold text-xl mb-2">Farmer-First</h3>
                <p className="text-sm opacity-90">Designed for Indian farmers</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="mt-12 -mx-4 -mb-4">
        <Footer />
      </div>
    </div>
  );
};

export default TeamPage;