import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  { files: ['src/components/Pdf.tsx'], rules: { 'jsx-a11y/alt-text': 'off' } },
  { ignores: ['build/**', 'out/**', '.next/**', 'artifacts/**', 'next-env.d.ts'] },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react/no-unescaped-entities': 'warn'
    }
  }
]

export default config
