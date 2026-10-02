/**
 * Maps a tool / certification / partner name to a local brand logo
 * (public/logos/<slug>.svg) plus its official brand colour. Keyword matching so
 * that granular names ("Amazon EC2 and EBS", "AWS IAM", "Red Hat RHCSA") all
 * resolve to the right glyph. Returns null when there is no matching logo.
 *
 * Rules are ordered: the first whose keyword is a substring of the (lowercased)
 * name wins, so specific brands sit above generic ones (e.g. AWS before Amazon,
 * Google Ads before Google Cloud, Red Hat / Kali before plain Linux).
 */

export interface BrandMark {
  /** Public path, e.g. `/logos/amazonwebservices.svg` */
  src: string;
  /** Official brand hex (without alpha), used to colour the monochrome glyph. */
  color: string;
  /**
   * When true the SVG already carries its own fills (e.g. CEH/CHFI badges) and
   * should be rendered as an <img>, not a CSS mask.
   */
  painted?: boolean;
}

const RULES: Array<[slug: string, color: string, keywords: string[], painted?: boolean]> = [
  ['googleads', '#4285F4', ['google ads', 'display network']],
  ['googleanalytics', '#E37400', ['google analytics']],
  ['googlecloud', '#4285F4', ['google cloud', 'gcp', ' gcc']],
  [
    'amazonwebservices',
    '#FF9900',
    [
      'aws',
      'amazon web services',
      'amazon ec2',
      'amazon s3',
      'amazon vpc',
      'ec2',
      's3 ',
      'glacier',
      'route 53',
      'amazon databases',
      'amazon eks',
    ],
  ],
  ['amazon', '#FF9900', ['amazon']],
  ['microsoftazure', '#0078D4', ['azure']],
  [
    'windows11',
    '#0078D4',
    [
      'windows',
      'mcsa',
      'mcts',
      'hyper-v',
      'active directory',
      'microsoft 365',
      'ms-365',
      'microsoft management',
      'intune',
      'group policy',
      'failover cluster',
    ],
  ],
  ['microsoftexcel', '#217346', ['excel']],
  ['python', '#3776AB', ['python', 'pandas', 'numpy']],
  ['cplusplus', '#00599C', ['c/c++', 'c++', 'cplusplus']],
  ['redhat', '#EE0000', ['red hat', 'redhat', 'rhcsa', 'rhel', 'rhce']],
  ['cisco', '#1BA0D7', ['cisco', 'ccna', 'ccnp', 'eigrp', 'ip rip', 'frame relay']],
  ['ceh', '#B51E23', ['ceh', 'ethical hacking'], true],
  ['chfi', '#B51E23', ['chfi', 'computer hacking forensic', 'forensic investigator'], true],
  ['checkpoint', '#E97724', ['checkpoint', 'check point'], true],
  ['kalilinux', '#557C94', ['kali']],
  ['linux', '#FCC624', ['linux', 'selinux', 'shell scripting', 'openssh', 'lvm', 'nfs', 'smb']],
  ['wireshark', '#1679A7', ['wireshark']],
  ['splunk', '#65A637', ['splunk']],
  ['fortinet', '#EE3124', ['fortinet', 'fortigate']],
  ['grafana', '#F46800', ['grafana']],
  ['citrix', '#000048', ['citrix']],
  ['powerbi', '#F2C811', ['power bi', 'powerbi']],
  ['tableau', '#E97627', ['tableau']],
  ['unity', '#FFFFFF', ['unity']],
  ['unrealengine', '#0E1128', ['unreal']],
  ['figma', '#F24E1E', ['figma']],
  ['adobe', '#FF0000', ['adobe', 'photoshop', 'after effects', 'premiere', 'illustrator']],
  ['meta', '#0668E1', ['meta (', 'facebook messenger']],
  ['facebook', '#0866FF', ['facebook']],
  ['instagram', '#E4405F', ['instagram']],
  ['linkedin', '#0A66C2', ['linkedin']],
  ['x', '#FFFFFF', ['twitter']],
  ['youtube', '#FF0000', ['youtube']],
  ['pinterest', '#BD081C', ['pinterest']],
  ['snapchat', '#FFFC00', ['snapchat']],
  ['comptia', '#C8202F', ['comptia']],
  ['infosys', '#007CC3', ['infosys']],
  ['tcs', '#FFFFFF', ['tata consultancy', 'tcs']],
  ['docker', '#2496ED', ['docker', 'container']],
  ['kubernetes', '#326CE5', ['kubernetes', 'k8s']],
  ['dotnet', '#512BD4', ['.net', 'dotnet']],
  ['mysql', '#4479A1', ['mysql']],
];

/** Resolve a tool / cert / partner name to its logo mark, or null. */
export function brandMark(name: string): BrandMark | null {
  const n = name.toLowerCase();
  for (const [slug, color, keywords, painted] of RULES) {
    if (keywords.some((k) => n.includes(k))) {
      return { src: `/logos/${slug}.svg`, color, painted: painted === true };
    }
  }
  return null;
}
