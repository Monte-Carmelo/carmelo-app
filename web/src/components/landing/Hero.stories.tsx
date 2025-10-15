import type { Meta, StoryObj } from '@storybook/react';
import { Hero } from './Hero';

const meta: Meta<typeof Hero> = {
  title: 'Landing/Hero',
  component: Hero,
  args: {
    eyebrow: 'Carmelo Web',
    title: 'Gestão dos Grupos de Crescimento com foco em líderes e supervisores.',
    description:
      'Experiência web responsiva, mobile-first, apoiada pelo modelo de dados e contratos Supabase já validados.',
    primaryAction: {
      label: 'Configurar Supabase',
      href: 'https://supabase.com',
    },
    secondaryAction: {
      label: 'Ver roadmap',
      href: '/docs/roadmap',
    },
    highlight: [
      'Registro de reuniões com presença separada de membros e visitantes.',
      'Conversões de visitantes e dashboards hierárquicos em tempo real.',
    ],
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Hero>;

export const Default: Story = {};

export const SomenteAcaoPrimaria: Story = {
  args: {
    secondaryAction: undefined,
  },
};

export const SemDestaques: Story = {
  args: {
    highlight: [],
  },
};
