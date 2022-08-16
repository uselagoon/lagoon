import React from 'react';
import { action } from '@storybook/addon-actions';
import Accordion from './index';

export default {
    component: Accordion,
    title: 'Components/Accordion',
};

export const Default = () => (
    <Accordion columns={['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5']}>Some default body content.</Accordion>
);