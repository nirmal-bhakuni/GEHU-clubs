# College Club Website - Design Guidelines

## Design Approach

**Selected Approach**: Reference-Based (Linear + Notion + Instagram influences)

**Justification**: This is a visual-rich, experience-focused platform targeting college students. Success depends on engaging UI that makes event discovery exciting while maintaining efficient content management for admins. The design will blend Linear's modern minimalism, Notion's organizational clarity, and Instagram's visual-first approach.

**Key Design Principles**:
1. **Visual Hierarchy**: Events and clubs compete for attention—use bold imagery and clear typography
2. **Seamless Dual Experience**: Students browse effortlessly; admins manage content efficiently
3. **Modern Campus Aesthetic**: Contemporary, energetic, and trustworthy
4. **Mobile-First**: Students primarily browse on phones between classes

---

## Core Design Elements

### A. Color Palette

**Dark Mode** (Primary):
- **Background**: 
  - Primary: 15 10% 8% (near-black with subtle warmth)
  - Secondary: 15 10% 12% (elevated surfaces)
  - Tertiary: 15 8% 16% (cards, modals)
- **Primary Brand**: 220 90% 56% (vibrant blue - trust and energy)
- **Accent**: 280 85% 60% (purple - creativity and campus culture)
- **Text**:
  - Primary: 0 0% 98%
  - Secondary: 0 0% 70%
  - Tertiary: 0 0% 50%
- **Success**: 142 76% 45% (event confirmations)
- **Borders**: 0 0% 20% (subtle separation)

**Light Mode**:
- **Background**:
  - Primary: 0 0% 100%
  - Secondary: 220 20% 97%
  - Tertiary: 220 15% 95%
- **Primary Brand**: 220 90% 50%
- **Accent**: 280 75% 55%
- **Text**:
  - Primary: 0 0% 10%
  - Secondary: 0 0% 35%
  - Tertiary: 0 0% 50%

### B. Typography

**Font Families** (Google Fonts CDN):
- **Primary**: "Inter" - Headings, UI elements, navigation (400, 500, 600, 700 weights)
- **Secondary**: "Plus Jakarta Sans" - Body text, descriptions (400, 500, 600 weights)

**Type Scale**:
- **Hero Headline**: text-5xl md:text-6xl lg:text-7xl, font-bold, tracking-tight
- **Section Headers**: text-3xl md:text-4xl, font-semibold
- **Card Titles**: text-xl md:text-2xl, font-semibold
- **Body Large**: text-lg, font-normal
- **Body Regular**: text-base, leading-relaxed
- **Meta/Labels**: text-sm, font-medium, uppercase tracking-wide

### C. Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 8, 12, 16, 20, 24** (e.g., p-4, gap-8, my-12, py-20)

**Container Strategy**:
- Full-width sections: w-full with inner max-w-7xl mx-auto px-4 md:px-8
- Content sections: max-w-6xl mx-auto
- Reading content: max-w-4xl mx-auto

**Grid Patterns**:
- Event Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Club Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8
- Featured Highlights: grid-cols-1 lg:grid-cols-2 gap-12

**Vertical Rhythm**: py-16 md:py-20 lg:py-24 for major sections

### D. Component Library

**Navigation**:
- Sticky header with backdrop blur (backdrop-blur-xl bg-background/80)
- Logo left, nav links center, CTA/auth right
- Mobile: Hamburger menu with slide-in drawer
- Height: h-16 md:h-20

**Hero Section**:
- Full-width background: Large hero image showcasing vibrant campus event or club activities
- Overlay gradient: from-black/60 via-black/40 to-transparent
- Content: Centered, max-w-4xl
- CTA buttons: Primary solid + Secondary outline with backdrop-blur-md bg-white/10
- Height: min-h-[600px] lg:min-h-[700px]

**Event Cards**:
- Rounded corners: rounded-xl
- Image aspect ratio: aspect-[16/10] with object-cover
- Hover state: Scale transform (hover:scale-105 transition-transform)
- Badge overlays: Absolute positioned category/date chips (top-3 left-3)
- Content padding: p-6
- Shadow: shadow-lg hover:shadow-2xl

**Club Cards**:
- Vertical layout: Club logo (rounded-full w-20 h-20), name, member count, description
- Background: Elevated surface color with border border-border
- Padding: p-8
- Hover: Subtle lift (hover:-translate-y-1)

**Dashboard Components**:
- Upload zone: Dashed border (border-2 border-dashed), drag-and-drop area
- File preview grid: Thumbnails with remove button overlay
- Form inputs: Clean borders, focus:ring-2 focus:ring-primary
- Action buttons: Grouped horizontally on desktop, stacked on mobile

**Footer**:
- Multi-column layout: grid-cols-1 md:grid-cols-4
- Sections: About, Quick Links, Contact, Social Media
- Newsletter signup: Email input + submit button
- Background: Slightly elevated from page background
- Padding: py-12 md:py-16

**Modals/Overlays**:
- Backdrop: backdrop-blur-sm bg-black/50
- Modal: max-w-2xl, rounded-2xl, shadow-2xl
- Animation: Fade in + scale from 95% to 100%

### E. Animations

**Use Sparingly**:
- Page transitions: Smooth fade-ins (opacity + slight y-transform)
- Card hovers: Scale (1.02-1.05) + shadow enhancement
- CTA buttons: Subtle scale on hover (hover:scale-105)
- Loading states: Skeleton screens (shimmer effect) or simple spinners
- Avoid: Excessive scroll-triggered animations, complex parallax

---

## Images

**Hero Section**:
- **Large Hero Image**: Yes - showcasing a dynamic campus event, students collaborating in a club meeting, or vibrant bootcamp activity
- Dimensions: Full viewport width, 600-700px height
- Treatment: Overlay gradient for text readability
- Source: Use placeholder from Unsplash (college students, campus events)

**Event Cards**:
- Each event displays a poster/promotional image
- Aspect ratio: 16:10
- Treatment: Rounded corners, subtle shadow

**Club Pages**:
- Club logo: Circular, 80x80px (grid), 120x120px (individual page)
- Gallery images: Grid layout, various aspect ratios, rounded corners

**Background Accents**:
- Subtle gradient meshes in hero and footer (optional decorative elements)
- Keep focus on content imagery

---

## Page-Specific Guidelines

**Homepage**:
- Hero with large background image + centered headline + dual CTAs
- "Upcoming Events" section: 3-column grid of event cards
- "Featured Clubs" section: 4-column grid with club logos and names
- "Why Join" section: 2-column feature highlights with icons
- Stats banner: Total clubs, upcoming events, active members (single row)

**Clubs Page**:
- Filter/search bar: Sticky below header
- Grid of club cards: Uniform height, hover effects
- Pagination or infinite scroll

**Events Page**:
- Calendar view toggle option (list vs. calendar grid)
- Filter by date, club, category
- Event cards with registration CTAs

**Individual Club Page**:
- Hero banner with club cover photo
- Club info sidebar: Logo, member count, social links
- Tabs: About, Events, Gallery, Resources
- Photo gallery: Masonry grid layout

**Admin Dashboard**:
- Sidebar navigation (desktop) / bottom nav (mobile)
- Upload form: Clean, spacious, with drag-and-drop
- Content table: Sortable columns, action buttons
- Analytics cards: Stats with icons and trend indicators