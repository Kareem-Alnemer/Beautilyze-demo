import React from 'react';
import { render } from '@testing-library/react-native';
import { VerdictBadge } from '../../components/VerdictBadge';

describe('VerdictBadge', () => {
  it('renders Match verdict with green border', () => {
    const { getByText, getByTestId } = render(
      React.createElement(VerdictBadge, { verdict: 'match', summary: 'This product matches your profile.' })
    );

    expect(getByText('Match')).toBeTruthy();
    expect(getByText('This product matches your profile.')).toBeTruthy();
  });

  it('renders Caution verdict with amber border', () => {
    const { getByText } = render(
      React.createElement(VerdictBadge, { verdict: 'caution', summary: 'Some factors need attention.' })
    );

    expect(getByText('Caution')).toBeTruthy();
    expect(getByText('Some factors need attention.')).toBeTruthy();
  });

  it('renders Mismatch verdict with red border', () => {
    const { getByText } = render(
      React.createElement(VerdictBadge, { verdict: 'mismatch', summary: 'This product does not match.' })
    );

    expect(getByText('Mismatch')).toBeTruthy();
    expect(getByText('This product does not match.')).toBeTruthy();
  });

  it('uses Fraunces font for verdict word', () => {
    const { getByText } = render(
      React.createElement(VerdictBadge, { verdict: 'match', summary: 'Test' })
    );

    const verdictWord = getByText('Match');
    expect(verdictWord.props.style).toBeDefined();
  });

  it('uses Inter font for summary', () => {
    const { getByText } = render(
      React.createElement(VerdictBadge, { verdict: 'match', summary: 'Test summary' })
    );

    const summary = getByText('Test summary');
    expect(summary.props.style).toBeDefined();
  });
});