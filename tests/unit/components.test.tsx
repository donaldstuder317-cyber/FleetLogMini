import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { IntervalRing } from '../../src/components/common/IntervalRing';
import { Field } from '../../src/components/forms/Field';
import { Input } from '../../src/components/forms/controls';

describe('components', () => {
  it('StatusBadge shows icon + word, not color alone', () => {
    const { container } = render(<StatusBadge status="overdue" />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('IntervalRing exposes its value as text', () => {
    render(<IntervalRing percent={93.4} status="due" />);
    expect(screen.getByText('93%')).toBeInTheDocument();
  });

  it('Field renders a label and inline error', () => {
    render(
      <Field id="x" label="Odometer" error="Too low">
        <Input id="x" />
      </Field>,
    );
    expect(screen.getByLabelText('Odometer')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Too low');
  });
});
