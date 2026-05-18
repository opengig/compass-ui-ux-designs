import React from 'react';
import { Checkbox as BaseCheckbox } from '../_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9';

type CheckboxProps = React.ComponentPropsWithoutRef<'button'> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

const StyledBaseCheckbox = BaseCheckbox as React.ComponentType<any>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  const emphasisClasses =
    'border-black/50 shadow-sm focus-within:ring-[4px] data-[checked]:shadow-md';

  return (
    <StyledBaseCheckbox
      className={`${emphasisClasses}${className ? ` ${className}` : ''}`}
      {...props}
    />
  );
}