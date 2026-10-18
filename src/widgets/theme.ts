export interface WidgetPalette {
  paper: `#${string}`;
  ink: `#${string}`;
  muted: `#${string}`;
  faint: `#${string}`;
  track: `#${string}`;
  primary: `#${string}`;
  primarySoft: `#${string}`;
  income: `#${string}`;
  expense: `#${string}`;
  incomeSoft: `#${string}`;
  expenseSoft: `#${string}`;
  border: `#${string}`;
}

const LIGHT: WidgetPalette = {
  paper: '#FFFFFF',
  ink: '#1A1D21',
  muted: '#7A828E',
  faint: '#F1F3F6',
  track: '#E8EAF0',
  primary: '#3B5BFF',
  primarySoft: '#E9EDFF',
  income: '#2E7D32',
  expense: '#D32F2F',
  incomeSoft: '#E6F4EA',
  expenseSoft: '#FBEAEA',
  border: '#E8EAF0',
};

const DARK: WidgetPalette = {
  paper: '#121417',
  ink: '#F2F4F7',
  muted: '#9AA3AF',
  faint: '#1E232B',
  track: '#2A2F38',
  primary: '#7C93FF',
  primarySoft: '#1A2140',
  income: '#4ADE80',
  expense: '#FF6B6B',
  incomeSoft: '#12291B',
  expenseSoft: '#311A1C',
  border: '#2A2F38',
};

export const widgetPalette = (dark: boolean): WidgetPalette => (dark ? DARK : LIGHT);
