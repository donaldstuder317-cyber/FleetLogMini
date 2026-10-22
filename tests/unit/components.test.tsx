import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { StatusBadge } from '../../src/components/common/StatusBadge';
import { IntervalRing } from '../../src/components/common/IntervalRing';
import { Field } from '../../src/components/forms/Field';
import { Input } from '../../src/components/forms/controls';
import { FaultsCorrectedField } from '../../src/components/forms/FaultsCorrectedField';
import type { Fault } from '../../src/types';

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

describe('FaultsCorrectedField', () => {
  const faults: Fault[] = [
    { id: 'f1', assetId: 'a1', date: '2026-10-01', description: 'Brake line', deadline: true, cost: 120, correctedEntryId: null },
    { id: 'f2', assetId: 'a1', date: '2026-10-02', description: 'Mirror', deadline: false, cost: 0, correctedEntryId: null },
  ];

  it('starts at None and reports All / single picks', () => {
    const onChange = vi.fn();
    render(<FaultsCorrectedField faults={faults} selected={[]} onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Faults corrected' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'None' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'None' })).toHaveAttribute('aria-disabled', 'true'); // can't untick None
    expect(screen.getByRole('checkbox', { name: 'All' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Brake line/ })).toHaveAccessibleName(/Deadline/i);
    fireEvent.click(screen.getByRole('checkbox', { name: 'All' }));
    expect(onChange).toHaveBeenLastCalledWith(['f1', 'f2']);
    fireEvent.click(screen.getByRole('checkbox', { name: /Mirror/ }));
    expect(onChange).toHaveBeenLastCalledWith(['f2']);
  });

  it('shows All checked when every fault is picked, and None clears', () => {
    const onChange = vi.fn();
    render(<FaultsCorrectedField faults={faults} selected={['f1', 'f2']} onChange={onChange} />);
    expect(screen.getByRole('checkbox', { name: 'All' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'None' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'None' })).not.toHaveAttribute('aria-disabled');
    fireEvent.click(screen.getByRole('checkbox', { name: 'None' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('says so when the asset has no open faults', () => {
    render(<FaultsCorrectedField faults={[]} selected={[]} onChange={() => {}} />);
    expect(screen.getByText('No open faults')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
