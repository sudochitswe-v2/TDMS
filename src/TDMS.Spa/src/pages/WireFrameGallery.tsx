import React, { useState } from 'react'

// Wireframe UI Primitives (Monochrome / Grayscale only, layout & placement focused)
const Box = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`border border-zinc-400 bg-white ${className}`} {...props}>
    {children}
  </div>
)

const Btn = ({
  children,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'dashed'
  className?: string
}) => {
  const styles = {
    primary: 'bg-zinc-900 text-white border-zinc-900',
    secondary: 'bg-white text-zinc-900 border-zinc-400',
    dashed: 'bg-zinc-50 text-zinc-600 border-dashed border-zinc-400',
  }
  return (
    <div
      className={`inline-flex items-center justify-center font-mono text-[11px] font-semibold px-3 py-1.5 border uppercase tracking-wider ${styles[variant]} ${className}`}
    >
      [ {children} ]
    </div>
  )
}

const InputBox = ({ label, placeholder, className = '' }: { label?: string; placeholder: string; className?: string }) => (
  <div className={`space-y-1 ${className}`}>
    {label && <div className="text-[10px] font-mono text-zinc-600 uppercase font-semibold">{label}</div>}
    <div className="border border-zinc-400 bg-white px-2.5 py-1.5 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
      <span>{placeholder}</span>
      <span className="text-zinc-400 text-[9px]">INPUT</span>
    </div>
  </div>
)

const ImgPlaceholder = ({ text, className = '' }: { text: string; className?: string }) => (
  <div className={`border-2 border-dashed border-zinc-400 bg-zinc-100 flex flex-col items-center justify-center text-zinc-500 font-mono text-[10px] p-2 text-center ${className}`}>
    <div className="text-zinc-400 text-xs mb-1">▨</div>
    <div>[ {text} ]</div>
  </div>
)

const WireframeHeader = ({ activeNav = 'Home' }: { activeNav?: string }) => (
  <header className="border-b-2 border-zinc-800 bg-white px-6 py-3 flex items-center justify-between">
    <div className="flex items-center space-x-6">
      <div className="font-mono font-extrabold text-sm border-2 border-zinc-900 px-2 py-0.5 tracking-tight">
        [ TDMS LOGO ]
      </div>
      <nav className="flex space-x-4 text-xs font-mono">
        {['Home', 'Find Tutors', 'How It Works', 'Categories', 'Admin Portal'].map((item) => (
          <span
            key={item}
            className={`px-2 py-1 ${activeNav === item ? 'border-b-2 border-zinc-900 font-bold' : 'text-zinc-500'}`}
          >
            {item}
          </span>
        ))}
      </nav>
    </div>
    <div className="flex items-center space-x-2">
      <Btn variant="secondary">Sign In</Btn>
      <Btn variant="primary">Register as Tutor</Btn>
    </div>
  </header>
)

const WireframeFooter = () => (
  <footer className="border-t-2 border-zinc-800 bg-zinc-50 p-6 font-mono text-xs text-zinc-600 mt-8">
    <div className="grid grid-cols-4 gap-4 pb-6 border-b border-zinc-300">
      <div>
        <div className="font-bold text-zinc-900 mb-2">[ TDMS PLATFORM ]</div>
        <p className="text-[11px] leading-relaxed">Tutor Discovery and Matching System for Learners, Educators, and Academic Operators in Myanmar.</p>
      </div>
      <div>
        <div className="font-bold text-zinc-900 mb-2">QUICK LINKS</div>
        <ul className="space-y-1 text-[11px]">
          <li>- Find Verified Tutors</li>
          <li>- Browse Subject Curriculum</li>
          <li>- Schedule & Pricing</li>
        </ul>
      </div>
      <div>
        <div className="font-bold text-zinc-900 mb-2">EDUCATOR HUB</div>
        <ul className="space-y-1 text-[11px]">
          <li>- Apply as Tutor</li>
          <li>- Tutor Studio Portal</li>
          <li>- Subscription Packages</li>
        </ul>
      </div>
      <div>
        <div className="font-bold text-zinc-900 mb-2">LEGAL & COMPLIANCE</div>
        <ul className="space-y-1 text-[11px]">
          <li>- Terms of Service</li>
          <li>- KYC Verification Guidelines</li>
          <li>- Privacy Policy</li>
        </ul>
      </div>
    </div>
    <div className="pt-4 flex justify-between text-[10px]">
      <span>© 2026 TDMS Myanmar. All rights reserved.</span>
      <span>WIREFRAME SCHEMATIC • NOT FINAL VISUAL DESIGN</span>
    </div>
  </footer>
)

export const WireframeGallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [zoomLevel, setZoomLevel] = useState<string>('fit')

  const categories = [
    { id: 'all', name: 'All Wireframes (22 Pages)' },
    { id: 'public', name: 'Public Discovery (3)' },
    { id: 'auth', name: 'Auth & Onboarding (3)' },
    { id: 'learner', name: 'Learner Workspace (3)' },
    { id: 'tutor', name: 'Tutor Studio (4)' },
    { id: 'admin', name: 'Admin Backoffice (9)' },
  ]

  return (
    <div className="min-h-screen bg-zinc-200 text-zinc-900 font-sans pb-24">
      {/* Top Controls Bar */}
      <div className="sticky top-0 z-50 bg-zinc-900 text-white border-b-2 border-black px-6 py-3 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-mono font-bold tracking-wider flex items-center space-x-2">
            <span className="bg-white text-zinc-900 px-2 py-0.5 text-xs font-black">WIREFRAMES</span>
            <span>TDMS — LOW-FIDELITY ARCHITECTURAL WIREFRAME SUITE</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            Pure monochrome wireframes showing structural hierarchy, layout bounding boxes, and button placements.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Category Filter */}
          <div className="flex bg-zinc-800 p-1 border border-zinc-700 text-xs font-mono">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1 cursor-pointer transition ${
                  activeCategory === c.id ? 'bg-white text-zinc-900 font-bold' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 border border-zinc-700 p-1 text-xs font-mono">
            <button
              onClick={() => setZoomLevel('fit')}
              className={`px-2 py-1 ${zoomLevel === 'fit' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
            >
              Fit Grid
            </button>
            <button
              onClick={() => setZoomLevel('full')}
              className={`px-2 py-1 ${zoomLevel === 'full' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
            >
              100% Scale
            </button>
          </div>
        </div>
      </div>

      {/* Main Wireframe Canvas Grid */}
      <div className="p-6 space-y-12 max-w-[1700px] mx-auto">

        {/* =========================================================================
            SECTION 1: PUBLIC & DISCOVERY
           ========================================================================= */}
        {(activeCategory === 'all' || activeCategory === 'public') && (
          <section className="space-y-6">
            <div className="border-b-2 border-zinc-900 pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white px-2 py-1">
                Category 01
              </span>
              <h2 className="text-xl font-bold font-mono tracking-tight mt-1">Public & Discovery Pages</h2>
            </div>

            <div className={`grid ${zoomLevel === 'fit' ? 'grid-cols-1 lg:grid-cols-2 gap-8' : 'grid-cols-1 gap-12'}`}>
              
              {/* FRAME 01: Home Page */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 01: Public Home Page</span>
                  <span>Route: /</span>
                </div>
                <WireframeHeader activeNav="Home" />
                
                {/* Hero Section */}
                <div className="p-8 border-b border-zinc-300 bg-zinc-50 text-center space-y-4">
                  <div className="max-w-xl mx-auto space-y-2">
                    <div className="inline-block border border-zinc-400 px-3 py-0.5 text-[10px] font-mono text-zinc-600">
                      [ TAG: VERIFIED TUTORS PLATFORM ]
                    </div>
                    <h1 className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
                      [ Headline: Find Verified 1-on-1 Tutors for Your Exact Goals ]
                    </h1>
                    <p className="text-xs font-mono text-zinc-500 max-w-md mx-auto">
                      [ Subtitle: Matched to your subjects, budget in MMK, and weekly schedule slots ]
                    </p>
                  </div>

                  {/* Search Bar Container */}
                  <div className="max-w-xl mx-auto border-2 border-zinc-900 bg-white p-2 flex items-center space-x-2">
                    <div className="flex-1 text-left">
                      <InputBox placeholder="Type subject or tutor name (e.g. Calculus, Physics)..." />
                    </div>
                    <Btn variant="primary">Search Tutors</Btn>
                  </div>

                  {/* Quick Filters */}
                  <div className="flex justify-center space-x-2 text-[10px] font-mono text-zinc-500">
                    <span>Popular:</span>
                    {['Mathematics', 'Physics', 'Chemistry', 'English Language', 'Computer Science'].map((t) => (
                      <span key={t} className="border border-zinc-300 px-1.5 py-0.5 bg-white">
                        [{t}]
                      </span>
                    ))}
                  </div>
                </div>

                {/* Highlights Grid */}
                <div className="p-6 border-b border-zinc-300">
                  <div className="text-xs font-mono font-bold mb-4">[ SECTION: PLATFORM PILLARS ]</div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    {['Verified Qualifications', 'Schedule Matching', 'MMK Direct Pricing', 'Real-Time Messaging'].map((title) => (
                      <Box key={title} className="p-4 space-y-2">
                        <div className="border border-zinc-300 w-8 h-8 mx-auto flex items-center justify-center font-mono text-xs">
                          ICON
                        </div>
                        <div className="font-mono text-[11px] font-bold text-zinc-800">{title}</div>
                        <p className="text-[10px] font-mono text-zinc-500">Structured verification and scheduling workflow.</p>
                      </Box>
                    ))}
                  </div>
                </div>

                {/* Categories Grid */}
                <div className="p-6 border-b border-zinc-300">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs font-mono font-bold">[ SECTION: EXPLORE CURRICULUM CATEGORIES ]</div>
                    <Btn variant="secondary">View All Categories</Btn>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Mathematics', count: '14 Tutors' },
                      { name: 'Physics', count: '9 Tutors' },
                      { name: 'Chemistry', count: '7 Tutors' },
                      { name: 'Biology', count: '8 Tutors' },
                      { name: 'English Language', count: '18 Tutors' },
                      { name: 'Computer Science', count: '12 Tutors' },
                    ].map((cat) => (
                      <Box key={cat.name} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-mono text-xs font-bold">{cat.name}</div>
                          <div className="font-mono text-[10px] text-zinc-500">{cat.count}</div>
                        </div>
                        <Btn variant="secondary">→</Btn>
                      </Box>
                    ))}
                  </div>
                </div>

                <WireframeFooter />
              </div>

              {/* FRAME 02: Tutor Search & Filtering */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 02: Tutor Search & Filtering</span>
                  <span>Route: /tutors</span>
                </div>
                <WireframeHeader activeNav="Find Tutors" />

                <div className="p-6">
                  {/* Search Bar Top */}
                  <div className="border border-zinc-400 p-4 bg-zinc-50 mb-6 flex items-end gap-3">
                    <div className="flex-1">
                      <InputBox label="SEARCH KEYWORD" placeholder="Search by name, subject, or topic..." />
                    </div>
                    <Btn variant="primary">Filter Results</Btn>
                    <Btn variant="secondary">Reset</Btn>
                  </div>

                  {/* 2-Column Layout */}
                  <div className="grid grid-cols-12 gap-6">
                    {/* Left Filters Sidebar (4 cols) */}
                    <div className="col-span-4 space-y-4">
                      <Box className="p-4 space-y-4">
                        <div className="font-mono font-bold text-xs border-b border-zinc-300 pb-2">
                          [ FILTERS PANEL ]
                        </div>

                        {/* Subject Category Filter */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono font-bold text-zinc-700 uppercase">Category</div>
                          {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map((c) => (
                            <label key={c} className="flex items-center space-x-2 text-xs font-mono text-zinc-600">
                              <input type="checkbox" className="border-zinc-400" />
                              <span>{c}</span>
                            </label>
                          ))}
                        </div>

                        {/* Hourly Rate Filter */}
                        <div className="space-y-2 border-t border-zinc-200 pt-3">
                          <div className="text-[10px] font-mono font-bold text-zinc-700 uppercase">Hourly Rate (MMK)</div>
                          <div className="flex gap-2">
                            <InputBox placeholder="Min MMK" />
                            <InputBox placeholder="Max MMK" />
                          </div>
                        </div>

                        {/* Teaching Mode */}
                        <div className="space-y-1.5 border-t border-zinc-200 pt-3">
                          <div className="text-[10px] font-mono font-bold text-zinc-700 uppercase">Teaching Mode</div>
                          {['All Modes', 'Online Only', 'In-Person', 'Both'].map((m) => (
                            <label key={m} className="flex items-center space-x-2 text-xs font-mono text-zinc-600">
                              <input type="radio" name="mode" className="border-zinc-400" />
                              <span>{m}</span>
                            </label>
                          ))}
                        </div>

                        {/* Rating Filter */}
                        <div className="space-y-1.5 border-t border-zinc-200 pt-3">
                          <div className="text-[10px] font-mono font-bold text-zinc-700 uppercase">Minimum Rating</div>
                          <div className="flex gap-1 text-xs font-mono">
                            {['4.5+', '4.0+', 'Any'].map((r) => (
                              <Btn key={r} variant="secondary">{r} ★</Btn>
                            ))}
                          </div>
                        </div>
                      </Box>
                    </div>

                    {/* Right Results Column (8 cols) */}
                    <div className="col-span-8 space-y-4">
                      <div className="flex justify-between items-center font-mono text-xs">
                        <span className="font-bold">RESULTS: 42 TUTORS FOUND</span>
                        <div className="flex items-center space-x-2">
                          <span>Sort by:</span>
                          <span className="border border-zinc-400 px-2 py-1">[ Recommended ▼ ]</span>
                        </div>
                      </div>

                      {/* Tutor Cards List */}
                      {[
                        { name: 'Dr. Kyaw Swar', headline: 'Calculus & High School Math Specialist (Ph.D.)', fee: '25,000 MMK/hr', exp: '8 yrs exp', rating: '4.9 (38)' },
                        { name: 'Daw Thida Win', headline: 'Experienced Physics Instructor (IGCSE & AP Physics)', fee: '28,000 MMK/hr', exp: '6 yrs exp', rating: '4.8 (25)' },
                        { name: 'Ko Aung Myo', headline: 'Software Engineer & Python Coach', fee: '22,000 MMK/hr', exp: '5 yrs exp', rating: '5.0 (42)' },
                      ].map((t) => (
                        <Box key={t.name} className="p-4 flex gap-4">
                          <ImgPlaceholder text="Avatar 80x80" className="w-20 h-20 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-sm">{t.name}</span>
                              <span className="border border-zinc-800 bg-zinc-900 text-white text-[9px] font-mono px-1.5 py-0.2">VERIFIED</span>
                              <span className="text-[10px] font-mono text-zinc-500">★ {t.rating}</span>
                            </div>
                            <p className="text-xs font-mono text-zinc-600">{t.headline}</p>
                            <div className="flex gap-2 text-[10px] font-mono text-zinc-500 pt-1">
                              <span className="border border-zinc-300 px-1 bg-zinc-50">{t.exp}</span>
                              <span className="border border-zinc-300 px-1 bg-zinc-50">Online / In-Person</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col justify-between shrink-0">
                            <div className="font-mono font-bold text-sm text-zinc-900">{t.fee}</div>
                            <div className="space-y-1">
                              <Btn variant="primary">View Profile</Btn>
                              <Btn variant="secondary">Send Inquiry</Btn>
                            </div>
                          </div>
                        </Box>
                      ))}

                      {/* Pagination */}
                      <div className="flex justify-center items-center space-x-2 pt-4 font-mono text-xs">
                        <Btn variant="secondary">&lt; Previous</Btn>
                        <span className="border border-zinc-900 bg-zinc-900 text-white px-3 py-1 font-bold">1</span>
                        <span className="border border-zinc-300 px-3 py-1">2</span>
                        <span className="border border-zinc-300 px-3 py-1">3</span>
                        <Btn variant="secondary">Next &gt;</Btn>
                      </div>
                    </div>
                  </div>
                </div>

                <WireframeFooter />
              </div>

              {/* FRAME 03: Tutor Profile Detail & Booking */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm col-span-full">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 03: Tutor Detail & Booking Calendar</span>
                  <span>Route: /tutors/:id</span>
                </div>
                <WireframeHeader activeNav="Find Tutors" />

                <div className="p-8 space-y-8">
                  {/* Profile Header Banner */}
                  <Box className="p-6 bg-zinc-50 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <ImgPlaceholder text="Photo 110x110" className="w-28 h-28" />
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-3">
                          <h1 className="text-xl font-mono font-bold">Dr. Kyaw Swar</h1>
                          <span className="border border-zinc-900 bg-zinc-900 text-white text-[10px] font-mono px-2 py-0.5">
                            [ VERIFIED TUTOR ]
                          </span>
                          <span className="font-mono text-xs font-bold text-zinc-800">★ 4.9 (38 Reviews)</span>
                        </div>
                        <p className="font-mono text-xs text-zinc-600">High School & University Mathematics Specialist (Ph.D. Yangon University)</p>
                        <div className="flex gap-2 text-[10px] font-mono text-zinc-500">
                          <span className="border border-zinc-300 px-2 py-0.5 bg-white">8 Years Experience</span>
                          <span className="border border-zinc-300 px-2 py-0.5 bg-white">Teaching Mode: Both</span>
                          <span className="border border-zinc-300 px-2 py-0.5 bg-white">Location: Kamayut, Yangon</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="font-mono font-extrabold text-xl text-zinc-900">25,000 MMK / hr</div>
                      <div className="flex gap-2">
                        <Btn variant="primary">Send Direct Inquiry</Btn>
                        <Btn variant="secondary">Message Chat</Btn>
                      </div>
                    </div>
                  </Box>

                  {/* 2-Column Body Layout */}
                  <div className="grid grid-cols-12 gap-8">
                    {/* Left Column (8 cols): Bio, Subjects, Availability, Reviews */}
                    <div className="col-span-8 space-y-6">
                      {/* Bio */}
                      <Box className="p-6 space-y-2">
                        <div className="font-mono font-bold text-xs uppercase border-b border-zinc-300 pb-2">
                          [ ABOUT THE TUTOR / BIO ]
                        </div>
                        <p className="font-mono text-xs text-zinc-700 leading-relaxed">
                          Over 8 years of experience mentoring high school and university students in Advanced Calculus, Algebra, and Geometry. Specializes in building deep conceptual intuition, step-by-step problem decomposition, and examination strategies for top academic performance.
                        </p>
                      </Box>

                      {/* Teaching Subjects & Rates Table */}
                      <Box className="p-6 space-y-3">
                        <div className="font-mono font-bold text-xs uppercase border-b border-zinc-300 pb-2">
                          [ TEACHING SUBJECTS & RATES ]
                        </div>
                        <div className="border border-zinc-300 text-xs font-mono">
                          <div className="grid grid-cols-4 bg-zinc-100 p-2 font-bold border-b border-zinc-300">
                            <div>Subject</div>
                            <div>Category</div>
                            <div>Level / Grade</div>
                            <div>Rate (MMK)</div>
                          </div>
                          {[
                            { s: 'Advanced Calculus', c: 'Mathematics', l: 'University Year 1-2', r: '25,000 MMK/hr' },
                            { s: 'Pure Mathematics', c: 'Mathematics', l: 'Grade 11 & 12', r: '22,000 MMK/hr' },
                            { s: 'Linear Algebra', c: 'Mathematics', l: 'University / IGCSE', r: '25,000 MMK/hr' },
                          ].map((row) => (
                            <div key={row.s} className="grid grid-cols-4 p-2 border-b border-zinc-200">
                              <div className="font-bold">{row.s}</div>
                              <div>{row.c}</div>
                              <div>{row.l}</div>
                              <div>{row.r}</div>
                            </div>
                          ))}
                        </div>
                      </Box>

                      {/* Weekly Availability Schedule Matrix */}
                      <Box className="p-6 space-y-3">
                        <div className="font-mono font-bold text-xs uppercase border-b border-zinc-300 pb-2">
                          [ WEEKLY SCHEDULE & TIME SLOTS ]
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px]">
                          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                            <div key={day} className="border border-zinc-400 p-2 bg-zinc-50">
                              <div className="font-bold border-b border-zinc-300 pb-1 mb-1">{day}</div>
                              <div className="space-y-1 text-[9px]">
                                <div className="border border-zinc-900 bg-zinc-900 text-white p-0.5">16:00-18:00</div>
                                <div className="border border-zinc-300 bg-white p-0.5 text-zinc-400">18:00-20:00</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Box>

                      {/* Reviews Section */}
                      <Box className="p-6 space-y-3">
                        <div className="font-mono font-bold text-xs uppercase border-b border-zinc-300 pb-2 flex justify-between">
                          <span>[ REVIEWS & STUDENT FEEDBACK ]</span>
                          <span>Rating: 4.9 / 5.0</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { name: 'Aung Kyaw (Grade 11)', rating: '★★★★★', text: 'Dr. Kyaw Swar explains calculus so clearly. Scored distinction in the final exams!' },
                            { name: 'Su Su Myint (Uni Year 1)', rating: '★★★★★', text: 'Patient and very systematic with practice problems.' },
                          ].map((rev) => (
                            <div key={rev.name} className="border-b border-zinc-200 pb-2 text-xs font-mono">
                              <div className="flex justify-between font-bold">
                                <span>{rev.name}</span>
                                <span>{rev.rating}</span>
                              </div>
                              <p className="text-zinc-600 mt-1">{rev.text}</p>
                            </div>
                          ))}
                        </div>
                      </Box>
                    </div>

                    {/* Right Column (4 cols): Sticky Inquiry / Booking Card */}
                    <div className="col-span-4 space-y-4">
                      <Box className="p-6 space-y-4 bg-zinc-50 border-2 border-zinc-900">
                        <div className="font-mono font-bold text-xs uppercase border-b border-zinc-300 pb-2">
                          [ BOOK SESSION / INQUIRY ]
                        </div>
                        <InputBox label="SELECT SUBJECT" placeholder="Advanced Calculus ▼" />
                        <InputBox label="DELIVERY MODE" placeholder="1-on-1 Online (Google Meet) ▼" />
                        <InputBox label="PREFERRED DATE" placeholder="Select Date (YYYY-MM-DD) 📅" />
                        <InputBox label="PREFERRED TIME SLOT" placeholder="Saturday 14:00 - 16:00 ▼" />
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-zinc-600 uppercase font-semibold">Message Note</div>
                          <div className="border border-zinc-400 bg-white p-2 h-20 text-[11px] font-mono text-zinc-400">
                            [ Textarea: Introduce your learning goals... ]
                          </div>
                        </div>
                        <Btn variant="primary" className="w-full">SUBMIT DIRECT INQUIRY</Btn>
                        <p className="text-[10px] font-mono text-zinc-500 text-center">
                          Direct inquiry sends message notification to tutor immediately.
                        </p>
                      </Box>
                    </div>
                  </div>
                </div>

                <WireframeFooter />
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 2: AUTH & ONBOARDING
           ========================================================================= */}
        {(activeCategory === 'all' || activeCategory === 'auth') && (
          <section className="space-y-6">
            <div className="border-b-2 border-zinc-900 pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white px-2 py-1">
                Category 02
              </span>
              <h2 className="text-xl font-bold font-mono tracking-tight mt-1">Authentication & Onboarding</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* FRAME 04: Sign In Page */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm flex flex-col justify-between">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 04: Sign In Page</span>
                  <span>Route: /login</span>
                </div>
                
                <div className="p-8 space-y-6 max-w-sm mx-auto w-full my-auto">
                  <div className="text-center space-y-1">
                    <div className="font-mono font-bold text-lg">[ TDMS SIGN IN ]</div>
                    <p className="text-[11px] font-mono text-zinc-500">Access discovery and matching account</p>
                  </div>

                  <div className="space-y-3">
                    <InputBox label="EMAIL ADDRESS" placeholder="user@tdms.local" />
                    <InputBox label="PASSWORD" placeholder="••••••••••••" />
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600">
                      <label className="flex items-center space-x-1">
                        <input type="checkbox" />
                        <span>Remember me</span>
                      </label>
                      <span>[ Forgot Password? ]</span>
                    </div>
                    <Btn variant="primary" className="w-full">SIGN IN</Btn>
                  </div>

                  {/* Demo Account Switcher */}
                  <div className="border-t border-zinc-300 pt-4 space-y-2">
                    <div className="text-[10px] font-mono font-bold text-zinc-700 uppercase">[ DEMO QUICK LOGIN ]</div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <Btn variant="secondary">System Admin</Btn>
                      <Btn variant="secondary">Operations Admin</Btn>
                      <Btn variant="secondary">Tutor (Math)</Btn>
                      <Btn variant="secondary">Student One</Btn>
                    </div>
                  </div>

                  <div className="text-center text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-200">
                    Don't have an account? <span className="font-bold text-zinc-900">[ Register Learner ]</span> or <span className="font-bold text-zinc-900">[ Register Tutor ]</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-100 border-t border-zinc-200 text-center font-mono text-[10px] text-zinc-500">
                  PBAC CLAIMS DECODED UPON LOGIN
                </div>
              </div>

              {/* FRAME 05: Learner Registration */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm flex flex-col justify-between">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 05: Learner Registration</span>
                  <span>Route: /register/learner</span>
                </div>

                <div className="p-8 space-y-6 max-w-sm mx-auto w-full my-auto">
                  <div className="text-center space-y-1">
                    <div className="font-mono font-bold text-lg">[ CREATE LEARNER ACCOUNT ]</div>
                    <p className="text-[11px] font-mono text-zinc-500">Sign up to find and connect with tutors</p>
                  </div>

                  <div className="space-y-3">
                    <InputBox label="FULL NAME" placeholder="e.g. Aung Myint" />
                    <InputBox label="EMAIL ADDRESS" placeholder="student@example.com" />
                    <InputBox label="PHONE NUMBER" placeholder="+95 9..." />
                    <InputBox label="TARGET LEVEL / GRADE" placeholder="Select Grade (e.g. Grade 11) ▼" />
                    <InputBox label="PASSWORD" placeholder="••••••••••••" />
                    <InputBox label="CONFIRM PASSWORD" placeholder="••••••••••••" />
                    
                    <label className="flex items-center space-x-2 text-[10px] font-mono text-zinc-600 pt-1">
                      <input type="checkbox" />
                      <span>Agree to Terms & Privacy Guidelines</span>
                    </label>

                    <Btn variant="primary" className="w-full">REGISTER LEARNER</Btn>
                  </div>

                  <div className="text-center text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-200">
                    Already have an account? <span className="font-bold text-zinc-900">[ Sign In ]</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-100 border-t border-zinc-200 text-center font-mono text-[10px] text-zinc-500">
                  DEFAULT ROLE: Learner
                </div>
              </div>

              {/* FRAME 06: Tutor Registration & KYC */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm flex flex-col justify-between">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 06: Tutor Registration & KYC</span>
                  <span>Route: /register/tutor</span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Step Indicator */}
                  <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                    <div className="border border-zinc-900 bg-zinc-900 text-white p-1 font-bold">1. BASIC INFO</div>
                    <div className="border border-zinc-900 bg-zinc-900 text-white p-1 font-bold">2. TEACHING</div>
                    <div className="border border-zinc-900 bg-zinc-900 text-white p-1 font-bold">3. KYC UPLOAD</div>
                  </div>

                  <div className="space-y-3">
                    <InputBox label="FULL NAME & TITLE" placeholder="e.g. Dr. Kyaw Swar" />
                    <InputBox label="HEADLINE" placeholder="High School & University Mathematics Specialist" />
                    <div className="grid grid-cols-2 gap-2">
                      <InputBox label="YEARS OF EXP" placeholder="8" />
                      <InputBox label="HOURLY RATE (MMK)" placeholder="25000" />
                    </div>
                    <InputBox label="TEACHING MODE" placeholder="Both Online and In-Person ▼" />
                    
                    {/* KYC Document Upload Placeholder */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-700 uppercase font-bold">[ KYC VERIFICATION DOCUMENTS ]</div>
                      <ImgPlaceholder text="Drag & Drop NRC / Degree Certificate (PDF/JPG)" className="h-20" />
                    </div>

                    <div className="border border-zinc-300 p-2 bg-zinc-50 font-mono text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span>📄 nrc_card_scanned.pdf (1.2 MB)</span>
                        <span className="text-zinc-500">[ Remove ]</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📄 phd_degree_certificate.pdf (2.4 MB)</span>
                        <span className="text-zinc-500">[ Remove ]</span>
                      </div>
                    </div>

                    <Btn variant="primary" className="w-full">SUBMIT APPLICATION FOR VERIFICATION</Btn>
                  </div>
                </div>

                <div className="p-3 bg-zinc-100 border-t border-zinc-200 text-center font-mono text-[10px] text-zinc-500">
                  STATUS ON SUBMIT: Pending Verification
                </div>
              </div>

            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 3: LEARNER WORKSPACE
           ========================================================================= */}
        {(activeCategory === 'all' || activeCategory === 'learner') && (
          <section className="space-y-6">
            <div className="border-b-2 border-zinc-900 pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white px-2 py-1">
                Category 03
              </span>
              <h2 className="text-xl font-bold font-mono tracking-tight mt-1">Learner Portal & Interactions</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* FRAME 07: Learner Account Hub */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 07: Learner Account Hub</span>
                  <span>Route: /account</span>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Student Profile Card */}
                  <Box className="p-4 bg-zinc-50 flex items-center space-x-3">
                    <ImgPlaceholder text="Avatar" className="w-12 h-12" />
                    <div>
                      <div className="font-mono font-bold text-sm">Aung Myint (Student)</div>
                      <div className="font-mono text-[10px] text-zinc-500">Grade 11 • Yangon • student1@tdms.local</div>
                    </div>
                  </Box>

                  {/* Active Inquiries / Sessions */}
                  <div className="space-y-2">
                    <div className="font-mono font-bold text-xs uppercase">[ MY DIRECT INQUIRIES ]</div>
                    {[
                      { tutor: 'Dr. Kyaw Swar', subject: 'Calculus', status: 'Accepted', date: 'Nov 14' },
                      { tutor: 'Daw Thida Win', subject: 'Physics', status: 'Pending', date: 'Nov 12' },
                    ].map((inq) => (
                      <Box key={inq.tutor} className="p-3 flex justify-between items-center text-xs font-mono">
                        <div>
                          <div className="font-bold">{inq.tutor}</div>
                          <div className="text-[10px] text-zinc-500">{inq.subject} • {inq.date}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 text-[9px] ${inq.status === 'Accepted' ? 'border border-zinc-900 bg-zinc-900 text-white' : 'border border-zinc-400 bg-white'}`}>
                            {inq.status}
                          </span>
                          <Btn variant="secondary">Chat</Btn>
                        </div>
                      </Box>
                    ))}
                  </div>

                  {/* Saved Tutors */}
                  <div className="space-y-2 pt-2 border-t border-zinc-200">
                    <div className="font-mono font-bold text-xs uppercase">[ SAVED / FAVORITE TUTORS ]</div>
                    <Box className="p-3 flex justify-between items-center text-xs font-mono">
                      <div>
                        <div className="font-bold">Ko Aung Myo</div>
                        <div className="text-[10px] text-zinc-500">Python & Web Dev • 22,000 MMK</div>
                      </div>
                      <Btn variant="primary">Book</Btn>
                    </Box>
                  </div>
                </div>
              </div>

              {/* FRAME 08: Real-Time Chat & Messaging */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 08: Real-Time Messaging Hub</span>
                  <span>Route: /messages</span>
                </div>

                <div className="grid grid-cols-12 h-[420px] border-b border-zinc-300">
                  {/* Left Chat Contacts (5 cols) */}
                  <div className="col-span-5 border-r border-zinc-300 p-2 space-y-1 bg-zinc-50 overflow-y-auto">
                    <InputBox placeholder="Search chats..." />
                    {[
                      { name: 'Dr. Kyaw Swar', msg: 'Available on Saturday 2PM', time: '10:32 AM', active: true },
                      { name: 'Daw Thida Win', msg: 'Please share your syllabus', time: 'Yesterday', active: false },
                    ].map((c) => (
                      <div
                        key={c.name}
                        className={`p-2 border font-mono text-[10px] ${c.active ? 'border-zinc-900 bg-white' : 'border-zinc-300'}`}
                      >
                        <div className="font-bold">{c.name}</div>
                        <div className="text-zinc-500 truncate">{c.msg}</div>
                        <div className="text-[9px] text-zinc-400 text-right">{c.time}</div>
                      </div>
                    ))}
                  </div>

                  {/* Right Chat Window (7 cols) */}
                  <div className="col-span-7 flex flex-col justify-between p-3 bg-white">
                    {/* Header */}
                    <div className="border-b border-zinc-300 pb-2 flex justify-between items-center font-mono text-xs">
                      <div>
                        <span className="font-bold">Dr. Kyaw Swar</span>
                        <span className="text-[10px] text-zinc-400 block">• Calculus Mentorship</span>
                      </div>
                      <Btn variant="secondary">View Profile</Btn>
                    </div>

                    {/* Messages Body */}
                    <div className="space-y-2 font-mono text-[11px] my-auto">
                      <div className="border border-zinc-300 bg-zinc-100 p-2 max-w-[80%]">
                        Hello Aung Myint, I saw your inquiry for Advanced Calculus.
                      </div>
                      <div className="border border-zinc-900 bg-zinc-900 text-white p-2 max-w-[80%] ml-auto">
                        Hi Dr. Kyaw Swar! Yes, I want to prepare for the term final exams.
                      </div>
                      <div className="border border-zinc-300 bg-zinc-100 p-2 max-w-[80%]">
                        Saturday at 2:00 PM works well for me online.
                      </div>
                    </div>

                    {/* Chat Input Bar */}
                    <div className="border-t border-zinc-300 pt-2 flex gap-2">
                      <InputBox placeholder="Type your message here..." className="flex-1" />
                      <Btn variant="primary">Send</Btn>
                    </div>
                  </div>
                </div>
              </div>

              {/* FRAME 09: Reviews & Feedback */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 09: Reviews & Feedback</span>
                  <span>Route: /reviews</span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Leave Review Form */}
                  <Box className="p-4 bg-zinc-50 space-y-3">
                    <div className="font-mono font-bold text-xs uppercase">[ SUBMIT TUTOR REVIEW ]</div>
                    <InputBox label="SELECT TUTOR & SESSION" placeholder="Dr. Kyaw Swar (Calculus - Nov 14) ▼" />
                    
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-700 uppercase font-bold">Rating Score</div>
                      <div className="flex gap-1 font-mono text-xs">
                        {['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'].map((s, idx) => (
                          <span key={s} className={`px-2 py-1 border ${idx === 4 ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-400 bg-white'}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-700 uppercase font-bold">Feedback Comments</div>
                      <div className="border border-zinc-400 bg-white p-2 h-16 text-[10px] font-mono text-zinc-400">
                        [ Textarea: Write review regarding teaching quality, clarity, and punctuality... ]
                      </div>
                    </div>

                    <Btn variant="primary" className="w-full">SUBMIT REVIEW</Btn>
                  </Box>

                  {/* Previous Reviews Written */}
                  <div className="space-y-2">
                    <div className="font-mono font-bold text-xs uppercase">[ PREVIOUSLY SUBMITTED REVIEWS ]</div>
                    <Box className="p-3 text-xs font-mono space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>To: Ko Aung Myo (Python)</span>
                        <span>★★★★★ 5.0</span>
                      </div>
                      <p className="text-[11px] text-zinc-600">Great explanations on data structures.</p>
                      <div className="flex justify-end gap-1 text-[9px] pt-1">
                        <span className="border border-zinc-300 px-1">[ Edit ]</span>
                        <span className="border border-zinc-300 px-1 text-zinc-400">[ Delete ]</span>
                      </div>
                    </Box>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 4: TUTOR STUDIO
           ========================================================================= */}
        {(activeCategory === 'all' || activeCategory === 'tutor') && (
          <section className="space-y-6">
            <div className="border-b-2 border-zinc-900 pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white px-2 py-1">
                Category 04
              </span>
              <h2 className="text-xl font-bold font-mono tracking-tight mt-1">Tutor Studio Workspace</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* FRAME 10: Tutor Studio Overview */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 10: Tutor Studio Hub</span>
                  <span>Route: /tutor-studio</span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Tutor Status Banner */}
                  <Box className="p-4 bg-zinc-50 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <ImgPlaceholder text="Photo" className="w-12 h-12" />
                      <div>
                        <div className="font-mono font-bold text-sm">Dr. Kyaw Swar</div>
                        <div className="font-mono text-[10px] text-zinc-500">Verification: Verified • Tier: Pro Educator</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Btn variant="secondary">Edit Profile</Btn>
                      <Btn variant="primary">Manage Schedule</Btn>
                    </div>
                  </Box>

                  {/* KPI Metrics */}
                  <div className="grid grid-cols-4 gap-2 font-mono text-center">
                    {[
                      { label: 'Active Inquiries', val: '5' },
                      { label: 'Profile Views', val: '342' },
                      { label: 'Avg Rating', val: '4.9 ★' },
                      { label: 'Monthly Earnings', val: '450k MMK' },
                    ].map((k) => (
                      <Box key={k.label} className="p-3">
                        <div className="text-[10px] text-zinc-500">{k.label}</div>
                        <div className="text-base font-bold mt-1">{k.val}</div>
                      </Box>
                    ))}
                  </div>

                  {/* Studio Navigation Tabs */}
                  <div className="border border-zinc-300 p-2 flex gap-2 font-mono text-xs">
                    {['1. Teaching Profile', '2. Subjects & Rates', '3. Availability Matrix', '4. Subscriptions'].map((tab, i) => (
                      <span key={tab} className={`px-2 py-1 ${i === 0 ? 'bg-zinc-900 text-white font-bold' : 'border border-zinc-300'}`}>
                        {tab}
                      </span>
                    ))}
                  </div>

                  {/* Profile Edit Form Wireframe */}
                  <div className="space-y-3 font-mono text-xs">
                    <InputBox label="TEACHING HEADLINE" placeholder="High School & University Mathematics Specialist (Ph.D.)" />
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-700 uppercase font-bold">Biography & Teaching Approach</div>
                      <div className="border border-zinc-400 bg-white p-2 h-20 text-[11px] text-zinc-500">
                        Over 8 years of experience mentoring high school and university students in Advanced Calculus, Algebra, and Geometry...
                      </div>
                    </div>
                    <Btn variant="primary">SAVE PROFILE CHANGES</Btn>
                  </div>
                </div>
              </div>

              {/* FRAME 11: Subjects & MMK Rates Configuration */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 11: Subjects & MMK Pricing</span>
                  <span>Route: /tutor-studio (Tab: Subjects)</span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Add Subject Box */}
                  <Box className="p-4 bg-zinc-50 space-y-3">
                    <div className="font-mono font-bold text-xs uppercase">[ + ADD NEW SUBJECT LISTING ]</div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputBox label="CATEGORY" placeholder="Mathematics ▼" />
                      <InputBox label="SUBJECT NAME" placeholder="e.g. Linear Algebra" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputBox label="HOURLY RATE (MMK)" placeholder="25000" />
                      <InputBox label="TARGET LEVEL" placeholder="University Year 1 ▼" />
                    </div>
                    <Btn variant="primary">+ ADD SUBJECT TO LISTINGS</Btn>
                  </Box>

                  {/* Existing Subjects Table */}
                  <div className="space-y-2">
                    <div className="font-mono font-bold text-xs uppercase">[ ACTIVE SUBJECT LISTINGS (3 / 5 Allowed on Pro Tier) ]</div>
                    <div className="border border-zinc-300 font-mono text-xs">
                      <div className="grid grid-cols-12 bg-zinc-100 p-2 font-bold border-b border-zinc-300">
                        <div className="col-span-4">Subject</div>
                        <div className="col-span-3">Category</div>
                        <div className="col-span-3">Hourly MMK</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {[
                        { s: 'Advanced Calculus', c: 'Mathematics', f: '25,000 MMK' },
                        { s: 'Pure Mathematics', c: 'Mathematics', f: '22,000 MMK' },
                        { s: 'Linear Algebra', c: 'Mathematics', f: '25,000 MMK' },
                      ].map((sub) => (
                        <div key={sub.s} className="grid grid-cols-12 p-2 border-b border-zinc-200 items-center">
                          <div className="col-span-4 font-bold">{sub.s}</div>
                          <div className="col-span-3 text-zinc-500">{sub.c}</div>
                          <div className="col-span-3">{sub.f}</div>
                          <div className="col-span-2 text-right space-x-1">
                            <span className="border border-zinc-400 px-1 text-[10px] cursor-pointer">[ Edit ]</span>
                            <span className="border border-zinc-400 px-1 text-[10px] cursor-pointer">[ ✕ ]</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* FRAME 12: Weekly Availability Scheduler */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 12: Weekly Availability Scheduler</span>
                  <span>Route: /tutor-studio (Tab: Availability)</span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <div>
                      <span className="font-bold block">RECURRING WEEKLY SLOTS</span>
                      <span className="text-[10px] text-zinc-500">Click slots to toggle Available / Busy</span>
                    </div>
                    <div className="flex gap-2">
                      <Btn variant="secondary">Clear All</Btn>
                      <Btn variant="primary">Save Schedule</Btn>
                    </div>
                  </div>

                  {/* Availability Matrix */}
                  <div className="border border-zinc-400 font-mono text-[10px]">
                    <div className="grid grid-cols-8 bg-zinc-800 text-white p-1.5 text-center font-bold">
                      <div>TIME</div>
                      <div>MON</div>
                      <div>TUE</div>
                      <div>WED</div>
                      <div>THU</div>
                      <div>FRI</div>
                      <div>SAT</div>
                      <div>SUN</div>
                    </div>
                    {['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00'].map((slot, rIdx) => (
                      <div key={slot} className="grid grid-cols-8 border-t border-zinc-300 text-center">
                        <div className="p-1 bg-zinc-100 font-bold border-r border-zinc-300">{slot}</div>
                        {[1, 2, 3, 4, 5, 6, 7].map((cIdx) => {
                          const isBooked = (rIdx + cIdx) % 3 === 0
                          return (
                            <div
                              key={cIdx}
                              className={`p-1 border-r border-zinc-200 cursor-pointer ${
                                isBooked ? 'bg-zinc-900 text-white font-bold' : 'bg-white text-zinc-300'
                              }`}
                            >
                              {isBooked ? '[ ACTIVE ]' : '—'}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 font-mono text-[10px] text-zinc-600">
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 bg-zinc-900 inline-block"></span>
                      <span>Available Time Slot</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-3 h-3 border border-zinc-300 inline-block bg-white"></span>
                      <span>Unavailable / Off</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* FRAME 13: Subscription Packages & Payment Slips */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 13: Subscription Tiers & Payment Slips</span>
                  <span>Route: /tutor-studio (Tab: Subscriptions)</span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Tiers Grid */}
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {[
                      { name: 'Free Starter', fee: '0 MMK', limits: '1 subject listing', cur: false },
                      { name: 'Pro Educator', fee: '45,000 MMK', limits: '5 subjects • badge', cur: true },
                      { name: 'Elite Academy', fee: '90,000 MMK', limits: '15 subjects • top rank', cur: false },
                    ].map((pkg) => (
                      <Box key={pkg.name} className={`p-3 space-y-2 text-center ${pkg.cur ? 'border-2 border-zinc-900 bg-zinc-50' : ''}`}>
                        <div className="font-bold">{pkg.name}</div>
                        <div className="text-sm font-extrabold">{pkg.fee}</div>
                        <div className="text-[10px] text-zinc-500">{pkg.limits}</div>
                        <Btn variant={pkg.cur ? 'primary' : 'secondary'} className="w-full">
                          {pkg.cur ? 'CURRENT PLAN' : 'SELECT PLAN'}
                        </Btn>
                      </Box>
                    ))}
                  </div>

                  {/* Payment Slip Upload Box */}
                  <Box className="p-4 bg-zinc-50 space-y-3 font-mono text-xs">
                    <div className="font-bold uppercase">[ UPLOAD BANK TRANSFER SLIP ]</div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputBox label="PAYMENT METHOD" placeholder="KBZPay / WavePay ▼" />
                      <InputBox label="TRANSACTION LAST 6 DIGITS" placeholder="e.g. 984123" />
                    </div>
                    <ImgPlaceholder text="Upload Transfer Screenshot (JPG/PNG)" className="h-16" />
                    <Btn variant="primary" className="w-full">SUBMIT PAYMENT SLIP FOR VERIFICATION</Btn>
                  </Box>

                  {/* Past Transactions Log */}
                  <div className="space-y-1 font-mono text-xs">
                    <div className="font-bold text-[10px] uppercase">[ PAYMENT HISTORY ]</div>
                    <div className="border border-zinc-300 p-2 flex justify-between items-center text-[11px]">
                      <span>Pro Educator • 45,000 MMK (KBZPay: 984123)</span>
                      <span className="border border-zinc-900 bg-zinc-900 text-white px-2 py-0.5 text-[9px]">CONFIRMED</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 5: ADMIN BACKOFFICE & PBAC IAM GOVERNANCE
           ========================================================================= */}
        {(activeCategory === 'all' || activeCategory === 'admin') && (
          <section className="space-y-6">
            <div className="border-b-2 border-zinc-900 pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white px-2 py-1">
                Category 05
              </span>
              <h2 className="text-xl font-bold font-mono tracking-tight mt-1">Admin Backoffice & PBAC IAM Governance (9 Pages)</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* FRAME 14: Admin Overview Dashboard */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 14: Admin Overview</span>
                  <span>Route: /admin</span>
                </div>

                <div className="p-6 space-y-4 font-mono">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <Box className="p-3">
                      <div className="text-[10px] text-zinc-500">PLATFORM REVENUE</div>
                      <div className="text-lg font-extrabold mt-1">14.5M MMK</div>
                    </Box>
                    <Box className="p-3">
                      <div className="text-[10px] text-zinc-500">ACTIVE TUTORS</div>
                      <div className="text-lg font-extrabold mt-1">42</div>
                    </Box>
                    <Box className="p-3">
                      <div className="text-[10px] text-zinc-500">ACTIVE LEARNERS</div>
                      <div className="text-lg font-extrabold mt-1">185</div>
                    </Box>
                    <Box className="p-3">
                      <div className="text-[10px] text-zinc-500">PENDING KYC</div>
                      <div className="text-lg font-extrabold mt-1 text-zinc-900">3 QUEUED</div>
                    </Box>
                  </div>

                  {/* Priority Action Tasks */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase border-b border-zinc-300 pb-1">[ ACTION REQUIRED ]</div>
                    <div className="border border-zinc-400 p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold">3 Tutor KYC Applications</div>
                        <div className="text-[10px] text-zinc-500">Degrees and NRC cards pending review</div>
                      </div>
                      <Btn variant="primary">Review</Btn>
                    </div>
                    <div className="border border-zinc-400 p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold">5 Subscription Slips</div>
                        <div className="text-[10px] text-zinc-500">KBZPay / WavePay payments pending</div>
                      </div>
                      <Btn variant="primary">Audit</Btn>
                    </div>
                  </div>
                </div>
              </div>

              {/* FRAME 15: Tutor Verifications Queue */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 15: Tutor KYC Verifications</span>
                  <span>Route: /admin/tutor-verifications</span>
                </div>

                <div className="p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <div className="space-x-1">
                      <span className="border border-zinc-900 bg-zinc-900 text-white px-2 py-1 font-bold">Pending (3)</span>
                      <span className="border border-zinc-300 px-2 py-1">Approved</span>
                      <span className="border border-zinc-300 px-2 py-1">Rejected</span>
                    </div>
                  </div>

                  {/* Verification Item */}
                  <Box className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm">Dr. Zarni Htut</div>
                        <div className="text-[10px] text-zinc-500">zarni.htut@example.com • 3 Documents Attached</div>
                      </div>
                      <span className="border border-zinc-900 text-[10px] px-1.5 py-0.5">PENDING</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <ImgPlaceholder text="NRC Front & Back" className="h-16" />
                      <ImgPlaceholder text="Ph.D. Biology Certificate" className="h-16" />
                    </div>

                    <div className="space-y-1">
                      <InputBox label="ADMIN AUDIT NOTES" placeholder="Enter notes / remarks..." />
                    </div>

                    <div className="flex gap-2">
                      <Btn variant="primary" className="flex-1">APPROVE & VERIFY</Btn>
                      <Btn variant="secondary" className="flex-1">REJECT WITH REASON</Btn>
                    </div>
                  </Box>
                </div>
              </div>

              {/* FRAME 16: Categories & Curriculum Taxonomy */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 16: Curriculum Categories</span>
                  <span>Route: /admin/categories</span>
                </div>

                <div className="p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase">Taxonomy (6 Categories)</span>
                    <Btn variant="primary">+ Add Category</Btn>
                  </div>

                  <div className="border border-zinc-300 text-xs">
                    <div className="grid grid-cols-12 bg-zinc-100 p-2 font-bold border-b border-zinc-300">
                      <div className="col-span-5">Category Name</div>
                      <div className="col-span-4">Tutors Count</div>
                      <div className="col-span-3 text-right">Action</div>
                    </div>
                    {[
                      { name: 'Mathematics', count: '14' },
                      { name: 'Physics', count: '9' },
                      { name: 'Chemistry', count: '7' },
                      { name: 'English Language', count: '18' },
                      { name: 'Computer Science', count: '12' },
                    ].map((row) => (
                      <div key={row.name} className="grid grid-cols-12 p-2 border-b border-zinc-200 items-center">
                        <div className="col-span-5 font-bold">{row.name}</div>
                        <div className="col-span-4">{row.count} Active</div>
                        <div className="col-span-3 text-right space-x-1">
                          <span className="border border-zinc-400 px-1 text-[10px]">[ Edit ]</span>
                          <span className="border border-zinc-400 px-1 text-[10px]">[ Del ]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FRAME 17: Subscriptions Packages Management */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 17: Subscriptions Management</span>
                  <span>Route: /admin/subscriptions</span>
                </div>

                <div className="p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase">Package Tiers (3 Plans)</span>
                    <Btn variant="primary">+ Create Package</Btn>
                  </div>

                  <div className="space-y-2">
                    {[
                      { tier: 'Free Starter', fee: '0 MMK', subjects: '1 Max Listing', rank: 'Priority 1' },
                      { tier: 'Pro Educator', fee: '45,000 MMK', subjects: '5 Max Listings', rank: 'Priority 2' },
                      { tier: 'Elite Academy', fee: '90,000 MMK', subjects: '15 Max Listings', rank: 'Priority 3' },
                    ].map((p) => (
                      <Box key={p.tier} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold">{p.tier}</div>
                          <div className="text-[10px] text-zinc-500">{p.subjects} • {p.rank}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold">{p.fee}</div>
                          <Btn variant="secondary" className="mt-1">Edit</Btn>
                        </div>
                      </Box>
                    ))}
                  </div>
                </div>
              </div>

              {/* FRAME 18: Payment Slips Audit */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 18: Payment Slips Audit</span>
                  <span>Route: /admin/subscription-payments</span>
                </div>

                <div className="p-6 space-y-4 font-mono text-xs">
                  <div className="border border-zinc-300 p-2 flex gap-2">
                    <InputBox placeholder="Search by tutor or transaction last 6..." className="flex-1" />
                    <Btn variant="secondary">Filter</Btn>
                  </div>

                  <Box className="p-3 space-y-2">
                    <div className="flex justify-between items-start font-bold">
                      <div>Daw Thida Win</div>
                      <div>45,000 MMK</div>
                    </div>
                    <div className="text-[10px] text-zinc-500">KBZPay • Tx: 984123 • Tier: Pro Educator</div>
                    <ImgPlaceholder text="Payment Slip Screenshot" className="h-16" />
                    <div className="flex gap-2 pt-1">
                      <Btn variant="primary" className="flex-1">CONFIRM PAYMENT</Btn>
                      <Btn variant="secondary" className="flex-1">REJECT</Btn>
                    </div>
                  </Box>
                </div>
              </div>

              {/* FRAME 19: Reports & Analytics */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 19: Reports & Analytics</span>
                  <span>Route: /admin/reports</span>
                </div>

                <div className="p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <div className="space-x-1">
                      <span className="border border-zinc-900 bg-zinc-900 text-white px-2 py-1">Overview</span>
                      <span className="border border-zinc-300 px-2 py-1">Payments</span>
                      <span className="border border-zinc-300 px-2 py-1">Subscriptions</span>
                    </div>
                    <Btn variant="secondary">Export CSV</Btn>
                  </div>

                  {/* Chart Wireframe Box */}
                  <ImgPlaceholder text="Monthly Revenue & Subscription Growth Chart" className="h-28" />

                  <div className="border border-zinc-300 p-2 space-y-1 text-[11px]">
                    <div className="flex justify-between border-b border-zinc-200 pb-1 font-bold">
                      <span>Total Revenue (YTD)</span>
                      <span>14,500,000 MMK</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1">
                      <span>Pro Packages Sold</span>
                      <span>124 Units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Elite Packages Sold</span>
                      <span>42 Units</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FRAME 20: IAM Users Management */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 20: IAM Users Governance</span>
                  <span>Route: /admin/users</span>
                </div>

                <div className="p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase">Platform Users (189 Total)</span>
                    <Btn variant="primary">+ Invite User</Btn>
                  </div>

                  <div className="border border-zinc-300">
                    <div className="grid grid-cols-12 bg-zinc-100 p-2 font-bold border-b border-zinc-300 text-[11px]">
                      <div className="col-span-5">User & Email</div>
                      <div className="col-span-4">Role Assigned</div>
                      <div className="col-span-3 text-right">Actions</div>
                    </div>
                    {[
                      { name: 'Admin Root', email: 'admin@tdms.local', role: 'SystemAdmin' },
                      { name: 'Ops Officer', email: 'ops@tdms.local', role: 'OperationAdmin' },
                      { name: 'Dr. Kyaw Swar', email: 'tutor.math@...', role: 'Tutor' },
                      { name: 'Aung Myint', email: 'student1@...', role: 'Learner' },
                    ].map((u) => (
                      <div key={u.email} className="grid grid-cols-12 p-2 border-b border-zinc-200 items-center text-[10px]">
                        <div className="col-span-5">
                          <div className="font-bold">{u.name}</div>
                          <div className="text-zinc-500 truncate">{u.email}</div>
                        </div>
                        <div className="col-span-4">
                          <span className="border border-zinc-900 px-1 py-0.5">{u.role}</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="border border-zinc-400 px-1 text-[9px] cursor-pointer">[ Edit ]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FRAME 21: PBAC Roles & Claims Matrix */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 21: PBAC Claims Matrix</span>
                  <span>Route: /admin/roles</span>
                </div>

                <div className="p-6 space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase">Fine-Grained Permissions</span>
                    <Btn variant="primary">Save Claims</Btn>
                  </div>

                  {/* Claims Grid */}
                  <div className="border border-zinc-400 text-[10px]">
                    <div className="grid grid-cols-12 bg-zinc-800 text-white p-1.5 font-bold text-center">
                      <div className="col-span-6 text-left">CLAIM TYPE</div>
                      <div className="col-span-2">ADMIN</div>
                      <div className="col-span-2">OPS</div>
                      <div className="col-span-2">TUTOR</div>
                    </div>
                    {[
                      { c: 'users:read', a: true, o: false, t: false },
                      { c: 'users:create', a: true, o: false, t: false },
                      { c: 'tutors:verify', a: true, o: true, t: false },
                      { c: 'categories:update', a: true, o: true, t: false },
                      { c: 'subscriptions:read', a: true, o: true, t: true },
                      { c: 'reports:read', a: true, o: true, t: false },
                      { c: 'view:menu:admin_panel', a: true, o: true, t: false },
                    ].map((row) => (
                      <div key={row.c} className="grid grid-cols-12 p-1.5 border-t border-zinc-300 text-center items-center">
                        <div className="col-span-6 text-left font-bold">{row.c}</div>
                        <div className="col-span-2">{row.a ? '[X]' : '[ ]'}</div>
                        <div className="col-span-2">{row.o ? '[X]' : '[ ]'}</div>
                        <div className="col-span-2">{row.t ? '[X]' : '[ ]'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FRAME 22: System Settings & Matching Weights */}
              <div className="border-2 border-zinc-800 bg-white shadow-sm">
                <div className="bg-zinc-800 text-white px-4 py-2 font-mono text-xs flex justify-between items-center">
                  <span className="font-bold">FRAME 22: System Settings</span>
                  <span>Route: /admin/settings</span>
                </div>

                <div className="p-6 space-y-4 font-mono text-xs">
                  <div className="space-y-3">
                    <div className="font-bold uppercase border-b border-zinc-300 pb-1">[ PLATFORM CONFIG ]</div>
                    <InputBox label="PLATFORM NAME" placeholder="TDMS Myanmar" />
                    <InputBox label="DEFAULT CURRENCY" placeholder="MMK (Myanmar Kyat)" />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="font-bold uppercase border-b border-zinc-300 pb-1">[ MATCHING ENGINE WEIGHTS ]</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subject Match Weight:</span>
                        <span className="font-bold">40%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Schedule Compatibility:</span>
                        <span className="font-bold">30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating & KYC Verification:</span>
                        <span className="font-bold">20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hourly Rate Affordability:</span>
                        <span className="font-bold">10%</span>
                      </div>
                    </div>
                  </div>

                  <Btn variant="primary" className="w-full">SAVE SYSTEM SETTINGS</Btn>
                </div>
              </div>

            </div>
          </section>
        )}

      </div>
    </div>
  )
}

export default WireframeGallery
