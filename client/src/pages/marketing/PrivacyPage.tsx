import { LegalPage } from './LegalPage';

export function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="What we store, why we store it and how long we keep it."
      sections={[
        {
          heading: 'What we collect',
          body: [
            'Account data: the name, email address, optional phone number and the role of every person who signs in, together with the restaurant they belong to.',
            'Operational data: orders, payments, menu items, stock movements, reservations and customer records that your venue creates while using the product.',
            'Technical data: an audit trail of the requests that reached our API, including the acting account, the endpoint, the status code and the time it took.',
          ],
        },
        {
          heading: 'Why we collect it',
          body: [
            'Operational data exists to run your restaurant: to take orders, to fulfil them in the kitchen and to report on the result. It stays inside your restaurant.',
            'We never mix the data of one restaurant into another. Access to a venue is bound to the account that signed in, and the platform operator only sees the aggregated list of venues.',
          ],
        },
        {
          heading: 'Passwords',
          body: [
            'Passwords are never stored in plain text. We store a salted hash, and sessions are tracked server-side so that a password change or a deactivation ends every open session immediately.',
          ],
        },
        {
          heading: 'How long we keep it',
          body: [
            'Account and operational data is kept for as long as your restaurant is registered with us. Audit entries are trimmed automatically according to the retention period configured for your venue.',
          ],
        },
        {
          heading: 'Your choices',
          body: [
            'You can edit your own profile at any time, and the owner of a restaurant can deactivate employee accounts, reset their passwords and delete personal data that the product does not need to keep.',
          ],
        },
      ]}
    />
  );
}
