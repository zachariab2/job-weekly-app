export type ManualContact = {
  company: string;
  role?: string;
  name: string;
  contactEmail?: string;
  contactLinkedin?: string;
  connectionBasis?: string;
};

// For your client ops workflow: add contacts here every cycle.
export const manualContacts: ManualContact[] = [
  // Example:
  // {
  //   company: "Stripe",
  //   role: "Software Engineering Intern",
  //   name: "Jane Doe",
  //   contactEmail: "jane@stripe.com",
  //   contactLinkedin: "https://linkedin.com/in/janedoe",
  //   connectionBasis: "Alumni — NYU CS '24",
  // },
];
