import { LegalPageLayout, LegalSection, LegalList, LegalParagraph } from './LegalPageLayout'

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service — UNSW PakSoc" effectiveDate="July 25, 2026">
      <LegalSection title="1. Acceptance of Terms">
        <LegalParagraph>By signing in to UNSW PakSoc, you agree to comply with these terms.</LegalParagraph>
      </LegalSection>
      <LegalSection title="2. Description of Service">
        <LegalParagraph>
          PakSoc UNSW provides event listings and details, venue location maps, and a feed of the society's
          own Instagram posts. Committee members additionally have access to role-based tools for managing
          events, assigning tasks, and administering member roles.
        </LegalParagraph>
      </LegalSection>
      <LegalSection title="3. User Conduct">
        <LegalList items={[
          'Role-based access: you must not attempt to bypass your assigned role (Admin, Sub-committee, or Member) to access data or tools you are not authorised to use.',
          'The event, map and Instagram feed features are provided for society information only.',
          'You must not misuse the platform or attempt to disrupt it for other members.',
        ]} />
      </LegalSection>
      <LegalSection title="4. Event Registration & Tickets">
        <LegalParagraph>
          Some events link out to registration or ticketing handled by external third-party services. Those
          services are operated independently and have their own terms and privacy policies.
        </LegalParagraph>
      </LegalSection>
      <LegalSection title="5. Limitation of Liability">
        <LegalParagraph>
          This is a student-led platform provided on an "as is" basis. UNSW PakSoc and its developers are not
          liable for temporary service interruptions or for inaccuracies in event or venue information.
        </LegalParagraph>
      </LegalSection>
      <LegalSection title="6. Governing Law">
        <LegalParagraph>These terms are governed by the laws of New South Wales, Australia.</LegalParagraph>
      </LegalSection>
    </LegalPageLayout>
  )
}
