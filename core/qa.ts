
export interface TestStep {
  command: string;
  // We can add explicit assertions here later, relying on AI verification for now
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
}

export const TEST_SUITES: TestSuite[] = [
  {
    id: 'smoke-01',
    name: 'Basic Smoke Test',
    description: 'Verifies standard component creation and property updates.',
    steps: [
      { command: 'Clear the app shell and add a main region' },
      { command: 'Add a header container to the main region' },
      { command: 'Add a primary button with label "Save" inside the header' },
      { command: 'Add a red "Delete" button next to the Save button' },
      { command: 'Add a text input field below the header' }
    ]
  },
  {
    id: 'complex-01',
    name: 'Dashboard Layout',
    description: 'Builds a complex grid layout with cards.',
    steps: [
      { command: 'Clear everything' },
      { command: 'Create a sidebar on the left and a content area on the right' },
      { command: 'Add 3 navigation buttons to the sidebar: Home, Analytics, Settings' },
      { command: 'In the content area, add a row with 2 statistic cards' },
      { command: 'Add a large chart container below the cards' }
    ]
  }
];
