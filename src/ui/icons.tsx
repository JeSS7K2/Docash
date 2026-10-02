import React from 'react';
import * as Feather from 'react-native-feather';

type FeatherName = keyof typeof Feather;
type IconComponent = (props: {
  width?: number | string;
  height?: number | string;
  color?: string;
  strokeWidth?: number;
}) => React.JSX.Element;

// Categorías sistema -> icono Feather (sustituye los emojis del seed).
const CATEGORY_ICONS: Record<string, FeatherName> = {
  cat_food: 'Coffee',
  cat_transport: 'Truck',
  cat_home: 'Home',
  cat_fun: 'Film',
  cat_health: 'Heart',
  cat_clothes: 'ShoppingBag',
  cat_bills: 'Zap',
  cat_edu: 'Book',
  cat_other_exp: 'MoreHorizontal',
  cat_salary: 'Briefcase',
  cat_extra: 'Gift',
  cat_other_inc: 'MoreHorizontal',
};

const ACCOUNT_ICONS: Record<string, FeatherName> = {
  acc_cash: 'CreditCard',
  acc_bank: 'CreditCard',
};

function resolve(name: FeatherName): IconComponent {
  return (Feather as unknown as Record<string, IconComponent>)[name] ?? Feather.MoreHorizontal;
}

interface IconProps {
  id?: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function CategoryIcon({ id, color, size = 20, strokeWidth = 2 }: IconProps) {
  const FeatherIcon = resolve(CATEGORY_ICONS[id ?? ''] ?? 'MoreHorizontal');
  return <FeatherIcon width={size} height={size} color={color} strokeWidth={strokeWidth} />;
}

export function AccountIcon({ id, color, size = 20, strokeWidth = 2 }: IconProps) {
  const FeatherIcon = resolve(ACCOUNT_ICONS[id ?? ''] ?? 'CreditCard');
  return <FeatherIcon width={size} height={size} color={color} strokeWidth={strokeWidth} />;
}

/** Icono Feather arbitrario por nombre (para settings/acciones). */
export function Icon({
  name,
  color,
  size = 20,
  strokeWidth = 2,
}: IconProps & { name: FeatherName }) {
  const FeatherIcon = resolve(name);
  return <FeatherIcon width={size} height={size} color={color} strokeWidth={strokeWidth} />;
}
