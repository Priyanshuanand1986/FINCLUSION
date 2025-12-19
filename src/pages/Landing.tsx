import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import '../styles/Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Apply dark theme class to document body
    document.body.className = 'dark-theme';
    document.body.style.backgroundColor = '#000000';
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark-theme bg-[#000000] text-white overflow-hidden">
      <Header
        isDarkMode={true}
        profileData={null}
        onEditProfile={() => { }}
        onSignUp={() => navigate('/register')}
        onBrowseCoursesClick={() => { }}
      />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 px-6 md:px-12 flex flex-col items-center text-center justify-center min-h-[80vh] overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#000000] via-[#0a0a0a] to-[#051a0d] z-0" />

          {/* Animated Circles/Blobs */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-[#00BF63] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />

          <motion.div
            className="relative z-10 max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
              variants={fadeInUp}
            >
              Master Your Money <br /> With <span className="text-[#00BF63]">Confidence</span>
            </motion.h1>

            <motion.p
              className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Take control of your finances with our intuitive budgeting tool. Track expenses, analyze spending habits, and grow your wealth—all in one place.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-[#00BF63] hover:bg-[#009e52] text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,191,99,0.3)]"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-transparent border border-gray-600 hover:border-[#00BF63] text-white font-semibold rounded-full transition-all hover:text-[#00BF63]"
              >
                Log In
              </button>
            </motion.div>
          </motion.div>

          {/* Hero Image Mockup (Optional/CSS based) */}
          <motion.div
            className="relative z-10 mt-16 w-full max-w-5xl mx-auto perspective-1000"
            initial={{ opacity: 0, rotateX: 20 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-[#111] p-2 md:p-4 rotate-x-12 transform-gpu hover:rotate-x-0 transition-transform duration-700 ease-out">
              {/* Abstract Dashboard Representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                <div className="col-span-2 space-y-4">
                  <div className="h-40 rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 rounded-lg bg-gray-800 animate-pulse delay-75"></div>
                    <div className="h-32 rounded-lg bg-gray-800 animate-pulse delay-150"></div>
                  </div>
                </div>
                <div className="col-span-1 space-y-4">
                  <div className="h-20 rounded-lg bg-gray-800 animate-pulse delay-100"></div>
                  <div className="h-20 rounded-lg bg-gray-800 animate-pulse delay-200"></div>
                  <div className="h-20 rounded-lg bg-gray-800 animate-pulse delay-300"></div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="relative z-20 py-24 px-6 md:px-12 bg-[#050505] -mt-32 pt-40">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose <span className="text-[#00BF63]">Us?</span></h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to manage your personal finances effectively, without the complexity.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: 'Smart Tracking',
                  description: 'Automatically categorize your expenses and see exactly where your money goes.',
                  icon: (
                    <svg className="w-8 h-8 text-[#00BF63]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                },
                {
                  title: 'Visual Analytics',
                  description: 'Beautiful charts and graphs help you visualize your financial health at a glance.',
                  icon: (
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  )
                },
                {
                  title: 'Secure Budgeting',
                  description: 'Set monthly budgets and get alerts when you\'re close to your limits.',
                  icon: (
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                },
                {
                  title: 'Goal Setting',
                  description: 'Define your financial goals and track your progress towards achieving them.',
                  icon: (
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-[#111] p-6 rounded-2xl border border-gray-800 hover:border-[#00BF63] hover:shadow-lg hover:shadow-[#00BF63]/10 transition-all duration-300 group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <div className="mb-4 p-3 bg-gray-900 rounded-lg inline-block group-hover:bg-gray-800 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-[#00BF63] transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-6 md:px-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#00BF63] opacity-5"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl font-bold mb-6">Ready to Take Control?</h2>
            <p className="text-xl text-gray-400 mb-8">Join thousands of users who are already managing their finances smarter.</p>
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-[#00BF63] hover:bg-[#009e52] text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-xl"
            >
              Start Your Journey Now
            </button>
          </div>
        </section>
      </main>

      <Footer isDarkMode={true} profileData={null} />
    </div>
  );
};

export default Landing;