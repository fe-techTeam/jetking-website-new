/**
 * Plain logo lists (no React, no icons) so server scripts — the chatbot export, the CMS seed — can import them.
 * The components re-export these names, so there is still one source of truth.
 */

/** Real cert/vendor logos already in `public/logos/`, limited to certifications Jetking's own course fixtures actually cite. */
export const CERT_LOGOS = [
  { name: 'Cisco', file: '/logos/brands/cisco.svg' },
  { name: 'AWS', file: '/logos/brands/aws.svg' },
  { name: 'Microsoft Azure', file: '/logos/brands/azure.svg' },
  { name: 'Red Hat', file: '/logos/brands/redhat.svg' },
  { name: 'CompTIA', file: '/logos/brands/comptia.svg' },
  { name: 'CEH', file: '/logos/ceh.svg' },
  { name: 'CHFI', file: '/logos/chfi.svg' },
  { name: 'Splunk', file: '/logos/brands/splunk.svg' },
  { name: 'Python', file: '/logos/brands/python.svg' },
  { name: 'Power BI', file: '/logos/brands/powerbi.svg' },
  { name: 'Tableau', file: '/logos/tableau.svg' },
  { name: 'Unity', file: '/logos/brands/unity.svg' },
  { name: 'Unreal Engine', file: '/logos/brands/unreal.svg' },
  { name: 'Windows Server', file: '/logos/brands/windowsserver.svg' },
  { name: 'Google Cloud', file: '/logos/brands/googlecloud.svg' },
  { name: 'Kubernetes', file: '/logos/brands/kubernetes.svg' },
  { name: 'Docker', file: '/logos/brands/docker.svg' },
  { name: 'Linux', file: '/logos/brands/linux.svg' },
  { name: 'Kali Linux', file: '/logos/brands/kali.svg' },
  { name: 'Wireshark', file: '/logos/brands/wireshark.svg' },
  { name: 'Fortinet', file: '/logos/brands/fortinet.svg' },
  { name: 'Check Point', file: '/logos/checkpoint.svg' },
  { name: 'Citrix', file: '/logos/brands/citrix.svg' },
  { name: 'MySQL', file: '/logos/brands/mysql.svg' },
  { name: 'Grafana', file: '/logos/brands/grafana.svg' },
  { name: 'Adobe', file: '/logos/brands/adobe.svg' },
  { name: 'Figma', file: '/logos/brands/figma.svg' },
  { name: 'C++', file: '/logos/brands/cpp.svg' },
  { name: '.NET', file: '/logos/brands/dotnet.svg' },
] as const;

/** Employers beyond `HIRING_PARTNERS` — the rest of the logos in `public/placements/`. `dark` = light-on-dark artwork that needs a dark tile. */
export const MORE_EMPLOYER_LOGOS: ReadonlyArray<{ name: string; file: string; dark?: boolean }> = [
  { name: 'Times of India', file: '/logos/employers/times-of-india.svg' },
  { name: 'Bharti Airtel', file: '/placements/partners/bharti-airtel.svg' },
  { name: 'Birla Corp', file: '/placements/partners/birla-corp.jpg' },
  { name: 'Futwork', file: '/placements/partners/futwork.svg' },
  { name: 'Laundryheap', file: '/placements/partners/laundryheap.svg' },
  { name: 'Reisnet', file: '/placements/partners/reisnet.png', dark: true },
];

/**
 * Recruiters Jetking itself publishes on jetking.com. Logos are the site's own
 * (vector logos in /public/logos/employers; Tikona is a raster in /public/placements/recruiters); a company that is not listed there is not
 * shown here, rather than being drawn from a generic "top IT employers" list.
 */
export const HIRING_PARTNERS = [
  { name: 'Accenture', logo: '/logos/employers/accenture.svg' },
  { name: 'Amazon', logo: '/logos/employers/amazon.svg' },
  { name: 'Capgemini', logo: '/logos/employers/capgemini.svg' },
  { name: 'IBM', logo: '/logos/employers/ibm.svg' },
  { name: 'Infosys', logo: '/logos/employers/infosys.svg' },
  { name: 'Microsoft', logo: '/logos/employers/microsoft.svg' },
  { name: 'Samsung', logo: '/logos/employers/samsung.svg' },
  { name: 'SAP', logo: '/logos/employers/sap.svg' },
  { name: 'Tech Mahindra', logo: '/logos/employers/tech-mahindra.svg' },
  { name: 'Tikona', logo: '/placements/recruiters/tikona.png' },
  { name: 'Vodafone', logo: '/logos/employers/vodafone.svg' },
  { name: 'Wipro', logo: '/placements/partners/wipro.svg' },
] as const;
