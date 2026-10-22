import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { EditEntryForm } from '../../src/components/forms/EditEntryForm';
import { EditFaultForm } from '../../src/components/forms/EditFaultForm';
import { EditIntervalForm } from '../../src/components/forms/EditIntervalForm';
import type { Fault, Schedule, ServiceEntry } from '../../src/types';

const schedule: Schedule = {
  id: 's1', assetId: 'a1', task: 'Oil change', interval: 5000, unit: 'mi', lastReading: 0, lastDate: '2026-01-01',
};
const entry: ServiceEntry = {
  id: 'e1', assetId: 'a1', task: 'Oil change', date: '2026-01-05', reading: 1000, partsCost: 20, notes: 'x',
};

describe('EditIntervalForm', () => {
  it('shows the error and saves nothing for an invalid interval', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditIntervalForm schedule={schedule} onSave={onSave} onCancel={() => {}} />);
    const input = screen.getByLabelText('Interval (miles)');
    for (const bad of ['0', '2.5']) {
      fireEvent.change(input, { target: { value: bad } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(await screen.findByText('Enter a whole number greater than 0')).toBeInTheDocument();
    }
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '3,000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(3000));
  });

  it('keeps the form open with "Couldn\'t save" when saving fails, and Escape cancels', async () => {
    const onCancel = vi.fn();
    render(<EditIntervalForm schedule={schedule} onSave={() => Promise.reject(new Error('x'))} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText("Couldn't save — try again")).toBeInTheDocument();
    expect(screen.getByLabelText('Interval (miles)')).toHaveValue('5000');
    fireEvent.keyDown(screen.getByLabelText('Interval (miles)'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('EditEntryForm', () => {
  it('shows the task read-only and rejects a reading above the asset', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditEntryForm entry={entry} unit="mi" maxReading={1500} onSave={onSave} onCancel={() => {}} />);
    expect(screen.getByText('Oil change')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Odometer (mi)'), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText("Reading can't be higher than the current reading (1,500)")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Odometer (mi)'), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: '  synthetic  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ date: '2026-01-05', reading: 1200, partsCost: 20, notes: 'synthetic' }),
    );
  });
});

describe('EditFaultForm', () => {
  const fault: Fault = {
    id: 'f1', assetId: 'a1', date: '2026-01-05', description: 'Leak', deadline: false, cost: 40, correctedEntryId: null,
  };

  it('edits cost and DEADLINE while the fault is open, and rejects a bad cost', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditFaultForm fault={fault} onSave={onSave} onCancel={() => {}} />);
    fireEvent.change(screen.getByLabelText('Cost ($)'), { target: { value: '1.999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter a valid cost')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Cost ($)'), { target: { value: '125.50' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /deadline/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ date: '2026-01-05', description: 'Leak', deadline: true, cost: 125.5 }),
    );
  });

  it('locks cost and DEADLINE on a corrected fault', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<EditFaultForm fault={{ ...fault, deadline: true, correctedEntryId: 'e1' }} onSave={onSave} onCancel={() => {}} />);
    expect(screen.queryByLabelText('Cost ($)')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/locked because this fault was corrected/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ date: '2026-01-05', description: 'Leak' }));
  });
});
