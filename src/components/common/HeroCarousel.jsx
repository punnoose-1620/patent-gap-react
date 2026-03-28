import React, { useState, useEffect } from 'react';
import { FileText, Shield, Brain, Lock, Eye, Award, Scale, Fingerprint, BookOpen, CheckCircle, TrendingUp, FileCheck, Scroll, Copyright, Cpu, Zap, Globe, Search, AlertCircle, Database } from 'lucide-react';

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [particles, setParticles] = useState([]);
  const [neurons, setNeurons] = useState([]);
  const [matrixRain, setMatrixRain] = useState([]);

  const slides = [
    {
      title: 'Patent Gap AI Inc.',
      subtitle: 'Building the Global Standard',
      description: 'Detect patent infringement before it reaches litigation. Claim-level AI analysis maps your patents against public filings and live products — delivering attorney-ready findings in minutes, not months.',
      icon: Shield,
      color: 'from-emerald-400 to-teal-500',
    },
    {
      title: 'AI-Powered Detection',
      subtitle: 'Real-Time Patent Monitoring',
      description: 'Every claim in your portfolio is continuously matched against USPTO filings, Espacenet, and live product data. When overlap is detected, you get a structured report — not a raw data dump.',
      icon: Eye,
      color: 'from-green-400 to-emerald-500',
    },
    {
      title: 'Proactive Protection',
      subtitle: 'Stay Ahead of Infringement',
      description: 'Stop reacting to infringement after the damage is done. Patent Gap AI monitors your portfolio 24/7 and surfaces potential violations with claim-by-claim evidence chains ready for legal review.',
      icon: AlertCircle,
      color: 'from-teal-400 to-cyan-500',
    },
  ];

  useEffect(() => {
    setParticles(
      Array.from({ length: 120 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 0.5,
        duration: Math.random() * 12 + 6,
        delay: Math.random() * 5,
        type: i % 4,
      }))
    );

    setNeurons(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        connections: Math.floor(Math.random() * 3) + 2,
      }))
    );

    setMatrixRain(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: (i * 5.5) + (Math.random() * 3),
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 4,
      }))
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((p) => (p + 1) % slides.length),
      8000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #001a14 0%, #002920 25%, #003d2e 50%, #002920 75%, #001a14 100%)',
      }}
    >
      {/* ANIMATED CIRCUIT BOARD PATTERN */}
      <div className="absolute inset-0 opacity-15">
        <svg className="w-full h-full">
          <defs>
            <pattern id="circuitPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="2" fill="#10b981" opacity="0.4"/>
              <line x1="40" y1="40" x2="80" y2="40" stroke="#10b981" strokeWidth="0.5" opacity="0.3"/>
              <line x1="40" y1="40" x2="40" y2="0" stroke="#10b981" strokeWidth="0.5" opacity="0.3"/>
              <circle cx="10" cy="10" r="1.5" fill="#34d399" opacity="0.3"/>
              <circle cx="70" cy="10" r="1.5" fill="#6ee7b7" opacity="0.3"/>
              <circle cx="10" cy="70" r="1.5" fill="#34d399" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuitPattern)" 
                style={{ animation: 'circuitFlow 30s linear infinite' }}/>
        </svg>
      </div>

      {/* ENHANCED MATRIX RAIN EFFECT */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        {matrixRain.map((rain) => (
          <div
            key={rain.id}
            className="absolute top-0 flex flex-col gap-1"
            style={{
              left: `${rain.x}%`,
              animation: `matrixFall ${rain.duration}s linear infinite`,
              animationDelay: `${rain.delay}s`,
            }}
          >
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="text-xs font-mono"
                style={{
                  color: i === 0 ? '#6ee7b7' : '#10b981',
                  opacity: 1 - (i * 0.08),
                  textShadow: i === 0 ? '0 0 10px rgba(16, 185, 129, 1)' : '0 0 8px rgba(16, 185, 129, 0.6)',
                }}
              >
                {Math.random() > 0.5 ? '1' : '0'}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* ENHANCED NEURAL NETWORK */}
      <svg className="absolute inset-0 w-full h-full opacity-25" style={{ pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="lineGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.9 }} />
            <stop offset="50%" style={{ stopColor: '#34d399', stopOpacity: 0.7 }} />
            <stop offset="100%" style={{ stopColor: '#6ee7b7', stopOpacity: 0.9 }} />
          </linearGradient>
          
          <filter id="glowGreen">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {neurons.map((neuron, i) => 
          Array.from({ length: neuron.connections }).map((_, j) => {
            const targetIndex = (i + j * 5) % neurons.length;
            const target = neurons[targetIndex];
            return (
              <line
                key={`${i}-${j}`}
                x1={`${neuron.x}%`}
                y1={`${neuron.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke="url(#lineGradGreen)"
                strokeWidth="2"
                filter="url(#glowGreen)"
                opacity="0.5"
                style={{
                  animation: `neuralPulse ${4 + (i % 3)}s ease-in-out infinite`,
                  animationDelay: `${j * 0.5}s`,
                }}
              />
            );
          })
        )}
        
        {neurons.map((neuron, i) => (
          <g key={`node-${i}`}>
            <circle
              cx={`${neuron.x}%`}
              cy={`${neuron.y}%`}
              r="8"
              fill="rgba(16, 185, 129, 0.2)"
              style={{
                animation: `nodeHalo ${3 + (i % 2)}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
            <circle
              cx={`${neuron.x}%`}
              cy={`${neuron.y}%`}
              r="4"
              fill="#10b981"
              filter="url(#glowGreen)"
              style={{
                animation: `nodePulse ${3 + (i % 2)}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          </g>
        ))}
      </svg>

      {/* PATENT-THEMED FLOATING ICONS - Hidden on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        {[
          { Icon: FileText, x: 8, y: 15, duration: 22, size: 68 },
          { Icon: Shield, x: 85, y: 20, duration: 25, size: 64 },
          { Icon: Award, x: 12, y: 65, duration: 24, size: 60 },
          { Icon: Scale, x: 88, y: 70, duration: 26, size: 56 },
          { Icon: Fingerprint, x: 50, y: 10, duration: 23, size: 62 },
          { Icon: Copyright, x: 90, y: 45, duration: 27, size: 58 },
          { Icon: FileCheck, x: 5, y: 45, duration: 21, size: 66 },
          { Icon: Scroll, x: 48, y: 85, duration: 28, size: 60 },
          { Icon: BookOpen, x: 25, y: 35, duration: 24, size: 62 },
          { Icon: TrendingUp, x: 70, y: 55, duration: 26, size: 58 },
          { Icon: Lock, x: 15, y: 80, duration: 25, size: 64 },
          { Icon: Database, x: 82, y: 8, duration: 23, size: 60 },
        ].map((item, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: 0.08,
              animation: `float3D ${item.duration}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          >
            <item.Icon size={item.size} className="text-emerald-400" 
                       style={{ filter: 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.6))' }}/>
          </div>
        ))}
      </div>

      {/* ENHANCED PARTICLES */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `particleFloat ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          >
            <div
              className="relative rounded-full"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.type === 0 ? '#10b981' : p.type === 1 ? '#34d399' : p.type === 2 ? '#6ee7b7' : '#059669',
                opacity: 0.6,
                boxShadow: `0 0 ${p.size * 5}px ${p.type === 0 ? 'rgba(16,185,129,0.8)' : p.type === 1 ? 'rgba(52,211,153,0.7)' : p.type === 2 ? 'rgba(110,231,183,0.8)' : 'rgba(5,150,105,0.7)'}`,
              }}
            />
          </div>
        ))}
      </div>

      {/* ENHANCED SCANNING BEAMS - Hidden on mobile */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15 hidden md:block">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute h-full w-1.5"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.9), rgba(52,211,153,0.8), transparent)',
              left: `${i * 25 + 10}%`,
              animation: `energyScan ${6 + i * 1.5}s ease-in-out infinite`,
              animationDelay: `${i * 1.2}s`,
              boxShadow: '0 0 30px rgba(16,185,129,0.8)',
            }}
          />
        ))}
      </div>

      {/* ENHANCED GLOWING ORBS - Responsive sizing */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 'min(500px, 40vw)',
            height: 'min(500px, 40vw)',
            background: 'radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)',
            animation: 'orbFloat1 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 'min(450px, 35vw)',
            height: 'min(450px, 35vw)',
            background: 'radial-gradient(circle, rgba(52,211,153,0.25), transparent 70%)',
            animation: 'orbFloat2 24s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 'min(400px, 30vw)',
            height: 'min(400px, 30vw)',
            background: 'radial-gradient(circle, rgba(110,231,183,0.2), transparent 70%)',
            animation: 'orbFloat3 28s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes circuitFlow {
          0% { transform: translate(0, 0); }
          100% { transform: translate(80px, 80px); }
        }

        @keyframes matrixFall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        @keyframes particleFloat {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          25% { 
            transform: translate(50px, -70px) scale(1.4);
            opacity: 0.8;
          }
          50% { 
            transform: translate(-40px, -140px) scale(0.9);
            opacity: 0.6;
          }
          75% { 
            transform: translate(60px, -100px) scale(1.2);
            opacity: 0.7;
          }
        }

        @keyframes float3D {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          25% { 
            transform: translate(120px, -60px) rotate(90deg) scale(1.15);
          }
          50% { 
            transform: translate(180px, 60px) rotate(180deg) scale(0.9);
          }
          75% { 
            transform: translate(80px, 120px) rotate(270deg) scale(1.08);
          }
        }

        @keyframes neuralPulse {
          0%, 100% { opacity: 0.4; stroke-width: 2; }
          50% { opacity: 1; stroke-width: 3; }
        }

        @keyframes nodePulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(2); }
        }

        @keyframes nodeHalo {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(2.5); }
        }

        @keyframes energyScan {
          0% { 
            top: -150%;
            opacity: 0;
          }
          50% { 
            opacity: 1;
          }
          100% { 
            top: 250%;
            opacity: 0;
          }
        }

        @keyframes orbFloat1 {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            top: 5%; left: -15%;
          }
          33% { 
            transform: translate(min(400px, 25vw), min(200px, 15vh)) scale(1.3);
            top: 35%; left: 45%;
          }
          66% { 
            transform: translate(min(-150px, -10vw), min(280px, 20vh)) scale(0.9);
            top: 65%; left: 8%;
          }
        }

        @keyframes orbFloat2 {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            top: 15%; right: -15%;
          }
          50% { 
            transform: translate(min(-350px, -20vw), min(250px, 18vh)) scale(1.2);
            top: 55%; right: 35%;
          }
        }

        @keyframes orbFloat3 {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            bottom: 10%; left: 50%;
          }
          50% { 
            transform: translate(min(200px, 15vw), min(-200px, -15vh)) scale(1.15);
            bottom: 45%; left: 20%;
          }
        }

        @keyframes hologramFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes documentFloat {
          0%, 100% { 
            transform: translateY(0) rotate(0deg);
            opacity: 0.95;
          }
          50% { 
            transform: translateY(-20px) rotate(4deg);
            opacity: 1;
          }
        }

        @keyframes borderPulse {
          0%, 100% { 
            borderColor: rgba(16,185,129,0.4);
            boxShadow: 0 0 30px rgba(16,185,129,0.3);
          }
          50% { 
            borderColor: rgba(16,185,129,0.8);
            boxShadow: 0 0 50px rgba(16,185,129,0.6), inset 0 0 30px rgba(16,185,129,0.3);
          }
        }

        @keyframes stampFloat {
          0%, 100% { 
            transform: translateY(0) rotate(var(--rotation));
            opacity: 0.5;
          }
          50% { 
            transform: translateY(-10px) rotate(var(--rotation));
            opacity: 0.8;
          }
        }

        @keyframes rippleExpand {
          0% { 
            transform: scale(0.5);
            opacity: 0.4;
          }
          50% {
            opacity: 0.2;
          }
          100% { 
            transform: scale(3.5);
            opacity: 0;
          }
        }

        @keyframes gentleFloat {
          0%, 100% { 
            transform: translateY(0) scale(1);
            opacity: 0.1;
          }
          50% { 
            transform: translateY(-25px) scale(1.15);
            opacity: 0.15;
          }
        }

        @keyframes scan {
          0% { top: -35%; }
          100% { top: 135%; }
        }

        @keyframes patentPulse {
          0%, 100% { 
            transform: scale(1) rotateY(0deg);
            filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.6));
          }
          50% { 
            transform: scale(1.05) rotateY(5deg);
            filter: drop-shadow(0 0 40px rgba(16, 185, 129, 1));
          }
        }

        @keyframes globeRotate {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }

        @keyframes dataFlow {
          0%, 100% { 
            height: 0;
            opacity: 0;
          }
          50% { 
            height: 4rem;
            opacity: 1;
          }
        }
      `}</style>

      {/* SLIDES */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-full flex items-center relative z-10 py-8 md:py-12 lg:py-16">
            <div className="grid lg:grid-cols-2 gap-6 md:gap-10 lg:gap-12 xl:gap-20 w-full items-center">

              {/* LEFT CONTENT */}
              <div style={{ animation: index === current ? 'slideIn 1s ease-out' : 'none' }}>
                {/* Icon Badge */}
                <div className="mb-4 md:mb-6 lg:mb-8 inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 lg:px-6 py-1.5 md:py-2 lg:py-3 rounded-full bg-black/30 backdrop-blur-xl border-2 border-emerald-400/50"
                     style={{ boxShadow: '0 0 40px rgba(16,185,129,0.5), inset 0 0 20px rgba(16,185,129,0.1)' }}>
                  <slide.icon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-emerald-400" style={{ filter: 'drop-shadow(0 0 12px rgba(16,185,129,1))', animation: 'patentPulse 3s ease-in-out infinite' }} />
                  <span className="text-emerald-300 text-xs md:text-sm lg:text-base font-bold tracking-wide">AI-POWERED PROTECTION</span>
                </div>

                <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold mb-3 md:mb-4 lg:mb-6 leading-tight md:whitespace-nowrap"
                    style={{ textShadow: '0 0 50px rgba(16,185,129,0.4)' }}>
                  {slide.title}
                </h1>
                <p
                  className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 lg:mb-8 leading-tight"
                  style={{
                    background: `linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 40px rgba(16,185,129,0.5))',
                  }}
                >
                  {slide.subtitle}
                </p>

                <p className="text-slate-300 text-sm sm:text-base md:text-base lg:text-lg xl:text-xl max-w-2xl leading-relaxed mb-6 md:mb-8 lg:mb-10"
                   style={{ textShadow: '0 2px 15px rgba(0,0,0,0.7)' }}>
                  {slide.description}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <button className="px-6 md:px-8 lg:px-10 py-3 md:py-3.5 lg:py-4 rounded-full font-bold text-sm md:text-base text-black bg-linear-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                          style={{ boxShadow: '0 0 30px rgba(16,185,129,0.6)' }}>
                    Analyse My Patents
                  </button>
                  <button className="px-6 md:px-8 lg:px-10 py-3 md:py-3.5 lg:py-4 rounded-full font-bold text-sm md:text-base text-emerald-400 border-2 border-emerald-400 hover:bg-emerald-400/10 transition-all duration-300 transform hover:scale-105"
                          style={{ boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                    See a Sample Report
                  </button>
                </div>
              </div>

              {/* RIGHT ANIMATION – PATENT DOCUMENT NETWORK */}
              <div className="relative hidden lg:flex items-center justify-center" style={{ height: 'min(500px, 50vh)', perspective: '1800px' }}>

                {/* Holographic Display Frame */}
                <div
                  className="absolute inset-0 rounded-3xl border-2"
                  style={{
                    borderImage: 'linear-gradient(135deg, rgba(16,185,129,0.7), rgba(52,211,153,0.5), rgba(16,185,129,0.7)) 1',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(52,211,153,0.08))',
                    backdropFilter: 'blur(20px)',
                    boxShadow: `
                      0 0 100px rgba(16,185,129,0.5),
                      inset 0 0 100px rgba(16,185,129,0.1),
                      0 0 150px rgba(52,211,153,0.4)
                    `,
                    animation: 'hologramFlicker 4s ease-in-out infinite',
                  }}
                />

                {/* Animated Circular Ripples */}
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border-2 border-emerald-400"
                    style={{
                      width: '130px',
                      height: '130px',
                      left: `${15 + i * 20}%`,
                      top: `${25 + (i % 2) * 35}%`,
                      opacity: 0.2,
                      animation: `rippleExpand ${5 + i}s ease-out infinite`,
                      animationDelay: `${i * 1.2}s`,
                    }}
                  />
                ))}

                {/* Central Patent Document Network Globe */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative" style={{ animation: 'globeRotate 40s linear infinite', transformStyle: 'preserve-3d' }}>
                    <Globe size={220} className="text-emerald-400" 
                           style={{ 
                             filter: 'drop-shadow(0 0 50px rgba(16,185,129,1))',
                             opacity: 0.25
                           }}/>
                  </div>
                </div>

                {/* Additional Floating Patent Icons */}
                {[
                  { Icon: FileCheck, x: 20, y: 20 },
                  { Icon: Search, x: 75, y: 25 },
                  { Icon: Database, x: 30, y: 70 },
                  { Icon: Shield, x: 70, y: 75 },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      opacity: 0.12,
                      animation: `gentleFloat ${6 + i * 0.8}s ease-in-out infinite`,
                      animationDelay: `${i * 0.6}s`,
                    }}
                  >
                    <item.Icon size={60} className="text-emerald-400" 
                               style={{ filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.6))' }}/>
                  </div>
                ))}

                {/* Vertical Scanning Beams */}
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-full"
                    style={{
                      left: `${20 + i * 20}%`,
                      background: 'linear-gradient(to bottom, transparent, rgba(16,185,129,0.9), rgba(52,211,153,0.7), transparent)',
                      animation: `scan ${3 + i * 0.6}s linear infinite`,
                      animationDelay: `${i * 0.8}s`,
                      boxShadow: '0 0 30px rgba(16,185,129,1)',
                    }}
                  />
                ))}

                {/* PATENT-FOCUSED FLOATING CARDS */}
                <div className="relative w-full h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                  {[
                    { Icon: FileText, label: 'Patent Docs', pos: { x: -140, y: -80, z: 0 }, delay: 0 },
                    { Icon: Eye, label: 'Monitor', pos: { x: 0, y: -105, z: 70 }, delay: 0.5 },
                    { Icon: Shield, label: 'Protect', pos: { x: 140, y: -80, z: 35 }, delay: 1 },
                    { Icon: Search, label: 'Analyze', pos: { x: -120, y: 80, z: 55 }, delay: 1.5 },
                    { Icon: AlertCircle, label: 'Detect', pos: { x: 120, y: 80, z: 45 }, delay: 2 },
                    { Icon: CheckCircle, label: 'Verify', pos: { x: 0, y: 105, z: 25 }, delay: 2.5 },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="absolute rounded-2xl flex flex-col items-center justify-center gap-2 lg:gap-3 xl:gap-4"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: 'clamp(130px, 11vw, 170px)',
                        height: 'clamp(150px, 13vw, 200px)',
                        marginLeft: `${item.pos.x}px`,
                        marginTop: `${item.pos.y}px`,
                        background: 'linear-gradient(135deg, rgba(1, 26, 20, 0.95), rgba(0, 61, 46, 0.9))',
                        border: '2px solid rgba(16,185,129,0.7)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: `
                          0 15px 50px rgba(16,185,129,0.5),
                          inset 0 0 40px rgba(16,185,129,0.2),
                          0 0 80px rgba(52,211,153,0.4)
                        `,
                        animation: `documentFloat ${5 + i * 0.7}s ease-in-out infinite`,
                        animationDelay: `${item.delay}s`,
                        transform: `translateZ(${item.pos.z}px)`,
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <item.Icon className="text-emerald-400 w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14" strokeWidth={1.5} 
                                 style={{ filter: 'drop-shadow(0 0 15px rgba(16,185,129,1))' }}/>
                      <span className="text-xs lg:text-sm xl:text-base text-emerald-300 font-bold">{item.label}</span>
                      <div className="w-14 lg:w-16 xl:w-20 h-2 rounded-full bg-linear-to-r from-emerald-500 via-green-500 to-teal-500"
                           style={{ boxShadow: '0 0 20px rgba(16,185,129,1)' }}/>
                    </div>
                  ))}
                </div>

                {/* Glowing Border Pulse Effect */}
                <div 
                  className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{
                    border: '3px solid rgba(16,185,129,0.4)',
                    animation: 'borderPulse 3s ease-in-out infinite',
                  }}
                />
                
                {/* Floating Status Badges */}
                {[
                  { text: 'AI POWERED', x: 12, y: 10, rotation: -6 },
                  { text: 'REAL-TIME', x: 75, y: 12, rotation: 4 },
                  { text: 'PROTECTED', x: 8, y: 82, rotation: 2 },
                  { text: 'VERIFIED', x: 72, y: 85, rotation: -5 },
                ].map((stamp, i) => (
                  <div
                    key={i}
                    className="absolute px-2 lg:px-3 xl:px-4 py-1 lg:py-1.5 xl:py-2 text-xs font-bold border-2 rounded-lg"
                    style={{ 
                      left: `${stamp.x}%`,
                      top: `${stamp.y}%`,
                      transform: `rotate(${stamp.rotation}deg)`,
                      color: 'rgba(16,185,129,0.5)',
                      borderColor: 'rgba(16,185,129,0.4)',
                      background: 'rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(10px)',
                      animation: `stampFloat ${3.5 + i * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.4}s`,
                      textShadow: '0 0 15px rgba(16,185,129,0.7)',
                      boxShadow: '0 0 20px rgba(16,185,129,0.3)',
                    }}
                  >
                    {stamp.text}
                  </div>
                ))}

                {/* Real-time Status Indicators */}
                <div className="absolute top-4 lg:top-5 xl:top-6 right-4 lg:right-5 xl:right-6 flex flex-col gap-2 lg:gap-2.5 xl:gap-3">
                  {[
                    { label: 'Monitoring', color: '#10b981' },
                    { label: 'Analyzing', color: '#34d399' },
                    { label: 'Protected', color: '#6ee7b7' }
                  ].map((status, i) => (
                    <div key={i} className="flex items-center gap-2 lg:gap-2.5 xl:gap-3 px-3 lg:px-4 xl:px-5 py-1.5 lg:py-2 xl:py-2.5 rounded-full bg-black/60 backdrop-blur-xl border-2 border-emerald-400/50"
                         style={{ boxShadow: '0 0 30px rgba(16,185,129,0.4)' }}>
                      <div 
                        className="w-2 h-2 lg:w-2.5 lg:h-2.5 xl:w-3 xl:h-3 rounded-full"
                        style={{ 
                          background: status.color,
                          animation: 'nodePulse 3s ease-in-out infinite',
                          animationDelay: `${i * 0.5}s`,
                          boxShadow: `0 0 15px ${status.color}`,
                        }} 
                      />
                      <span className="text-xs lg:text-xs xl:text-sm text-emerald-300 font-bold">{status.label}</span>
                    </div>
                  ))}
                </div>

                {/* Data Flow Indicators */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 lg:w-1.5 xl:w-2 rounded-full"
                    style={{
                      left: `${15 + i * 12}%`,
                      bottom: '10%',
                      height: '0',
                      background: 'linear-gradient(to top, rgba(16,185,129,0), rgba(16,185,129,0.8))',
                      animation: `dataFlow ${2 + i * 0.3}s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                      boxShadow: '0 0 20px rgba(16,185,129,0.8)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ENHANCED DOTS INDICATOR */}
      <div className="absolute bottom-4 md:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`relative transition-all ${
              i === current ? 'w-10 md:w-12 lg:w-16' : 'w-3 md:w-3.5 lg:w-4'
            } h-3 md:h-3.5 lg:h-4 rounded-full overflow-hidden cursor-pointer`}
            style={{
              background: i === current 
                ? 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7)' 
                : 'rgba(255,255,255,0.25)',
              boxShadow: i === current ? '0 0 25px rgba(16,185,129,0.8)' : '0 0 10px rgba(255,255,255,0.2)',
              border: i === current ? '1px solid rgba(16,185,129,0.6)' : '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {i === current && (
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                  animation: 'circuitFlow 2.5s linear infinite',
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
