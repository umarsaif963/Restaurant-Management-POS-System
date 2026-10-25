import { LegalPage } from './LegalPage';

export function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro="The agreement between you and the platform operator."
      sections={[
        {
          heading: 'Using the service',
          body: [
            'You need an account to use the product. You are responsible for the credentials of your own account and for the accounts you create for your staff.',
            'You may only use the service for a lawful business and you may not attempt to access data belonging to another restaurant.',
          ],
        },
        {
          heading: 'Your content',
          body: [
            'The menu, prices, recipes, customer records and reports you create stay yours. You grant us only the rights needed to operate, back up and display that content to the users of your own venue.',
          ],
        },
        {
          heading: 'Availability',
          body: [
            'We work hard to keep the service available, but we do not guarantee uninterrupted operation. Maintenance windows are announced in advance where possible.',
          ],
        },
        {
          heading: 'Plans and payment',
          body: [
            'Plans are billed manually by our team. There is no automatic charge and no long-term commitment - a change of plan takes effect on the next invoice.',
          ],
        },
        {
          heading: 'Ending the agreement',
          body: [
            'You can stop using the service and ask us to delete your restaurant at any time. We may suspend a restaurant that violates these terms or puts the platform at risk.',
          ],
        },
      ]}
    />
  );
}
