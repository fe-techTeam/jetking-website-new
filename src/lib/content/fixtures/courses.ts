import type { Course } from '../types';

/**
 * Course catalogue — grounded in the live Jetking site (jetking.com/courses),
 * fetched 2026-08-07. Titles, durations, levels, eligibility, curriculum and
 * career outcomes mirror the published course pages.
 *
 * Slugs are derived from each live programme's own identity (no legacy
 * placeholder slugs remain). They are referenced across persona journeys, centre
 * featured-programme visuals, professional upskill data, per-centre lists and
 * legacy redirects, so a rename must be applied across those call sites too.
 *
 * `fees.disclosed: false` stays the default: the live site does not publish fee
 * figures, so the AI Guide must hand off to a counsellor rather than quote a
 * number (risk R4). Levels map the site's tabs: Degree → degree, Career → diploma,
 * Certification → certification, Short → short.
 */
export const courses: Course[] = [
  /* ── Degree courses ─────────────────────────────────────────────────────── */
  {
    slug: 'bca-cloud-cyber-security',
    title: 'BCA in Cloud Computing & Cyber Security',
    heroImage: { url: '/courses/bca-cloud-cyber-security.jpg', alt: "BCA in Cloud Computing & Cyber Security — illustration" },
    shortTitle: 'BCA — Cloud & Cyber',
    level: 'degree',
    duration: '3 years',
    eligibility:
      'Pass in 10+2 from any recognised board (State / CBSE / ICSE / NIOS / IB / IGCSE). Students appearing for 10+2 may also apply. No entrance test.',
    summary:
      'A UGC-approved bachelor degree specialising in cloud architecture and cyber security, with hands-on labs and paid internships. Students build expertise in cloud platforms, information security, cryptography and digital forensics.',
    outcomes: [
      'Enter roles such as Cloud Administrator, SOC Analyst or Network Security Specialist',
      'Design and secure cloud infrastructure on AWS, Azure and Google Cloud',
      'Graduate with a recognised BCA degree stacked with global certifications',
    ],
    modules: [
      'Programming in C, C++, OOP and data structures',
      'Networking, inter-networking (Cisco) and server OS (Windows / Linux)',
      'Enterprise Linux (RHCSA), Azure and AWS cloud administration',
      'Ethical hacking (CEH), cyber laws and digital forensics (CHFI)',
      'Penetration testing, Splunk security and capstone project',
    ],
    certifications: ['AWS', 'Microsoft Azure', 'CEH', 'CHFI', 'Red Hat (RHCSA)', 'Cisco'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 1, parent: 0.95, professional: 0.2 },
    seo: {
      title: 'BCA in Cloud Computing & Cyber Security — 3 Years | Jetking',
      description:
        'A 3-year UGC-approved BCA degree in cloud computing and cyber security. Global certifications, paid internships and placement support. Eligibility: 10+2 any stream.',
    },
    featured: true,
    updatedAt: '2026-08-07',
  },
  {
    slug: 'mca-cloud-cyber-security',
    title: 'MCA in Cloud Computing & Cyber Security',
    heroImage: { url: '/courses/mca-cloud-cyber-security.jpg', alt: "MCA in Cloud Computing & Cyber Security — illustration" },
    shortTitle: 'MCA — Cloud & Cyber',
    level: 'degree',
    duration: '2 years',
    eligibility:
      'BCA, B.Sc. (Computer Science) or any graduation with Mathematics, minimum 50%. Some intakes require a university / CET entrance.',
    summary:
      'A UGC-recognised postgraduate degree (Yenepoya Deemed University) training students in cloud infrastructure, network security, ethical hacking and cyber threat management to work as a Cloud & Cyber Security Engineer.',
    outcomes: [
      'Move into Cloud Support Engineer, SOC Analyst or Cybersecurity Analyst roles',
      'Manage cloud infrastructure across AWS, Azure and Google Cloud',
      'Apply machine learning and generative AI to security and app development',
    ],
    modules: [
      'C programming, operating systems and Cisco network solutions',
      'Windows Server, Linux administration and shell scripting',
      'AWS and Azure cloud administration, web application development',
      'Cyber forensics, incident analysis and ethical hacking',
      'Machine learning, security analytics with Splunk and capstone projects',
    ],
    certifications: ['AWS', 'Microsoft Azure', 'CEH', 'CompTIA Security+', 'Splunk', 'Cisco'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 0.9, professional: 0.6, parent: 0.7 },
    seo: {
      title: 'MCA in Cloud Computing & Cyber Security — 2 Years | Jetking',
      description:
        'A 2-year UGC-recognised MCA in cloud computing and cyber security (Yenepoya University). Cloud administration, ethical hacking, forensics and AI.',
    },
    featured: true,
    updatedAt: '2026-08-07',
  },
  {
    slug: 'bca-multimedia-animation',
    title: 'BCA in Multimedia & Animation',
    heroImage: { url: '/courses/bca-multimedia-animation.jpg', alt: "BCA in Multimedia & Animation — illustration" },
    shortTitle: 'BCA — Multimedia',
    level: 'degree',
    duration: '3 years',
    eligibility: 'Pass in 10+2 from a recognised board. Open to students with a creative interest; no prior design experience needed.',
    summary:
      'A creative bachelor degree covering 2D and 3D design, animation, visual effects, game development, UI/UX and AR/VR with industry-standard tools and hands-on production work.',
    outcomes: [
      'Enter roles such as 2D/3D Animator, VFX Compositor or Motion Graphics Artist',
      'Design games and immersive AR/VR and metaverse experiences',
      'Build a portfolio across UI/UX, modelling and post-production',
    ],
    modules: [
      'Drawing, colour theory, 2D design, photography and video editing',
      'VFX, motion graphics, 3D modelling and sculpting',
      'Cinema 4D and Houdini for 3D and effects',
      'UI/UX design, wireframing and prototyping',
      'Game design, metaverse and NFT creation with Unreal Engine and Unity',
    ],
    certifications: ['Adobe Creative Suite', 'Figma', 'Unity', 'Unreal Engine', 'Cinema 4D'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 0.9, parent: 0.7 },
    seo: {
      title: 'BCA in Multimedia & Animation — 3 Years | Jetking',
      description:
        'A 3-year BCA in multimedia and animation — 2D/3D design, VFX, game development, UI/UX and AR/VR with Adobe, Unity and Unreal Engine.',
    },
    updatedAt: '2026-08-07',
  },

  /* ── Career courses (diploma / professional) ────────────────────────────── */
  {
    slug: 'cloud-computing-engineer-ai',
    title: 'Jetking Certified Cloud Computing Engineer with AI',
    heroImage: { url: '/courses/cloud-computing-engineer-ai.jpg', alt: "Jetking Certified Cloud Computing Engineer with AI — illustration" },
    shortTitle: 'Cloud Engineer with AI',
    level: 'diploma',
    duration: '12 months',
    eligibility: 'Any graduate or 10+2 student wanting a career in cloud computing, AI or cyber security.',
    summary:
      'A career course combining cloud infrastructure fundamentals with applied artificial intelligence. Learners deploy AI workloads in cloud environments while earning industry-recognised credentials.',
    outcomes: [
      'Enter roles such as Cloud Engineer, Network Engineer or Server Administrator',
      'Work across AWS, Azure and Google Cloud environments',
      'Apply machine learning, NLP and edge computing to real workloads',
    ],
    modules: [
      'PC hardware, client OS (Windows / Linux) and networking fundamentals',
      'CCNA routing and switching',
      'Windows Server 2019 / 2022 administration',
      'Cloud environments — Google Cloud and AWS',
      'AI platforms, machine learning, NLP and edge computing',
    ],
    certifications: ['CCNA', 'MCSA', 'Red Hat (RHCSA)', 'AWS'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 1, student: 0.8, parent: 0.4 },
    seo: {
      title: 'Cloud Computing Engineer with AI — 12 Months | Jetking',
      description:
        'A 12-month Jetking career course in cloud computing with applied AI — CCNA, Windows Server, AWS and Google Cloud. Open to 10+2 and graduates.',
    },
    featured: true,
    updatedAt: '2026-08-07',
  },
  {
    slug: 'cloud-cyber-security-engineer',
    title: 'Jetking Certified Cloud Computing & Cyber Security Engineer',
    heroImage: { url: '/courses/cloud-cyber-security-engineer.jpg', alt: "Jetking Certified Cloud Computing & Cyber Security Engineer — illustration" },
    shortTitle: 'Cloud & Cyber Engineer',
    level: 'diploma',
    duration: '18 months',
    eligibility: 'Any graduate or 10+2 student aiming for a cloud and security support career. Suitable for working professionals entering IT.',
    summary:
      'A comprehensive career course combining cloud computing with cyber security — cloud architecture, service models, network security and ethical hacking with extensive hands-on labs and global certifications.',
    outcomes: [
      'Operate as a Cloud Support, Network Support or Security Support Engineer',
      'Run SOC-style monitoring, hardening and ethical hacking workflows',
      'Stack global certifications across cloud, Linux and security',
    ],
    modules: [
      'Windows 10, Microsoft 365, Python and PC / network configuration',
      'MCSA 2019, CCNA 200-301 and Red Hat RHCSA',
      'AWS Solutions Architect and Check Point firewall',
      'Kali Linux and ethical hacking (CEH v11)',
      'Value-add tech — 5G, blockchain, AI/ML, IoT and edge computing',
    ],
    certifications: ['MCSA 2019', 'CCNA', 'Red Hat (RHCSA)', 'AWS SAA', 'CEH v11'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 1, student: 0.8, parent: 0.5 },
    seo: {
      title: 'Cloud Computing & Cyber Security Engineer — 18 Months | Jetking',
      description:
        'An 18-month Jetking career course in cloud computing and cyber security — MCSA, CCNA, RHCSA, AWS and CEH. Open to 10+2 and graduates.',
    },
    featured: true,
    updatedAt: '2026-08-07',
  },
  {
    slug: 'cloud-computing-professional-ai',
    title: 'Jetking Certified Cloud Computing Professional with AI',
    heroImage: { url: '/courses/cloud-computing-professional-ai.jpg', alt: "Jetking Certified Cloud Computing Professional with AI — illustration" },
    shortTitle: 'Cloud Professional with AI',
    level: 'diploma',
    duration: '6 months',
    eligibility: 'Any graduate or 10+2 student interested in cloud computing, AI or cyber security.',
    summary:
      'A focused professional course blending cloud computing with AI integration — building solutions, managing large-scale data and automating intelligent systems for modern business environments.',
    outcomes: [
      'Move into Cloud Engineer or L1 Network Support roles',
      'Administer Linux servers and data-centre operations',
      'Apply machine learning, prompt engineering and AI in the cloud',
    ],
    modules: [
      'PC hardware, client OS and service-desk tools',
      'Networking essentials and CCNA',
      'MCSA 2022 with Azure',
      'Red Hat Linux and Python',
      'AWS Solutions Architect, machine learning and prompt engineering',
    ],
    certifications: ['Microsoft Azure', 'AWS', 'Red Hat', 'CCNA', 'NSDC / Skill India'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 1, student: 0.6 },
    seo: {
      title: 'Cloud Computing Professional with AI — 6 Months | Jetking',
      description:
        'A 6-month Jetking professional course in cloud computing with applied AI. CCNA, Azure, Red Hat, AWS and machine learning. Open to 10+2 pass and graduates.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'cloud-cyber-security-professional',
    title: 'Jetking Certified Cloud Computing & Cyber Security Professional',
    heroImage: { url: '/courses/cloud-cyber-security-professional.jpg', alt: "Jetking Certified Cloud Computing & Cyber Security Professional — illustration" },
    shortTitle: 'Cloud & Cyber Professional',
    level: 'diploma',
    duration: '12 months',
    eligibility: 'Graduates (technical or non-technical) or 10+2 students aspiring to become IT and desktop support professionals.',
    summary:
      'A professional course combining cloud computing and cyber security across a stack of global certifications, preparing learners to manage secure cloud environments and enterprise IT infrastructure.',
    outcomes: [
      'Enter Field Support, Systems Support or Network Support Engineer roles',
      'Administer secure cloud and on-prem infrastructure',
      'Stack fourteen global certifications across cloud, Linux and security',
    ],
    modules: [
      'Hardware, networking, Windows 10, Microsoft 365, Python and CCNA',
      'MCSA 2019, Red Hat RHCSA and AWS Solutions Architect',
      'Check Point firewall, Citrix ADC and Azure AZ-104',
      'Storage, data-centre modernisation and ethical hacking (CEH v11)',
      'Value-add tech — blockchain, AI/ML, IoT and penetration testing',
    ],
    certifications: ['CCNA', 'MCSA 2019', 'Red Hat (RHCSA)', 'AWS SAA', 'Azure AZ-104', 'CEH v11'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 1, student: 0.7, parent: 0.4 },
    seo: {
      title: 'Cloud & Cyber Security Professional — 12 Months | Jetking',
      description:
        'A 12-month Jetking professional course in cloud and cyber security with 14 global certifications — CCNA, MCSA, RHCSA, AWS and CEH.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'gaming-metaverse-design',
    title: 'Masters in Gaming & Metaverse Design',
    heroImage: { url: '/courses/gaming-metaverse-design.jpg', alt: "Masters in Gaming & Metaverse Design — illustration" },
    shortTitle: 'Gaming & Metaverse',
    level: 'diploma',
    duration: '2 years',
    eligibility: 'Open to 10+2 students and graduates with a creative interest in gaming, animation and design.',
    summary:
      'A master course spanning graphics and web design, motion graphics, animation, VFX, UX design and AR/VR — developing creative professionals for the gaming and metaverse industry.',
    outcomes: [
      'Enter roles such as Metaverse Unity Developer, Game Asset Creator or Animator',
      'Build 3D environments, characters and VR backgrounds',
      'Work across motion graphics, FX, compositing and UX design',
    ],
    modules: [
      'Graphics and web design',
      'Motion graphics and animation',
      'VFX and 3D modelling and texturing',
      'UX design and AR / VR',
      'Character and environment design, digital marketing',
    ],
    certifications: ['Unity', 'Unreal Engine', 'Adobe Creative Suite', 'Cinema 4D'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 0.85, professional: 0.4 },
    seo: {
      title: 'Masters in Gaming & Metaverse Design — 2 Years | Jetking',
      description:
        'A 2-year Jetking masters in gaming and metaverse design covering animation, VFX, UX, AR/VR and game development with Unity and Unreal Engine.',
    },
    updatedAt: '2026-08-07',
  },

  /* ── Certification courses ──────────────────────────────────────────────── */
  {
    slug: 'data-analyst',
    title: 'Jetking Certified Data Analyst',
    heroImage: { url: '/courses/data-analyst.jpg', alt: "Jetking Certified Data Analyst — illustration" },
    shortTitle: 'Data Analyst',
    level: 'certification',
    duration: '4 months',
    eligibility: 'Open to 10+2 students and graduates interested in a data and analytics career.',
    summary:
      'A data analytics certification covering Excel, SQL, Power BI, Python and Tableau, with an emphasis on data analysis, visualisation and business insight through project work.',
    outcomes: [
      'Enter roles such as Data Analyst, Business Analyst or Reporting Analyst',
      'Build dashboards and visualisations in Power BI and Tableau',
      'Analyse data with SQL and Python (Pandas, NumPy)',
    ],
    modules: [
      'Introduction to data analytics',
      'Data analysis with Excel and SQL',
      'Data visualisation with Power BI',
      'Python for data analysis',
      'Tableau and a capstone case study',
    ],
    certifications: ['NSDC / Skill India', 'Power BI', 'Tableau', 'SQL', 'Python'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 1, student: 0.8 },
    seo: {
      title: 'Certified Data Analyst Course — 4 Months | Jetking',
      description:
        'A 4-month data analyst certification — Excel, SQL, Power BI, Python and Tableau with a capstone. NSDC / Skill India recognised.',
    },
    featured: true,
    updatedAt: '2026-08-07',
  },
  {
    slug: 'routing-switching-administrator',
    title: 'Routing & Switching Administrator (CCNA)',
    heroImage: { url: '/courses/routing-switching-administrator.jpg', alt: "Routing & Switching Administrator (CCNA) — illustration" },
    shortTitle: 'Routing & Switching',
    level: 'certification',
    duration: '2 months',
    eligibility: 'Graduates or 10+2 students; technical graduates need no prior knowledge. Others may start with the Networking Essentials module.',
    summary:
      'A CCNA-aligned certification building core routing and switching skills through hands-on labs on Cisco devices, preparing learners for real-world enterprise networking.',
    outcomes: [
      'Enter roles such as Network Administrator or Network Support Engineer (L1)',
      'Configure and troubleshoot enterprise routing and switching',
      'Work with Cisco IOS, VLANs and IP services',
    ],
    modules: [
      'Network fundamentals and IP addressing',
      'Network access technologies and Cisco devices',
      'Advanced IP connectivity and IP services',
      'Wireless networks and infrastructure security',
      'WAN technologies, automation and troubleshooting',
    ],
    certifications: ['Cisco CCNA (200-301)'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 0.8, professional: 0.7, parent: 0.5 },
    seo: {
      title: 'Routing & Switching Administrator (CCNA) — 2 Months | Jetking',
      description:
        'A 2-month CCNA routing and switching certification with hands-on Cisco labs — IP connectivity, wireless and security. Open to 10+2 and graduates.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'microsoft-server-specialist',
    title: 'Microsoft Server Technology Specialist',
    heroImage: { url: '/courses/microsoft-server-specialist.jpg', alt: "Microsoft Server Technology Specialist — illustration" },
    shortTitle: 'MS Server Specialist',
    level: 'certification',
    duration: '2.5 months',
    eligibility: 'Any graduate or 10+2 student interested in IT support; basic hardware, networking and Windows knowledge helps.',
    summary:
      'A certification that trains professionals to install, configure and manage Windows Server 2019 / 2022 environments — server administration, virtualisation, high availability and Azure hybrid integration.',
    outcomes: [
      'Enter roles such as System Administrator or Windows Server Administrator',
      'Manage Active Directory, storage and Hyper-V virtualisation',
      'Configure failover clustering and Azure hybrid IaaS',
    ],
    modules: [
      'Windows Server 2019, DNS and DHCP',
      'Active Directory Domain Services',
      'Local and enterprise storage configuration',
      'Hyper-V virtual machines and containers',
      'Failover clustering, load balancing and Azure hybrid IaaS',
    ],
    certifications: ['Microsoft MCTS', 'Windows Server 2019 / 2022', 'Azure Hybrid'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 0.9, student: 0.6 },
    seo: {
      title: 'Microsoft Server Technology Specialist — 2.5 Months | Jetking',
      description:
        'A Microsoft Server Technology Specialist certification — Windows Server 2019/2022, Active Directory, Hyper-V, clustering and Azure hybrid.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'ethical-hacking-specialist',
    title: 'Ethical Hacking Specialist',
    heroImage: { url: '/courses/ethical-hacking-specialist.jpg', alt: "Ethical Hacking Specialist — illustration" },
    shortTitle: 'Ethical Hacking',
    level: 'certification',
    duration: '2 months',
    eligibility: 'Any graduate or 10+2 student interested in cyber security with hardware, networking and OS knowledge. A bridge course covers missing foundations.',
    summary:
      'An intensive course teaching ethical hacking tools, techniques and methodology across network security, penetration testing and vulnerability assessment, aligned to the CEH v12 standard.',
    outcomes: [
      'Enter entry-level cyber security and security analyst roles',
      'Run reconnaissance, scanning, exploitation and reporting',
      'Prepare for the Certified Ethical Hacker (CEH) exam',
    ],
    modules: [
      'Footprinting, reconnaissance and network scanning',
      'System hacking, malware threats and packet sniffing',
      'Social engineering, DoS and session hijacking',
      'Web, SQL injection, wireless and mobile hacking',
      'Cloud threats, cryptography and penetration testing',
    ],
    certifications: ['Certified Ethical Hacker (CEH v12)'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 1, student: 0.8 },
    seo: {
      title: 'Ethical Hacking Specialist (CEH v12) — 2 Months | Jetking',
      description:
        'A 2-month ethical hacking certification aligned to CEH v12 — reconnaissance, penetration testing, web and wireless hacking. Open to 10+2 and graduates.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'aws-solution-specialist',
    title: 'AWS Solution Specialist',
    heroImage: { url: '/courses/aws-solution-specialist.jpg', alt: "AWS Solution Specialist — illustration" },
    shortTitle: 'AWS Specialist',
    level: 'certification',
    duration: '2 months',
    eligibility: 'Any graduate or 10+2 student interested in a cloud career, with hardware, networking and server knowledge (bridge course available).',
    summary:
      'A course preparing learners for the AWS Certified Solutions Architect – Associate certification through hands-on projects covering cloud architecture, AWS services and secure application deployment.',
    outcomes: [
      'Enter roles such as Cloud Associate (L1) or AWS Cloud NOC Support',
      'Design and deploy secure applications on AWS',
      'Prepare for the AWS Solutions Architect – Associate exam',
    ],
    modules: [
      'Cloud computing and AWS foundational services',
      'Amazon S3, Glacier, EC2 and EBS',
      'Virtual Private Cloud and management tools',
      'Security, IAM, databases and Route 53',
      'Automation, serverless and troubleshooting',
    ],
    certifications: ['AWS Certified Solutions Architect – Associate'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 1, student: 0.6 },
    seo: {
      title: 'AWS Solution Specialist — 2 Months | Jetking',
      description:
        'A 2-month AWS Solutions Architect – Associate certification course. EC2, S3, VPC, IAM, databases and serverless with hands-on projects. Open to 10+2 and graduates.',
    },
    updatedAt: '2026-08-07',
  },

  /* ── Short courses ──────────────────────────────────────────────────────── */
  {
    slug: 'red-hat-professional',
    title: 'Red Hat Professional (RHCSA)',
    heroImage: { url: '/courses/red-hat-professional.jpg', alt: "Red Hat Professional (RHCSA) — illustration" },
    shortTitle: 'Red Hat (RHCSA)',
    level: 'short',
    duration: '2 months',
    eligibility: 'Technical graduates, or non-technical graduates and 10+2 candidates with hardware and networking knowledge.',
    summary:
      'A Red Hat Linux course building practical skills in installation, configuration and system administration of Red Hat Enterprise Linux — the entry point to becoming a Red Hat Certified System Administrator.',
    outcomes: [
      'Enter roles such as Linux Systems Administrator',
      'Administer users, permissions, services and storage on RHEL',
      'Prepare for the Red Hat RHCSA (EX200) exam',
    ],
    modules: [
      'Linux command line and file management',
      'Users, groups, permissions and processes',
      'OpenSSH, networking and package management',
      'Scheduling, ACLs and SELinux security',
      'Storage, LVM, firewalls and containers',
    ],
    certifications: ['Red Hat RHCSA (EX200)'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { professional: 0.9, student: 0.6 },
    seo: {
      title: 'Red Hat Professional (RHCSA) — 2 Months | Jetking',
      description:
        'A 2-month Red Hat Linux course covering RHEL installation, administration, security and storage, preparing for the RHCSA (EX200) exam. Open to 10+2 and graduates.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'pc-hardware-support',
    title: 'PC Hardware Support',
    heroImage: { url: '/courses/pc-hardware-support.jpg', alt: "PC Hardware Support — illustration" },
    shortTitle: 'PC Hardware Support',
    level: 'short',
    duration: '1 month',
    eligibility: 'Open to any graduate, undergraduate or diploma holder. Absolute beginners welcome.',
    summary:
      'A short entry-level course to maintain, troubleshoot and repair desktop computers — covering hardware components, operating systems and applications through theory and practical labs.',
    outcomes: [
      'Enter roles such as Field Support or Desktop Engineer (L1)',
      'Assemble, troubleshoot and repair PCs and peripherals',
      'Install and manage Windows, Linux and macOS',
    ],
    modules: [
      'PC components, safety, assembly and disassembly',
      'Printers, scanners and imaging devices',
      'Laptop and mobile device troubleshooting',
      'Operating system installation and BIOS / firmware',
      'Network basics, system security and virtualisation',
    ],
    certifications: [],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 0.8, parent: 0.7 },
    seo: {
      title: 'PC Hardware Support Course — 1 Month | Jetking',
      description:
        'A 1-month PC hardware support course covering assembly, troubleshooting, operating systems and networking basics. Absolute beginners welcome.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'windows-10-specialist',
    title: 'Windows 10 Operating System',
    heroImage: { url: '/courses/windows-10-specialist.jpg', alt: "Windows 10 Operating System — illustration" },
    shortTitle: 'Windows 10',
    level: 'short',
    duration: '1.5 months',
    eligibility: 'Any graduate or 10+2 student aiming for a desktop support career.',
    summary:
      'A short certification teaching Windows 10 setup, troubleshooting and device management with hands-on projects — including security features and Azure service integration.',
    outcomes: [
      'Enter roles such as Field Support or Desktop Engineer (L1)',
      'Deploy, configure and troubleshoot Windows 10',
      'Manage data access, protection and Microsoft Intune',
    ],
    modules: [
      'Deploying Windows 10 and post-install configuration',
      'Managing networks, storage and apps',
      'Data access and protection',
      'Authentication, authorisation and threat protection',
      'Microsoft Intune and diagnostics',
    ],
    certifications: ['Microsoft Windows 10 (70-697)', 'Microsoft Intune'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 0.7, professional: 0.5 },
    seo: {
      title: 'Windows 10 Operating System Course — 1.5 Months | Jetking',
      description:
        'A 1.5-month Windows 10 certification covering deployment, configuration, security, Intune and troubleshooting. Open to 10+2 and graduates.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'networking-essentials',
    title: 'Networking Essentials Specialist',
    heroImage: { url: '/courses/networking-essentials.jpg', alt: "Networking Essentials Specialist — illustration" },
    shortTitle: 'Networking Essentials',
    level: 'short',
    duration: '1.5 months',
    eligibility: 'Basic understanding of computer systems. A relevant background or prior IT exposure helps but is not required.',
    summary:
      'A short course teaching computer networking fundamentals and IT infrastructure skills — devices, topologies, IP addressing, security and monitoring — as a foundation for networking roles.',
    outcomes: [
      'Enter roles such as Network Support or Field Support Engineer',
      'Configure LANs, VLANs, IP addressing and wireless',
      'Use monitoring and remote troubleshooting tools',
    ],
    modules: [
      'Network devices, topology and OSI / TCP-IP models',
      'Structured cabling, UTP and fibre optics',
      'Ethernet, LAN and VLAN technologies',
      'IP addressing, subnetting and network security',
      'DNS, DHCP, wireless and monitoring (Wireshark)',
    ],
    certifications: ['Cisco networking', 'Windows Server', 'Red Hat Linux'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 0.8, parent: 0.6, professional: 0.5 },
    seo: {
      title: 'Networking Essentials Specialist — 1.5 Months | Jetking',
      description:
        'A 1.5-month networking essentials course covering devices, cabling, VLANs, IP addressing, security and monitoring — a foundation for IT networking roles.',
    },
    updatedAt: '2026-08-07',
  },
  {
    slug: 'digital-marketing',
    title: 'Digital Marketing Training Solutions',
    heroImage: { url: '/courses/digital-marketing.jpg', alt: "Digital Marketing Training Solutions — illustration" },
    shortTitle: 'Digital Marketing',
    level: 'short',
    duration: '6 months',
    eligibility: 'Open to 10+2 students and graduates interested in a digital marketing career.',
    summary:
      'A master course in digital marketing covering SEO, SEM, social media, content, email marketing and analytics, with practical learning through live industry projects.',
    outcomes: [
      'Enter digital marketing roles across e-commerce, IT, media and advertising',
      'Run SEO, SEM and paid social campaigns end to end',
      'Measure and report performance with Google Analytics',
    ],
    modules: [
      'Digital marketing fundamentals, blogging and websites',
      'Search engine optimisation (on-page, off-page, technical)',
      'Search engine marketing and Google Ads',
      'Social media, affiliate and email marketing',
      'Online reputation management and Google Analytics',
    ],
    certifications: ['Google Analytics', 'Google Ads', 'Meta (Facebook) Ads'],
    fees: { disclosed: false, emiAvailable: true, note: 'Fees vary by centre and intake. Confirmed by a counsellor.' },
    personaRelevance: { student: 0.7, professional: 0.6 },
    seo: {
      title: 'Digital Marketing Training Course — 6 Months | Jetking',
      description:
        'A 6-month digital marketing master course covering SEO, SEM, social media, email marketing and Google Analytics with live projects. Open to 10+2 and graduates.',
    },
    updatedAt: '2026-08-07',
  },
];
