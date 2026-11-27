import { createElement } from 'react';
import type { LucideProps } from 'lucide-react';
import { CATEGORY_ICONS } from '../lib/constants';
import type { OfferCategory } from '../types';

/** The icon of a category; the person's own categories share the 'Other' icon. */
export const CategoryIcon = ({ category, ...props }: { category: string } & LucideProps) =>
    createElement(
        // An own-property check: a custom category may be named "constructor".
        CATEGORY_ICONS[Object.hasOwn(CATEGORY_ICONS, category) ? category as OfferCategory : 'Other'],
        props,
    );
