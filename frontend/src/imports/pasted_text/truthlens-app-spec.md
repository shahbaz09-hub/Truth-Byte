Build a full-stack web application called "TruthLens" — 
an AI-powered misinformation detection platform.

=== TECH STACK ===
Frontend: React + Tailwind CSS
Backend: Spring Boot + PostgreSQL
AI: Google Gemini API

=== DESIGN PHILOSOPHY ===
This should feel like a premium investigative journalism 
tool meets cyberpunk intelligence platform. Think — 
Bloomberg Terminal crossed with a noir detective office.

Dark theme: Deep blacks (#0A0A0F), midnight navy (#080B1A),
with electric accent colors: cyan (#00F5FF), 
amber (#FFB800), crimson (#FF2D55).

Typography: Sharp, editorial. Use "Bebas Neue" for 
headings, "IBM Plex Mono" for data/scores, 
"Inter" for body.

NO generic purple gradients. NO cookie-cutter cards.
NO boring flat UI. This must feel ALIVE.

=== VISUAL EFFECTS (Must Have) ===

1. HERO SECTION:
   - Animated particle network background (canvas/Three.js)
   - Particles connect when mouse moves near them
   - Floating 3D globe wireframe showing "fake news 
     spreading" with red pulse points across countries
   - Glitch text animation on "TruthLens" title
   - Scanline overlay effect (subtle CRT feel)

2. CLAIM VERIFIER PAGE:
   - Large centered input with neon glow border on focus
   - While analyzing: cinematic loading — 
     rotating 3D DNA-like helix in cyan, 
     text cycling through "Scanning sources...", 
     "Cross-referencing databases...", 
     "AI analyzing patterns..."
   - Result reveal: dramatic card flip animation
   - Verdict badge with particle burst on reveal
     (green burst = TRUE, red burst = FALSE, 
      amber burst = MISLEADING)
   - Confidence meter: animated circular progress 
     ring with glow effect

3. BIAS ANALYZER:
   - Political spectrum: sleek horizontal slider 
     visualization, not boring bar chart
   - Left side deep blue glow, Right side deep red glow
   - Needle animates to position on reveal
   - Fact vs Opinion: split animated donut chart
   - Manipulative words highlighted with 
     red underline pulse animation

4. DASHBOARD/ANALYTICS:
   - Glassmorphism stat cards with subtle 3D tilt 
     on hover (CSS perspective transform)
   - Recharts with custom neon styling — 
     glowing line charts, no default colors
   - Trending topics: animated tag cloud, 
     bigger = more fake news detected
   - Recent claims feed: smooth infinite scroll 
     with staggered fade-in

5. NAVIGATION:
   - Frosted glass navbar with backdrop blur
   - Active link: neon underline slide animation
   - Mobile: slide-in drawer with dark overlay
   - Scroll behavior: navbar compresses with transition

6. MICRO-INTERACTIONS:
   - Every button: subtle scale + glow on hover
   - Form inputs: neon border trace animation on focus
   - Cards: 3D tilt effect on mouse move
   - Page transitions: cinematic fade-slide
   - Tooltips: sharp dark floating cards

7. BACKGROUND EFFECTS:
   - Subtle animated gradient mesh (slow movement)
   - Noise texture overlay (grain effect, 4% opacity)
   - Occasional "data stream" columns 
     (Matrix-style but subtle, very low opacity)

=== PAGES TO BUILD ===

1. Landing Page (/)
   - Hero with 3D globe + particle network
   - "How it works" — 3-step animated flow
   - Live stats counter (claims analyzed, 
     fake news caught)
   - Testimonials in editorial magazine layout
   - CTA: "Start Fact-Checking"

2. Claim Verifier (/verify)
   - Full-screen centered input
   - Cinematic analysis loader
   - Dramatic result reveal with all AI data

3. URL Analyzer (/analyze-url)
   - URL input with website preview card
   - Bias spectrum visualization
   - Article breakdown panel

4. Community Reports (/community)
   - Masonry grid layout of reported content
   - Filter chips: Health / Politics / Finance / Tech
   - Status badges: PENDING / VERIFIED / FAKE

5. Search (/search)
   - Real-time search with result highlighting
   - Advanced filter sidebar
   - Verdict filter toggles (pill style)

6. User Dashboard (/dashboard)
   - Welcome with user's personal stats
   - Claim history timeline
   - Accuracy contribution score

7. Admin Panel (/admin)
   - Full data table with actions
   - Override verdict controls
   - Platform health metrics

8. Auth Pages (/login, /register)
   - Split screen layout
   - Left: animated visual (rotating 
     3D truth/lie scale visualization)
   - Right: minimal clean form

=== RESPONSIVENESS ===
Every single page must work perfectly on:
- Mobile (320px+): Stack layouts, touch-friendly
- Tablet (768px+): Hybrid layouts  
- Desktop (1024px+): Full cinematic experience
- Large screens (1440px+): Spacious, editorial

Mobile specific:
- Bottom navigation bar (not top hamburger)
- Swipeable verdict cards
- Touch-optimized input areas
- Reduced particle count for performance
