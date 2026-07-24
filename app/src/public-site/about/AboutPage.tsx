import { LegalPageLayout, LegalSection, LegalList, LegalParagraph } from '../legal/LegalPageLayout'

export default function AboutPage() {
  return (
    <LegalPageLayout title="About PakSoc UNSW">
      <LegalSection title="What this app is">
        <LegalParagraph>
          PakSoc UNSW is the official app of the Pakistani Society at the University of New South Wales.
          It brings the whole society into one place — a single home for discovering our events, finding
          where and when they happen, and keeping up with everything the society is doing across campus and
          social media.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="What you can do">
        <LegalList items={[
          'Discover upcoming and past society events, each with a live countdown, venue location, map and ticket or RSVP links.',
          'Follow the society across Instagram, TikTok and Facebook from a single social wall.',
          'Sign in to save your profile and membership so the app is personalised to you.',
          'For committee members: manage events, assign tasks and control member roles from one dashboard.',
        ]} />
      </LegalSection>

      <LegalSection title="Signing in with Google">
        <LegalParagraph>
          Signing in is optional. When you choose to sign in with Google, the app only uses your name, email
          address and profile photo — to personalise your membership and, for committee members, to unlock
          the tools for running the society. We never see or store your Google password. You can read more in
          our <a href="/privacy" className="text-green-700 font-medium hover:underline">Privacy Policy</a> and
          {' '}<a href="/terms" className="text-green-700 font-medium hover:underline">Terms of Service</a>.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Who runs it">
        <LegalParagraph>
          The app is built and maintained for the UNSW Pakistani Society. For any questions, contact{' '}
          <a href="mailto:syedayanata@gmail.com" className="text-green-700 font-medium hover:underline">syedayanata@gmail.com</a>.
        </LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  )
}
