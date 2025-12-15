import { Button } from "@/components/ui/button";
import { AnimatedTitle } from "@/components/AnimatedTitle";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-vibrant flex flex-col text-white">
      {/* Top Banner with Animation */}
      <div className="relative bg-white border-b border-border z-30">
        <div className="container mx-auto px-6 py-4">
          <div className="h-16">
            <AnimatedTitle />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center min-h-[80vh]">
        {/* Tagline */}
        <div className="mb-12 z-20 relative">
          <p className="text-xl md:text-2xl text-white/80 font-medium tracking-wide animate-fade-in">
            Transform inquiries into unified responses
          </p>
        </div>
        
        {/* Particle Flow Visualization */}
        <div className="relative w-full h-80 overflow-hidden mb-12">
          <svg
            viewBox="0 0 1000 300"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
              </radialGradient>
            </defs>

            {/* Stream 1 - Teal particles */}
            <g className="text-teal-400" style={{ color: 'hsl(var(--teal))' }}>
              {[...Array(12)].map((_, i) => (
                <circle
                  key={`teal-${i}`}
                  r="6"
                  fill="url(#particleGlow)"
                  className="animate-[particle-flow-1_6s_ease-in-out_infinite]"
                  style={{
                    animationDelay: `${i * 0.3}s`,
                    transformOrigin: '500px 150px'
                  }}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 0.3}s`}
                    path="M 100 120 Q 250 80 400 100 Q 600 90 700 150"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 0.3}s`}
                  />
                </circle>
              ))}
              {/* Arrow cues */}
              {[...Array(4)].map((_, i) => (
                <polygon
                  key={`teal-arrow-${i}`}
                  points="0,0 12,4 0,8 3,4"
                  fill="currentColor"
                  opacity="0.6"
                  className="animate-[particle-flow-1_6s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 1.2}s` }}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 1.2}s`}
                    path="M 100 120 Q 250 80 400 100 Q 600 90 700 150"
                    rotate="auto"
                  />
                </polygon>
              ))}
            </g>

            {/* Stream 2 - Gold particles */}
            <g className="text-gold-400" style={{ color: 'hsl(var(--gold))' }}>
              {[...Array(12)].map((_, i) => (
                <circle
                  key={`gold-${i}`}
                  r="6"
                  fill="url(#particleGlow)"
                  className="animate-[particle-flow-2_6s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 0.3 + 1}s` }}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 0.3 + 1}s`}
                    path="M 100 140 Q 300 110 450 130 Q 650 120 700 150"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 0.3 + 1}s`}
                  />
                </circle>
              ))}
              {[...Array(4)].map((_, i) => (
                <polygon
                  key={`gold-arrow-${i}`}
                  points="0,0 12,4 0,8 3,4"
                  fill="currentColor"
                  opacity="0.6"
                  style={{ animationDelay: `${i * 1.2 + 1}s` }}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 1.2 + 1}s`}
                    path="M 100 140 Q 300 110 450 130 Q 650 120 700 150"
                    rotate="auto"
                  />
                </polygon>
              ))}
            </g>

            {/* Stream 3 - Primary particles */}
            <g className="text-primary" style={{ color: 'hsl(var(--primary))' }}>
              {[...Array(12)].map((_, i) => (
                <circle
                  key={`primary-${i}`}
                  r="6"
                  fill="url(#particleGlow)"
                  style={{ animationDelay: `${i * 0.3 + 2}s` }}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 0.3 + 2}s`}
                    path="M 100 160 Q 300 190 450 170 Q 650 180 700 150"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 0.3 + 2}s`}
                  />
                </circle>
              ))}
              {[...Array(4)].map((_, i) => (
                <polygon
                  key={`primary-arrow-${i}`}
                  points="0,0 12,4 0,8 3,4"
                  fill="currentColor"
                  opacity="0.6"
                  style={{ animationDelay: `${i * 1.2 + 2}s` }}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 1.2 + 2}s`}
                    path="M 100 160 Q 300 190 450 170 Q 650 180 700 150"
                    rotate="auto"
                  />
                </polygon>
              ))}
            </g>

            {/* Stream 4 - Accent particles */}
            <g className="text-accent" style={{ color: 'hsl(var(--accent))' }}>
              {[...Array(12)].map((_, i) => (
                <circle
                  key={`accent-${i}`}
                  r="6"
                  fill="url(#particleGlow)"
                  style={{ animationDelay: `${i * 0.3 + 3}s` }}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 0.3 + 3}s`}
                    path="M 100 180 Q 250 220 400 200 Q 600 210 700 150"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 0.3 + 3}s`}
                  />
                </circle>
              ))}
              {[...Array(4)].map((_, i) => (
                <polygon
                  key={`accent-arrow-${i}`}
                  points="0,0 12,4 0,8 3,4"
                  fill="currentColor"
                  opacity="0.6"
                  style={{ animationDelay: `${i * 1.2 + 3}s` }}
                >
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    begin={`${i * 1.2 + 3}s`}
                    path="M 100 180 Q 250 220 400 200 Q 600 210 700 150"
                    rotate="auto"
                  />
                </polygon>
              ))}
            </g>

            {/* Convergence funnel effect */}
            <g className="text-white" opacity="0.3">
              <circle cx="700" cy="150" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6">
                <animate attributeName="r" values="40;55;40" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="700" cy="150" r="25" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3">
                <animate attributeName="r" values="25;40;25" dur="2s" repeatCount="indefinite"/>
              </circle>
            </g>

          </svg>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={() => navigate('/auth')} 
          size="lg"
          className="text-lg px-12 py-6 bg-white text-primary hover:bg-white/90 font-semibold shadow-2xl hover:shadow-primary/25 transform hover:scale-105 transition-all duration-300 border-0"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}