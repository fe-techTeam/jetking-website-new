import { afterAll, describe, expect, it } from 'vitest';
import { HAS_DB } from './helpers/db';

const run = describe.skipIf(!HAS_DB);

run('lead intake (Postgres)', async () => {
  const { saveEnquiry } = await import('@/lib/leads/intake');
  const { getDb } = await import('@/lib/db/client');
  const { leads } = await import('@/lib/db/schema');
  const { eq, like } = await import('drizzle-orm');

  const PHONE = '+919000000001';
  const row = async (id: string) => (await getDb()!.select().from(leads).where(eq(leads.id, id)))[0]!;

  afterAll(async () => {
    await getDb()!.delete(leads).where(like(leads.name, '__test_%'));
  });

  it('maps a form enquiry: resolves city, course title, strips phone formatting', async () => {
    const saved = await saveEnquiry({
      name: '__test_form',
      phone: '+91 90000-00001',
      city: 'pune',
      courseSlug: 'bca-cloud-cyber-security',
      qualification: '10+2',
      message: 'Call me',
      persona: 'student',
      source: 'home-final-cta-form',
      utm: { source: 'google', medium: 'cpc', campaign: 'bca', landingPage: '/courses' },
    });
    expect(saved?.duplicate).toBe(false);
    const lead = await row(saved!.id);
    expect(lead).toMatchObject({
      phone: PHONE,
      city: 'Pune',
      state: 'Maharashtra',
      courseSlug: 'bca-cloud-cyber-security',
      source: 'form',
      form: 'home-final-cta-form',
      persona: 'student',
      qualification: '10+2',
      message: 'Call me',
      utmSource: 'google',
      utmCampaign: 'bca',
      landingPage: '/courses',
      crmStatus: 'none',
      status: 'new',
    });
    expect(lead.courseInterest).toMatch(/BCA/);
  });

  it('treats the same phone on the same form as one lead', async () => {
    const again = await saveEnquiry({ name: '__test_form', phone: PHONE, source: 'home-final-cta-form' });
    expect(again?.duplicate).toBe(true);
    const other = await saveEnquiry({ name: '__test_other', phone: PHONE, source: 'explore-landing' });
    expect(other?.duplicate).toBe(false);
  });

  it('maps channels: chatbot, franchise; unknown persona and unknown city are kept honestly', async () => {
    const chat = await saveEnquiry({ name: '__test_chat', phone: '9000000002', persona: 'unknown', source: 'jetking-ai-chat', city: 'Atlantis' });
    const lead = await row(chat!.id);
    expect(lead.source).toBe('chatbot');
    expect(lead.persona).toBeNull();
    expect(lead.city).toBe('Atlantis');
    const fr = await saveEnquiry({ name: '__test_fr', phone: '9000000003', persona: 'franchise', source: 'franchise-landing' });
    expect((await row(fr!.id)).source).toBe('franchise');
  });
});
