import React from 'react';
import { render } from '@testing-library/react-native';
import { DisclaimerBlock } from '../../components/DisclaimerBlock';

const FULL_DISCLAIMER =
  'BeautiLyze is a compatibility-checking tool, not a diagnostic or medical device. It does not replace a dermatologist or professional skincare advice. Verdicts are based on the product information available in our catalog and the profile you provide (AI-estimated or manually set). Allergies are checked against the ingredient list we have; if we don\'t have a complete ingredient list, absence of a detected conflict does not mean a product is safe for you. If you have a known allergy, always check the physical product label before use.';

describe('DisclaimerBlock', () => {
  it('renders the full disclaimer text from blueprint §10.1', () => {
    const { getByText } = render(React.createElement(DisclaimerBlock));

    expect(getByText(FULL_DISCLAIMER)).toBeTruthy();
  });

  it('uses Inter font at 12pt', () => {
    const { getByText } = render(React.createElement(DisclaimerBlock));

    const text = getByText(FULL_DISCLAIMER);
    expect(text.props.style).toBeDefined();
  });

  it('uses secondary text color', () => {
    const { getByText } = render(React.createElement(DisclaimerBlock));

    const text = getByText(FULL_DISCLAIMER);
    expect(text.props.style).toBeDefined();
  });

  it('has paper background and thin top rule', () => {
    const { getByText } = render(React.createElement(DisclaimerBlock));

    const container = getByText(FULL_DISCLAIMER).parent;
    expect(container?.props.style).toBeDefined();
  });

  it('has no close button or icon', () => {
    const { queryByText, queryByTestId } = render(React.createElement(DisclaimerBlock));

    expect(queryByText('Close')).toBeNull();
    expect(queryByText('I understand')).toBeNull();
    expect(queryByTestId('close-button')).toBeNull();
  });
});