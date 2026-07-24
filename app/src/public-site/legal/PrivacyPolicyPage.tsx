import { LegalPageLayout, LegalSection, LegalList, LegalParagraph } from './LegalPageLayout'

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy — UNSW PakSoc" effectiveDate="July 25, 2026">
      <LegalSection title="1. Information We Collect">
        <LegalList items={[
          'When you sign in with Google (through Supabase Authentication), we receive your name, email address and Google profile photo.',
          'We never receive or store your Google password — sign-in is handled entirely by Google and Supabase.',
          'If you are a committee member, the administrative actions you take in the dashboard (for example creating, editing or publishing an event, or creating and assigning a task) are recorded in an internal activity log together with your name and the time of the action.',
        ]} />
      </LegalSection>
      <LegalSection title="2. How We Use Your Data">
        <LegalList items={[
          'To create and identify your society membership.',
          'To provide role-based access, distinguishing between Admins/Executives, Sub-committee members, and general Members.',
          'To manage events and to assign and track tasks among the committee.',
          'To keep an internal record of who performed administrative actions, for committee accountability.',
        ]} />
      </LegalSection>
      <LegalSection title="3. Data Storage and Security">
        <LegalList items={[
          'Membership and society data (members, events, tasks and activity logs) are stored in a Supabase (PostgreSQL) database.',
          'Event images uploaded by committee members are stored in Supabase Storage.',
          'To keep you signed in, a session token is stored in your browser; we do not store your password.',
          'We rely on the security practices of Google and Supabase to protect this data.',
        ]} />
      </LegalSection>
      <LegalSection title="4. Third-Party Services">
        <LegalList items={[
          'Google — for sign-in and authentication.',
          'Supabase — for authentication, database and file storage.',
          'Google Maps — event pages embed a map of the venue, which loads content from Google.',
          "Our home page displays the society's own public Instagram posts; visiting Instagram is subject to Instagram's own policies.",
        ]} />
      </LegalSection>
      <LegalSection title="5. Your Choices">
        <LegalParagraph>
          Signing in is optional — you can browse events without an account. You may ask us to remove your
          membership data at any time by contacting us (below).
        </LegalParagraph>
      </LegalSection>
      <LegalSection title="6. Contact">
        <LegalParagraph>
          For any questions about this policy or your data, contact the PakSoc UNSW committee through our
          Instagram, <a href="https://www.instagram.com/unswpaksoc/" target="_blank" rel="noopener noreferrer" className="text-green-700 font-medium hover:underline">@unswpaksoc</a>.
        </LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  )
}
