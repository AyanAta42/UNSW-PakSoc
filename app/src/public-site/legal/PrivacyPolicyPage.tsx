import { LegalPageLayout, LegalSection, LegalList, LegalParagraph } from './LegalPageLayout'

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy — PakSoc UNSW Web App" effectiveDate="July 10, 2026">
      <LegalSection title="1. Information We Collect">
        <LegalList items={[
          'When you sign in using Google Auth via Supabase, we collect your full name and email address.',
          'We do not collect or store passwords; all authentication is handled securely by Google and Supabase.',
        ]} />
      </LegalSection>
      <LegalSection title="2. How We Use Your Data">
        <LegalList items={[
          'To provide Role-Based Access Control (RBAC): distinguishing between Admins/Execs, Sub-committee members, and general Members.',
          'To manage the Internal Planning Dashboard and assign tasks to the 50+ organizers.',
          'To facilitate the Internal Live Chat for society communication.',
        ]} />
      </LegalSection>
      <LegalSection title="3. Data Storage and Security">
        <LegalList items={[
          'User data and membership status are stored in a Supabase (PostgreSQL) database.',
          'Media assets and user uploads are stored securely on AWS S3.',
          'We follow standard security practices to protect the data of our 500+ members.',
        ]} />
      </LegalSection>
      <LegalSection title="4. Third-Party Services">
        <LegalParagraph>We use Google for authentication, Supabase for backend services, and AWS for image storage.</LegalParagraph>
      </LegalSection>
      <LegalSection title="5. Contact">
        <LegalParagraph>For any data inquiries, contact <a href="mailto:syedayanata@gmail.com" className="text-green-700 font-medium hover:underline">syedayanata@gmail.com</a>.</LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  )
}
